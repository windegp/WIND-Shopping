"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { Plus, Edit2, Trash2, ExternalLink, Loader2, X } from "lucide-react";

export default function CollectionsPage() {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '' });
    const [isSaving, setIsSaving] = useState(false);

    // 1. جلب البيانات واستخدام onSnapshot للتحديث اللحظي
    useEffect(() => {
        const q = query(collection(db, "collections"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setCollections(data);
            setLoading(false);
        }, (error) => {
            console.error("Firebase Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 2. دالة الحفظ (التي ستنشئ الكولكشن في فايربيز أوتوماتيكياً)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // تنظيف الـ slug: التأكد إنه بيبدأ بـ / ومفهوش مسافات
            let cleanSlug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
            if (!cleanSlug.startsWith('/')) {
                cleanSlug = `/${cleanSlug}`;
            }

            const collectionData = {
                name: formData.name.trim(),
                slug: cleanSlug,
                productCount: editingId ? (collections.find(c => c.id === editingId)?.productCount || 0) : 0,
                updatedAt: new Date()
            };

            if (editingId) {
                await updateDoc(doc(db, "collections", editingId), collectionData);
            } else {
                // هنا فايربيز هيكريت كولكشن "collections" لو مش موجود
                await addDoc(collection(db, "collections"), collectionData);
            }

            // إعادة تعيين الفورم
            setFormData({ name: '', slug: '' });
            setIsModalOpen(false);
            setEditingId(null);
        } catch (error) {
            console.error("Save Error:", error);
            alert("فشل الحفظ، تأكد من إعدادات Firebase Rules");
        } finally {
            setIsSaving(false);
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setFormData({ name: item.name, slug: item.slug });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm("هل أنت متأكد من حذف هذا القسم من WIND؟")) {
            try {
                await deleteDoc(doc(db, "collections", id));
            } catch (error) {
                alert("خطأ في الحذف");
            }
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-[#F5C518]">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-bold tracking-widest">تحميل مجموعات WIND...</p>
        </div>
    );

    return (
        <div className="p-6 bg-[#121212] min-h-screen text-white font-sans" dir="rtl">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-10 bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
                    <div>
                        <h1 className="text-2xl font-bold text-[#F5C518]">إدارة المجموعات</h1>
                        <p className="text-gray-400 text-sm mt-1">هنا تظهر الأقسام وتسمع في النافبار تلقائياً</p>
                    </div>
                    <button 
                        onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({name:'', slug:''}); }}
                        className="bg-[#F5C518] text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-500 transition active:scale-95"
                    >
                        <Plus size={20} /> إضافة كولكشن
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collections.map((item) => (
                        <div key={item.id} className="bg-[#1a1a1a] border border-[#333] p-5 rounded-xl hover:border-[#F5C518] transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-[#F5C518] transition-colors">{item.name}</h3>
                                    <span className="text-[10px] bg-black text-[#F5C518] px-2 py-1 rounded border border-[#F5C518]/30 mt-2 inline-block">
                                        {item.productCount || 0} قطعة
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => startEdit(item)} className="text-gray-500 hover:text-white transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-[11px] bg-black/50 p-2 rounded font-mono">
                                <ExternalLink size={12} />
                                <span className="truncate">URL: {item.slug}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[#F5C518]">{editingId ? 'تعديل الكولكشن' : 'كولكشن جديد لـ WIND'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">اسم القسم</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-black border border-[#333] p-3 rounded-lg text-white focus:border-[#F5C518] outline-none transition-all"
                                    placeholder="مثلاً: بناطيل جينز"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">الرابط (Slug)</label>
                                <input 
                                    required
                                    value={formData.slug}
                                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                    className="w-full bg-black border border-[#333] p-3 rounded-lg text-white focus:border-[#F5C518] outline-none text-left font-mono"
                                    dir="ltr"
                                    placeholder="/new-arrivals"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="flex-1 bg-[#F5C518] text-black font-black py-4 rounded-lg hover:bg-yellow-500 disabled:opacity-50 flex justify-center items-center"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}