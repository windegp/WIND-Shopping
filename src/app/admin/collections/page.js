"use client";
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Plus, Edit2, Trash2, Save, X, ExternalLink, Loader2 } from "lucide-react";

export default function CollectionsPage() {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '' });

    // جلب الأقسام من Firebase
    const fetchCollections = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "collections"), orderBy("name"));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCollections(data);
        } catch (error) {
            console.error("Error fetching collections:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCollections(); }, []);

    // حفظ أو تحديث القسم
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDoc(doc(db, "collections", editingId), formData);
            } else {
                await addDoc(collection(db, "collections"), { ...formData, productCount: 0 });
            }
            setIsModalOpen(false);
            setFormData({ name: '', slug: '' });
            setEditingId(null);
            fetchCollections();
        } catch (error) {
            alert("حدث خطأ أثناء الحفظ");
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setFormData({ name: item.name, slug: item.slug });
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-20 text-center text-[#F5C518] bg-[#121212] min-h-screen">جاري تحميل أقسام WIND...</div>;

    return (
        <div className="p-6 bg-[#121212] min-h-screen text-white font-sans" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10 bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
                    <div>
                        <h1 className="text-2xl font-bold">إدارة الكولكشن (الأقسام)</h1>
                        <p className="text-gray-400 text-sm mt-1">إدارة التصنيفات والروابط الخاصة بمتجر WIND</p>
                    </div>
                    <button 
                        onClick={() => { setIsModalOpen(true); setEditingId(null); }}
                        className="bg-[#F5C518] text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-500 transition"
                    >
                        <Plus size={20} /> إضافة قسم جديد
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collections.map((item) => (
                        <div key={item.id} className="bg-[#1a1a1a] border border-[#333] p-5 rounded-xl hover:border-[#F5C518] transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{item.name}</h3>
                                    <span className="text-[10px] bg-[#222] text-[#F5C518] px-2 py-1 rounded-full uppercase tracking-tighter">
                                        {item.productCount || 0} منتج
                                    </span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-white p-1"><Edit2 size={16} /></button>
                                    <button className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-xs bg-[#121212] p-2 rounded border border-[#222] overflow-hidden">
                                <ExternalLink size={12} />
                                <span className="truncate">{item.slug}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* مودال الإضافة والتعديل */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl w-full max-w-md shadow-2xl scale-in">
                        <h2 className="text-xl font-bold mb-6 text-[#F5C518]">{editingId ? 'تعديل القسم' : 'إضافة قسم جديد'}</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">اسم القسم (بالعربي)</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-[#121212] border border-[#333] p-3 rounded-lg text-white focus:border-[#F5C518] outline-none"
                                    placeholder="مثلاً: ملابس شتوية"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">الرابط (Slug)</label>
                                <input 
                                    required
                                    value={formData.slug}
                                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                    className="w-full bg-[#121212] border border-[#333] p-3 rounded-lg text-white focus:border-[#F5C518] outline-none dir-ltr"
                                    style={{ direction: 'ltr' }}
                                    placeholder="/women/winter-wear"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button type="submit" className="flex-1 bg-[#F5C518] text-black font-bold py-3 rounded-lg hover:bg-yellow-500">حفظ القسم</button>
                            <button type="button" onClick={() => setIsMenuOpen(false)} className="flex-1 bg-[#222] text-white py-3 rounded-lg border border-[#333]">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}