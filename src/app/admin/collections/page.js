"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, getDocs, writeBatch, where, documentId, arrayUnion, arrayRemove } from "firebase/firestore";
import { Plus, Edit2, Trash2, ExternalLink, Loader2, X, Save, Image as ImageIcon, Search, Check, ArrowRight, AlertCircle } from "lucide-react";

export default function CollectionsPage() {
    // --- State Management ---
    const [view, setView] = useState('list'); // 'list' or 'editor'
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // --- Editor State ---
    const [activeId, setActiveId] = useState(null);
    const [originalSlug, setOriginalSlug] = useState(""); // لحفظ الرابط القديم في حالة التغيير
    const [originalProductIds, setOriginalProductIds] = useState([]); // لمقارنة المحذوفات
    
    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        bottomDescription: '',
        image: ''
    });

    // Product Management State
    const [selectedProducts, setSelectedProducts] = useState([]); // المنتجات الموجودة حالياً في القسم
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- 1. Fetch Collections (Live) ---
    useEffect(() => {
        const q = query(collection(db, "collections"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- 2. Search Products Function ---
    // دالة للبحث عن المنتجات في قاعدة البيانات لإضافتها
    useEffect(() => {
        const searchProducts = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                // بحث بسيط (يمكن تطويره ليكون full-text search لو احتجت)
                // هنا بنجيب كل المنتجات ونفلتر (لأن فايرستور محدودة في البحث بالنص الجزئي)
                // الأفضل في الإنتاج استخدام Algolia، لكن هذا الكود كافي لعدد منتجات متوسط
                const q = query(collection(db, "products")); 
                const snapshot = await getDocs(q);
                const results = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(p => p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 10); // هات أول 10 نتايج بس
                
                setSearchResults(results);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchProducts, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);


    // --- 3. Handlers ---

    // فتح المحرر
    const openEditor = async (collectionItem = null) => {
        setSearchQuery("");
        setSearchResults([]);
        
        if (collectionItem) {
            setActiveId(collectionItem.id);
            setOriginalSlug(collectionItem.slug);
            
            setFormData({
                name: collectionItem.name || '',
                slug: collectionItem.slug || '',
                description: collectionItem.description || '',
                bottomDescription: collectionItem.bottomDescription || '',
                image: collectionItem.image || ''
            });

            // جلب المنتجات الموجودة بالفعل في هذا القسم
            setLoading(true);
            try {
                // نبحث عن المنتجات اللي الـ categories بتاعها فيه ال slug ده
                // ملاحظة: بنبحث بـ slug وبـ /slug لضمان التوافق
                const q = query(
                    collection(db, "products"), 
                    where("categories", "array-contains-any", [collectionItem.slug, `/${collectionItem.slug}`])
                );
                const snapshot = await getDocs(q);
                const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                setSelectedProducts(products);
                setOriginalProductIds(products.map(p => p.id)); // نحتفظ بالنسخة الأصلية عشان نعرف مين اتمسح
            } catch (error) {
                console.error("Error fetching collection products:", error);
            } finally {
                setLoading(false);
            }
        } else {
            // New Collection
            setActiveId(null);
            setOriginalSlug("");
            setOriginalProductIds([]);
            setSelectedProducts([]);
            setFormData({ name: '', slug: '', description: '', bottomDescription: '', image: '' });
        }
        setView('editor');
    };

    // إضافة منتج للقائمة
    const addProductToCollection = (product) => {
        // التأكد إنه مش موجود أصلاً
        if (!selectedProducts.find(p => p.id === product.id)) {
            setSelectedProducts([...selectedProducts, product]);
        }
        setSearchQuery(""); // تصفير البحث
        setSearchResults([]);
    };

    // حذف منتج من القائمة (UI Only - الحفظ الفعلي عند الضغط على Save)
    const removeProductFromCollection = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

    // --- 4. THE SAVE LOGIC (القلب النابض) ---
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // 1. Clean Slug
            let cleanSlug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
            if (!cleanSlug) cleanSlug = formData.name.trim().toLowerCase().replace(/\s+/g, '-');
            cleanSlug = cleanSlug.replace(/^\/+/, ''); // إزالة السلاش من البداية

            const collectionPayload = {
                name: formData.name.trim(),
                slug: cleanSlug,
                description: formData.description,
                bottomDescription: formData.bottomDescription,
                image: formData.image,
                updatedAt: new Date(),
                productCount: selectedProducts.length // تحديث العداد بناء على القائمة الحالية
            };

            const batch = writeBatch(db);

            // 2. Update/Create Collection Doc
            let targetRef;
            if (activeId) {
                targetRef = doc(db, "collections", activeId);
                batch.update(targetRef, collectionPayload);
            } else {
                targetRef = doc(collection(db, "collections"));
                batch.set(targetRef, collectionPayload);
            }

            // 3. Smart Product Updating (الإضافة والحذف)
            
            // أ) المنتجات الجديدة (موجودة في selected بس ماكانتش في original)
            const productsToAdd = selectedProducts.filter(p => !originalProductIds.includes(p.id));
            
            productsToAdd.forEach(product => {
                const productRef = doc(db, "products", product.id);
                // نضيف الـ slug والـ /slug عشان التوافق
                batch.update(productRef, {
                    categories: arrayUnion(cleanSlug, `/${cleanSlug}`) 
                });
            });

            // ب) المنتجات المحذوفة (كانت في original بس مش موجودة في selected)
            // دي الجزئية اللي كانت ناقصة عندك
            const productsToRemoveIds = originalProductIds.filter(id => !selectedProducts.find(p => p.id === id));
            
            productsToRemoveIds.forEach(id => {
                const productRef = doc(db, "products", id);
                // نمسح الـ slug (سواء القديم أو الجديد لو اتغير)
                // بنمسح كل الاحتمالات عشان نضمن التنظيف
                const slugsToRemove = [cleanSlug, `/${cleanSlug}`];
                if (originalSlug && originalSlug !== cleanSlug) {
                    slugsToRemove.push(originalSlug, `/${originalSlug}`);
                }
                
                batch.update(productRef, {
                    categories: arrayRemove(...slugsToRemove)
                });
            });

            await batch.commit();

            setView('list');
            alert("تم تحديث القسم والمنتجات بنجاح!");
        } catch (error) {
            console.error("Save Error:", error);
            alert("حدث خطأ أثناء الحفظ، راجع الكونسول");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCollection = async (id) => {
        if (confirm("تحذير: سيتم حذف القسم فقط. المنتجات ستبقى لكن سيتم إزالة اسم القسم منها. هل أنت متأكد؟")) {
           // في حالة حذف القسم بالكامل، يفضل تنظيف المنتجات أيضاً (اختياري)
           // للكود البسيط سنحذف القسم فقط الآن
            try {
                await deleteDoc(doc(db, "collections", id));
            } catch (err) {
                alert("خطأ في الحذف");
            }
        }
    };


    // --- Views ---
    if (loading && view === 'list') return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-[#F5C518]">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-bold tracking-widest">LOADING WIND CMS...</p>
        </div>
    );

    // --- EDITOR VIEW ---
    if (view === 'editor') {
        return (
            <div className="min-h-screen bg-[#121212] text-white pb-20" dir="rtl">
                {/* Navbar */}
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
                            حفظ التغييرات
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Right Column: Collection Info & Products */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 1. Basic Details */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4 text-[#F5C518]">بيانات القسم</h3>
                            <div className="space-y-4">
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:border-[#F5C518] outline-none placeholder-gray-600"
                                    placeholder="عنوان القسم (مثلاً: خصومات الشتاء)"
                                />
                                <textarea 
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:border-[#F5C518] outline-none resize-none placeholder-gray-600"
                                    placeholder="وصف مختصر يظهر تحت العنوان..."
                                />
                            </div>
                        </div>

                        {/* 2. Products Management (Search & Add) */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-[#F5C518]">المنتجات ({selectedProducts.length})</h3>
                                <span className="text-xs text-gray-400">ابحث وأضف</span>
                            </div>

                            {/* Search Bar */}
                            <div className="relative mb-6">
                                <Search className="absolute right-3 top-3 text-gray-500" size={18} />
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black border border-[#333] rounded-lg py-3 pr-10 pl-4 text-white focus:border-[#F5C518] outline-none"
                                    placeholder="ابحث عن منتج للإضافة..."
                                />
                                {/* Search Results Dropdown */}
                                {searchQuery.length >= 2 && (
                                    <div className="absolute w-full bg-[#222] border border-[#444] rounded-lg mt-1 z-10 max-h-60 overflow-y-auto shadow-2xl">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-gray-400"><Loader2 className="animate-spin inline mr-2"/> جاري البحث...</div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map(prod => {
                                                const isAlreadyAdded = selectedProducts.find(p => p.id === prod.id);
                                                return (
                                                    <div 
                                                        key={prod.id}
                                                        onClick={() => !isAlreadyAdded && addProductToCollection(prod)}
                                                        className={`p-3 border-b border-[#333] flex items-center gap-3 cursor-pointer transition ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed bg-black/50' : 'hover:bg-[#333]'}`}
                                                    >
                                                        <img src={prod.images?.[0] || '/placeholder.png'} className="w-8 h-8 rounded object-cover" alt="" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-gray-200">{prod.title}</p>
                                                            <p className="text-xs text-[#F5C518]">{prod.price} EGP</p>
                                                        </div>
                                                        {isAlreadyAdded ? <span className="text-xs text-green-500 font-bold">مضاف</span> : <Plus size={16} />}
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">لا توجد نتائج</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected Products List */}
                            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                {selectedProducts.length > 0 ? selectedProducts.map(prod => (
                                    <div key={prod.id} className="flex items-center justify-between bg-black/40 border border-[#333] p-3 rounded-lg group hover:border-gray-600 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-800">
                                                <img src={prod.images?.[0] || '/placeholder.png'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-200">{prod.title}</p>
                                                <p className="text-xs text-gray-500">{prod.category || 'عام'}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeProductFromCollection(prod.id)}
                                            className="text-gray-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition"
                                            title="إزالة من القسم"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 border border-dashed border-[#333] rounded-lg">
                                        <p className="text-gray-500 text-sm">لم يتم إضافة منتجات لهذا القسم بعد.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Left Column: Settings */}
                    <div className="space-y-6">
                        {/* Image */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">صورة الكولكشن</h3>
                            <div className="border-2 border-dashed border-[#333] rounded-lg p-2 flex flex-col items-center justify-center min-h-[150px] bg-black mb-3 overflow-hidden relative">
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded" />
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <ImageIcon size={30} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-[10px]">Preview</p>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="url" 
                                value={formData.image}
                                onChange={(e) => setFormData({...formData, image: e.target.value})}
                                className="w-full bg-black border border-[#333] rounded p-2 text-xs text-white focus:border-[#F5C518] outline-none font-mono text-left"
                                placeholder="https://i.ibb.co/..."
                                dir="ltr"
                            />
                        </div>

                        {/* Slug */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">رابط الصفحة (Slug)</h3>
                            <input 
                                type="text" 
                                value={formData.slug}
                                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                className="w-full bg-black border border-[#333] rounded p-2 text-sm text-white focus:border-[#F5C518] outline-none font-mono text-left"
                                placeholder="new-arrivals"
                                dir="ltr"
                            />
                            {originalSlug && formData.slug !== originalSlug && (
                                <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded flex gap-2 items-start">
                                    <AlertCircle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-yellow-500/80 leading-tight">
                                        تغيير الرابط سيؤدي لتحديث كل المنتجات المضافة للرابط القديم {originalSlug}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- LIST VIEW ---
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
                        onClick={() => openEditor(null)}
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
                                        <button onClick={() => handleDeleteCollection(item.id)} className="p-2 bg-[#222] rounded-lg hover:bg-red-600 hover:text-white transition text-gray-400">
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