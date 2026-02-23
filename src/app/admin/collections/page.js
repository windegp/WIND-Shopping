"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, doc, query, orderBy, onSnapshot, getDocs, writeBatch, where, arrayUnion, arrayRemove } from "firebase/firestore";
import { Plus, Edit2, Trash2, ExternalLink, Loader2, X, Save, Image as ImageIcon, Search, ArrowRight, AlertCircle, CheckSquare, Square } from "lucide-react";

export default function CollectionsPage() {
    const [view, setView] = useState('list');
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [activeId, setActiveId] = useState(null);
    const [originalSlug, setOriginalSlug] = useState(""); 
    const [originalProductIds, setOriginalProductIds] = useState([]); 
    
    // --- 1. تحديث الـ Form Data ---
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        subtitle: '', // الوصف الفرعي الجديد
        description: '',
        bottomDescription: '', // وصف الـ SEO السفلي
        image: ''
    });

    // --- 2. إدارة نافذة المنتجات العريضة (Modal) ---
    const [selectedProducts, setSelectedProducts] = useState([]); 
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [allProducts, setAllProducts] = useState([]); // لحفظ كل المنتجات في المودال
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "collections"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // جلب المنتجات للمودال
    useEffect(() => {
        if (!isProductModalOpen) return;
        const fetchAllProducts = async () => {
            setIsSearching(true);
            try {
                const q = query(collection(db, "products")); 
                const snapshot = await getDocs(q);
                setAllProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Fetch products error:", error);
            } finally {
                setIsSearching(false);
            }
        };
        fetchAllProducts();
    }, [isProductModalOpen]);

    const openEditor = async (collectionItem = null) => {
        if (collectionItem) {
            setActiveId(collectionItem.id);
            setOriginalSlug(collectionItem.slug);
            setFormData({
                name: collectionItem.name || '',
                slug: collectionItem.slug || '',
                subtitle: collectionItem.subtitle || '',
                description: collectionItem.description || '',
                bottomDescription: collectionItem.bottomDescription || '',
                image: collectionItem.image || ''
            });

            setLoading(true);
            try {
                const q = query(collection(db, "products"), where("categories", "array-contains-any", [collectionItem.slug, `/${collectionItem.slug}`]));
                const snapshot = await getDocs(q);
                const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSelectedProducts(products);
                setOriginalProductIds(products.map(p => p.id)); 
            } catch (error) { console.error(error); } 
            finally { setLoading(false); }
        } else {
            setActiveId(null);
            setOriginalSlug("");
            setOriginalProductIds([]);
            setSelectedProducts([]);
            setFormData({ name: '', slug: '', subtitle: '', description: '', bottomDescription: '', image: '' });
        }
        setView('editor');
    };

    // دالة التحديد والـ Checkbox
    const toggleProductSelection = (product) => {
        const isSelected = selectedProducts.find(p => p.id === product.id);
        if (isSelected) {
            setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
        } else {
            setSelectedProducts([...selectedProducts, product]);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let cleanSlug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
            if (!cleanSlug) cleanSlug = formData.name.trim().toLowerCase().replace(/\s+/g, '-');
            cleanSlug = cleanSlug.replace(/^\/+/, '');

            const collectionPayload = {
                name: formData.name.trim(),
                slug: cleanSlug,
                subtitle: formData.subtitle.trim(),
                description: formData.description,
                bottomDescription: formData.bottomDescription,
                image: formData.image,
                updatedAt: new Date(),
                productCount: selectedProducts.length
            };

            const batch = writeBatch(db);
            let targetRef = activeId ? doc(db, "collections", activeId) : doc(collection(db, "collections"));
            activeId ? batch.update(targetRef, collectionPayload) : batch.set(targetRef, collectionPayload);

            const productsToAdd = selectedProducts.filter(p => !originalProductIds.includes(p.id));
            productsToAdd.forEach(product => {
                batch.update(doc(db, "products", product.id), { categories: arrayUnion(cleanSlug, `/${cleanSlug}`) });
            });

            if (originalSlug) {
                const productsToCleanIds = [...new Set([...originalProductIds, ...selectedProducts.map(p => p.id)])];
                productsToCleanIds.forEach(id => {
                    const productRef = doc(db, "products", id);
                    const isStillSelected = selectedProducts.find(p => p.id === id);
                    batch.update(productRef, { categories: arrayRemove(originalSlug, `/${originalSlug}`) });
                    if (isStillSelected) batch.update(productRef, { categories: arrayUnion(cleanSlug, `/${cleanSlug}`) });
                });
            } else {
                const productsToRemoveIds = originalProductIds.filter(id => !selectedProducts.find(p => p.id === id));
                productsToRemoveIds.forEach(id => {
                    batch.update(doc(db, "products", id), { categories: arrayRemove(cleanSlug, `/${cleanSlug}`) });
                });
            }

            await batch.commit();
            setView('list');
            alert("تم التحديث بنجاح!");
        } catch (error) { alert("حدث خطأ أثناء الحفظ"); } 
        finally { setIsSaving(false); }
    };

    const handleDeleteCollection = async (id, slug) => {
        if (confirm("تحذير: سيتم حذف القسم وإزالة ارتباطه بكافة المنتجات. هل أنت متأكد؟")) {
            try {
                const batch = writeBatch(db);
                batch.delete(doc(db, "collections", id));
                const q = query(collection(db, "products"), where("categories", "array-contains-any", [slug, `/${slug}`]));
                const snapshot = await getDocs(q);
                snapshot.docs.forEach(productDoc => {
                    batch.update(doc(db, "products", productDoc.id), { categories: arrayRemove(slug, `/${slug}`) });
                });
                await batch.commit();
            } catch (err) { alert("خطأ في الحذف"); }
        }
    };

    // تصفية المنتجات في المودال بناءً على البحث
    const filteredProducts = allProducts.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading && view === 'list') return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-[#F5C518]">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-bold tracking-widest">LOADING WIND CMS...</p>
        </div>
    );

    if (view === 'editor') {
        return (
            <div className="min-h-screen bg-[#121212] text-white pb-20" dir="rtl">
                {/* Navbar */}
                <div className="sticky top-0 z-40 bg-[#1a1a1a] border-b border-[#333] px-6 py-4 flex justify-between items-center shadow-lg">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="text-gray-400 hover:text-white transition"><ArrowRight size={24} /></button>
                        <h1 className="text-xl font-bold">{activeId ? `تعديل: ${formData.name}` : 'إضافة قسم جديد'}</h1>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleSave} disabled={isSaving} className="bg-[#F5C518] text-black px-8 py-2 rounded-lg font-black flex items-center gap-2 hover:bg-white transition disabled:opacity-50">
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} حفظ التغييرات
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 1. Basic Details */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4 text-[#F5C518]">البيانات الأساسية</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">عنوان القسم الرئيسي</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:border-[#F5C518] outline-none" placeholder="مثلاً: الشيلان" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">الوصف الفرعي (تحت العنوان)</label>
                                    <input type="text" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:border-[#F5C518] outline-none" placeholder="مثلاً: WIND ESSENTIALS" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">الوصف المختصر</label>
                                    <textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:border-[#F5C518] outline-none resize-none" placeholder="يظهر أسفل العنوان الرئيسي..." />
                                </div>
                            </div>
                        </div>

                        {/* 2. SEO Bottom Description */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-2 text-[#F5C518]">وصف الـ SEO (أسفل الصفحة)</h3>
                            <p className="text-xs text-gray-500 mb-4">هذا النص سيظهر في أسفل صفحة القسم لتحسين محركات البحث، وسيتم طيه تلقائياً بزر "اقرأ المزيد".</p>
                            <textarea 
                                rows={6} 
                                value={formData.bottomDescription} 
                                onChange={(e) => setFormData({...formData, bottomDescription: e.target.value})} 
                                className="w-full bg-black border border-[#333] rounded-lg p-4 text-sm text-gray-300 focus:border-[#F5C518] outline-none resize-y" 
                                placeholder="اكتب وصفاً طويلاً يحتوي على الكلمات المفتاحية هنا..." 
                            />
                        </div>

                        {/* 3. Products Summary Card */}
                        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#222] border border-[#333] rounded-xl p-6 flex justify-between items-center shadow-lg">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">المنتجات المرتبطة</h3>
                                <p className="text-sm text-gray-400">القسم يحتوي حالياً على <span className="text-[#F5C518] font-bold">{selectedProducts.length}</span> منتج.</p>
                            </div>
                            <button 
                                onClick={() => setIsProductModalOpen(true)}
                                className="bg-[#333] border border-[#444] text-white hover:text-black hover:bg-[#F5C518] px-6 py-3 rounded-lg font-bold transition-all"
                            >
                                إدارة المنتجات
                            </button>
                        </div>
                    </div>

                    {/* Left Column: Settings */}
                    <div className="space-y-6">
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">صورة الكولكشن</h3>
                            <div className="border-2 border-dashed border-[#333] rounded-lg flex flex-col items-center justify-center h-48 bg-black mb-3 overflow-hidden">
                                {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded" /> : <ImageIcon size={30} className="text-gray-600" />}
                            </div>
                            <input type="url" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full bg-black border border-[#333] rounded p-2 text-xs text-white outline-none font-mono" placeholder="رابط الصورة..." dir="ltr" />
                        </div>

                        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">رابط الصفحة (Slug)</h3>
                            <input type="text" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="w-full bg-black border border-[#333] rounded p-2 text-sm text-white focus:border-[#F5C518] outline-none font-mono" dir="ltr" />
                        </div>
                    </div>
                </div>

                {/* --- نافذة إدارة المنتجات (Modal) --- */}
                {isProductModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}></div>
                        <div className="bg-[#111] border border-[#333] w-full max-w-5xl h-[85vh] rounded-2xl relative z-10 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                            
                            {/* Header المودال */}
                            <div className="p-6 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a] rounded-t-2xl">
                                <div>
                                    <h2 className="text-2xl font-black text-[#F5C518]">اختيار المنتجات</h2>
                                    <p className="text-sm text-gray-400 mt-1">تم اختيار {selectedProducts.length} منتج</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-64 md:w-80">
                                        <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="ابحث عن منتج..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-black border border-[#444] rounded-lg py-2 pr-10 pl-4 text-sm text-white focus:border-[#F5C518] outline-none"
                                        />
                                    </div>
                                    <button onClick={() => setIsProductModalOpen(false)} className="bg-[#333] hover:bg-white hover:text-black p-2 rounded-lg transition-colors"><X size={20}/></button>
                                </div>
                            </div>

                            {/* شبكة المنتجات مع Checkboxes */}
                            <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">
                                {isSearching ? (
                                    <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-[#F5C518]" size={40} /></div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {/* نعرض المنتجات المختارة في الأول لو مفيش بحث */}
                                        {(searchQuery ? filteredProducts : allProducts).map(prod => {
                                            const isSelected = selectedProducts.find(p => p.id === prod.id);
                                            return (
                                                <div 
                                                    key={prod.id} 
                                                    onClick={() => toggleProductSelection(prod)}
                                                    className={`cursor-pointer group relative border-2 rounded-xl overflow-hidden transition-all duration-200 ${isSelected ? 'border-[#F5C518] bg-[#F5C518]/10' : 'border-[#333] bg-[#1a1a1a] hover:border-gray-500'}`}
                                                >
                                                    <div className="h-40 bg-black relative">
                                                        <img src={prod.images?.[0] || '/placeholder.png'} className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'}`} alt="" />
                                                        <div className="absolute top-2 right-2 bg-black/50 rounded-lg p-1">
                                                            {isSelected ? <CheckSquare className="text-[#F5C518]" size={20} /> : <Square className="text-gray-400" size={20} />}
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <p className="text-xs font-bold text-white truncate">{prod.title}</p>
                                                        <p className="text-[10px] text-[#F5C518] mt-1">{prod.price} EGP</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer المودال */}
                            <div className="p-4 border-t border-[#333] bg-[#1a1a1a] rounded-b-2xl text-left">
                                <button onClick={() => setIsProductModalOpen(false)} className="bg-[#F5C518] text-black px-8 py-2 rounded-lg font-black hover:bg-white transition-colors">
                                    تأكيد وإغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- LIST VIEW ---
    return (
        <div className="p-6 bg-[#121212] min-h-screen text-white font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Collections</h1>
                        <p className="text-[#F5C518] font-bold tracking-[0.3em] text-xs mt-2">WIND CONTROL PANEL</p>
                    </div>
                    <button onClick={() => openEditor(null)} className="bg-[#F5C518] text-black px-8 py-3 rounded-full font-black flex items-center gap-2 hover:bg-white transition shadow-lg">
                        <Plus size={20} /> كولكشن جديد
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {collections.map((item) => (
                        <div key={item.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden group hover:border-[#F5C518] flex flex-col">
                            <div className="h-40 bg-black relative">
                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" /> : <div className="w-full h-full flex items-center justify-center bg-[#222]"><ImageIcon className="text-gray-600" size={30} /></div>}
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                                <p className="text-gray-500 text-xs line-clamp-2 mb-4 flex-1">{item.description}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-[#333]">
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditor(item)} className="p-2 bg-[#222] rounded-lg hover:bg-[#F5C518] hover:text-black transition text-gray-400"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteCollection(item.id, item.slug)} className="p-2 bg-[#222] rounded-lg hover:bg-red-600 hover:text-white transition text-gray-400"><Trash2 size={16} /></button>
                                    </div>
                                    <a href={`/collections/${item.slug}`} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-[#F5C518] flex items-center gap-1">عرض <ExternalLink size={10} /></a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}