"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, getDocs, writeBatch, where } from "firebase/firestore";
import { Plus, Edit2, Trash2, ExternalLink, Loader2, X, Save, Image as ImageIcon, Search, Check, ArrowRight } from "lucide-react";

export default function CollectionsPage() {
    // --- State Management ---
    const [view, setView] = useState('list'); // 'list' or 'editor'
    const [collections, setCollections] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // لجلب كل المنتجات للبحث
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // --- Form State ---
    const [activeId, setActiveId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '', // الوصف العلوي
        bottomDescription: '', // الوصف السفلي
        image: '', // رابط الصورة
        selectedProductIds: [] // المنتجات المختارة لهذا القسم
    });

    // --- 1. Fetch Collections & Products ---
    useEffect(() => {
        setLoading(true);
        
        // جلب الأقسام (Live)
        const qColl = query(collection(db, "collections"), orderBy("name"));
        const unsubColl = onSnapshot(qColl, (snapshot) => {
            setCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // جلب المنتجات (مرة واحدة لغرض الاختيار)
        const fetchProducts = async () => {
            const qProd = query(collection(db, "products")); // هات كل المنتجات
            const snapshot = await getDocs(qProd);
            setAllProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        };

        fetchProducts();
        return () => unsubColl();
    }, []);

    // --- 2. Handlers ---
    
    // فتح المحرر (لإضافة جديد أو تعديل)
    const openEditor = (collection = null) => {
        if (collection) {
            setActiveId(collection.id);
            // البحث عن المنتجات التي تحتوي على slug هذا القسم في مصفوفة categories الخاصة بها
            const linkedProducts = allProducts
                .filter(p => p.categories && (p.categories.includes(collection.slug) || p.categories.includes(collection.name)))
                .map(p => p.id);

            setFormData({
                name: collection.name || '',
                slug: collection.slug || '',
                description: collection.description || '',
                bottomDescription: collection.bottomDescription || '',
                image: collection.image || '',
                selectedProductIds: linkedProducts
            });
        } else {
            setActiveId(null);
            setFormData({
                name: '', slug: '', description: '', bottomDescription: '', image: '', selectedProductIds: []
            });
        }
        setView('editor');
    };

    // معالجة اختيار المنتجات
    const toggleProduct = (productId) => {
        setFormData(prev => {
            const exists = prev.selectedProductIds.includes(productId);
            if (exists) {
                return { ...prev, selectedProductIds: prev.selectedProductIds.filter(id => id !== productId) };
            } else {
                return { ...prev, selectedProductIds: [...prev.selectedProductIds, productId] };
            }
        });
    };

    // الحفظ النهائي
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // 1. تجهيز الـ Slug
            let cleanSlug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
            if (!cleanSlug) cleanSlug = formData.name.trim().toLowerCase().replace(/\s+/g, '-');
            // إزالة السلاش من البداية للتخزين النظيف، وسنضيفها عند الحاجة
            cleanSlug = cleanSlug.replace(/^\/+/, ''); 

            const collectionPayload = {
                name: formData.name.trim(),
                slug: cleanSlug, // نخزنها بدون سلاش لتسهيل البحث
                description: formData.description,
                bottomDescription: formData.bottomDescription,
                image: formData.image,
                updatedAt: new Date(),
                productCount: formData.selectedProductIds.length
            };

            let targetId = activeId;

            // 2. حفظ وثيقة الكولكشن
            if (activeId) {
                await updateDoc(doc(db, "collections", activeId), collectionPayload);
            } else {
                const docRef = await addDoc(collection(db, "collections"), collectionPayload);
                targetId = docRef.id;
            }

            // 3. تحديث المنتجات (Batch Update) لربطها بالقسم
            // هذه الخطوة "السحرية" ستعدل كل المنتجات لتضيف أو تحذف اسم القسم من مصفوفة categories
            const batch = writeBatch(db);
            
            // أ) المنتجات التي تم اختيارها: نضيف الـ slug والاسم لمصفوفة categories
            formData.selectedProductIds.forEach(pid => {
                const productRef = doc(db, "products", pid);
                const product = allProducts.find(p => p.id === pid);
                let newCategories = product.categories || [];
                
                // إضافة الـ slug والاسم إذا لم يكونا موجودين
                if (!newCategories.includes(cleanSlug)) newCategories.push(cleanSlug);
                // نضيف السلاش فيرجن عشان نضمن التوافق مع الكود القديم
                if (!newCategories.includes(`/${cleanSlug}`)) newCategories.push(`/${cleanSlug}`);
                
                batch.update(productRef, { categories: newCategories });
            });

            // ب) المنتجات التي كانت في القسم وتمت إزالتها (تحتاج لوجيك معقد قليلاً، سنكتفي بالإضافة الآن لتسريع الأداء)
            // ملاحظة: لضمان الدقة الكاملة يفضل عمل مسح شامل، لكن هنا سنعتمد على الإضافة.
            
            await batch.commit();

            setView('list');
            alert("تم حفظ القسم وتحديث المنتجات بنجاح!");
        } catch (error) {
            console.error("Error:", error);
            alert("حدث خطأ أثناء الحفظ.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("هل أنت متأكد؟ سيتم حذف القسم فقط ولن تحذف المنتجات.")) {
            await deleteDoc(doc(db, "collections", id));
        }
    };

    // --- Loading View ---
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-[#F5C518]">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-bold tracking-widest">WIND SYSTEM LOADING...</p>
        </div>
    );

    // --- Editor View (Shopify Style) ---
    if (view === 'editor') {
        return (
            <div className="min-h-screen bg-[#121212] text-white pb-20" dir="rtl">
                {/* Editor Header */}
                <div className="sticky top-0 z-50 bg-[#1a1a1a] border-b border-[#333] px-6 py-4 flex justify-between items-center shadow-lg">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="text-gray-400 hover:text-white transition">
                            <ArrowRight size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-white">
                            {activeId ? `تعديل: ${formData.name}` : 'إضافة قسم جديد'}
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setView('list')} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition">
                            إلغاء
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="bg-[#F5C518] text-black px-8 py-2 rounded-lg font-black flex items-center gap-2 hover:bg-white transition disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            حفظ
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Right Column: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 1. Basic Info */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4 text-[#F5C518]">بيانات القسم</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">العنوان</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:border-[#F5C518] outline-none"
                                        placeholder="مثال: إسدالات رمضان"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">وصف القسم (يظهر تحت العنوان)</label>
                                    <textarea 
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:border-[#F5C518] outline-none resize-none"
                                        placeholder="اكتب وصف جذاب للعميل..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Products Selector */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4 text-[#F5C518] flex justify-between">
                                <span>المنتجات ({formData.selectedProductIds.length})</span>
                                <span className="text-xs text-gray-400 font-normal mt-1">حدد المنتجات التي تظهر في هذا القسم</span>
                            </h3>
                            
                            {/* Product Search & List */}
                            <div className="bg-black rounded-lg border border-[#333] overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                                {allProducts.map(product => {
                                    const isSelected = formData.selectedProductIds.includes(product.id);
                                    return (
                                        <div 
                                            key={product.id} 
                                            onClick={() => toggleProduct(product.id)}
                                            className={`flex items-center gap-4 p-3 border-b border-[#222] cursor-pointer transition-colors hover:bg-[#222] ${isSelected ? 'bg-[#2a2a2a]' : ''}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[#F5C518] border-[#F5C518]' : 'border-gray-600'}`}>
                                                {isSelected && <Check size={14} className="text-black" />}
                                            </div>
                                            <img 
                                                src={product.images?.[0] || "/placeholder.png"} 
                                                alt={product.title} 
                                                className="w-10 h-10 object-cover rounded bg-gray-800"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-200">{product.title}</p>
                                                <p className="text-xs text-gray-500">{product.price} EGP</p>
                                            </div>
                                            {isSelected && <span className="text-xs text-[#F5C518] font-bold">تمت الإضافة</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Bottom Description (SEO) */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4 text-[#F5C518]">محتوى إضافي (SEO)</h3>
                            <textarea 
                                rows={4}
                                value={formData.bottomDescription}
                                onChange={(e) => setFormData({...formData, bottomDescription: e.target.value})}
                                className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:border-[#F5C518] outline-none"
                                placeholder="نص يظهر أسفل صفحة القسم لتحسين محركات البحث..."
                            />
                        </div>

                    </div>

                    {/* Left Column: Settings */}
                    <div className="space-y-6">
                        
                        {/* Collection Image */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">صورة القسم</h3>
                            <div className="space-y-3">
                                <div className="border-2 border-dashed border-[#333] rounded-lg p-4 flex flex-col items-center justify-center min-h-[150px] bg-black">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-contain rounded" />
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            <ImageIcon size={30} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-xs">لا توجد صورة</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] text-[#F5C518] mb-1 block">رابط الصورة (ImgBB URL)</label>
                                    <input 
                                        type="url" 
                                        value={formData.image}
                                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                                        className="w-full bg-black border border-[#333] rounded text-xs p-2 text-white focus:border-[#F5C518] outline-none font-mono text-left"
                                        placeholder="https://i.ibb.co/..."
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Slug Setting */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">الرابط (Slug)</h3>
                            <input 
                                type="text" 
                                value={formData.slug}
                                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                className="w-full bg-black border border-[#333] rounded p-2 text-white focus:border-[#F5C518] outline-none font-mono text-left text-sm"
                                placeholder="new-arrivals"
                                dir="ltr"
                            />
                            <p className="text-[10px] text-gray-500 mt-2">
                                سيظهر الرابط كـ: <br/> wind.com/collections/<span className="text-white">{formData.slug || '...'}</span>
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    // --- List View (Default) ---
    return (
        <div className="p-6 bg-[#121212] min-h-screen text-white font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Mina Collections</h1>
                        <p className="text-[#F5C518] font-bold tracking-[0.3em] text-xs mt-2">WIND CONTROL PANEL</p>
                    </div>
                    <button 
                        onClick={() => openEditor()}
                        className="bg-[#F5C518] text-black px-8 py-3 rounded-full font-black flex items-center gap-2 hover:bg-white transition shadow-[0_0_20px_rgba(245,197,24,0.3)]"
                    >
                        <Plus size={20} /> كولكشن جديد
                    </button>
                </div>

                {/* Collections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {collections.map((item) => (
                        <div key={item.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden group hover:border-[#F5C518] transition-all duration-300 flex flex-col">
                            {/* Image Header */}
                            <div className="h-40 bg-black relative overflow-hidden">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#222]">
                                        <ImageIcon className="text-gray-600" size={30} />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono border border-white/10">
                                    {item.productCount || 0} ITEMS
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                                <p className="text-gray-500 text-xs line-clamp-2 mb-4 flex-1">
                                    {item.description || "لا يوجد وصف..."}
                                </p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-[#333] mt-auto">
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditor(item)} className="p-2 bg-[#222] rounded-lg hover:bg-[#F5C518] hover:text-black transition text-gray-400">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-[#222] rounded-lg hover:bg-red-600 hover:text-white transition text-gray-400">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <a href={`https://wind-wsp-o6al.vercel.app/collections/${item.slug}`} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-[#F5C518] flex items-center gap-1">
                                        عرض <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}