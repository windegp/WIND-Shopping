"use client";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, getDocs, deleteDoc, query, where, increment } from "firebase/firestore";
import { useState, useEffect, Suspense } from 'react';
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
// استيراد مكون الرفع الذي أنشأناه لـ ImageKit
import ImageUploader from "@/components/admin/ImageUploader";

export default function CreateProductPage() {
  return (
    <Suspense fallback={<div className="text-white text-center p-10">جاري تحميل بيانات WIND...</div>}>
      <ProductFormContent />
    </Suspense>
  );
}

function ProductFormContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id || searchParams.get('id'); 
  
  const [loading, setLoading] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [availableCollections, setAvailableCollections] = useState([]);

  // الحفاظ على الخصائص الأصلية مع إضافة حقول شوبيفاي العميقة
  const [product, setProduct] = useState({
    title: '', description: '', price: '', compareAtPrice: '',
    costPerItem: '', sku: '', quantity: 0, 
    categories: [], 
    tags: '', sizes: '', seoTitle: '', seoDesc: '', handle: '',
    mainImageUrl: '',
    seoCategory: '',
    // إضافات شوبيفاي العميقة بناءً على الملف
    suggestedProducts: '', 
    status: 'active',
    vendor: 'WIND',
  });

  // قائمة الألوان المستخلصة من الشيت (fuchsia, jeans-blue, beige, الخ)
  const shopifyColors = ["fuchsia", "jeans-blue", "beige", "clear", "green", "black", "burgundy", "rose"];

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [colorVariants, setColorVariants] = useState([]);

  const [chartHeaders, setChartHeaders] = useState({
    col1: 'المقاس', col2: 'الطول', col3: 'الصدر', col4: 'الوسط', col5: 'الوزن (كجم)'
  });
  const [sizeChart, setSizeChart] = useState([
    { size: 'S', length: '', chest: '', waist: '', weight: '' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const colSnapshot = await getDocs(collection(db, "collections"));
        setAvailableCollections(colSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        if (id) {
          const docRef = doc(db, "products", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProduct({ ...data, id: docSnap.id });
            if (data.options?.chartHeaders) setChartHeaders({ ...data.options.chartHeaders });
            if (data.options?.sizeChart) setSizeChart([...data.options.sizeChart]);
            if (data.options?.colors) setColorVariants([...data.options.colors]);
            if (data.images) setPreviews([...data.images]);
          }
        }

        const querySnapshot = await getDocs(collection(db, "products"));
        setProductsList(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [id]);

  // دالة استقبال رابط الصورة من ImageKit وإضافتها للمعاينة (بدون مسح الصور القديمة)
  const handleImageKitSuccess = (url) => {
    setPreviews(prev => [...prev, url]);
  };

  const onDragEndImages = (result) => {
    if (!result.destination) return;
    const items = Array.from(previews);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setPreviews(items);
  };

  const onDragEndColors = (result) => {
    if (!result.destination) return;
    const items = Array.from(colorVariants);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setColorVariants(items);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    // تحسين إنشاء الـ Handle ليتناسب مع روابط شوبيفاي
    if (name === 'title' && !product.handle) {
      setProduct(prev => ({ ...prev, handle: value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\u0621-\u064A0-9-a-z-]/g, '') }));
    }
  };

  const handleImageUrlKeyDown = (e) => {
    if (e.key === 'Enter' && product.mainImageUrl.trim() !== '') {
      e.preventDefault(); 
      if (!previews.includes(product.mainImageUrl)) {
        setPreviews(prev => [...prev, product.mainImageUrl]);
        setProduct(prev => ({ ...prev, mainImageUrl: '' }));
      }
    }
  };

  const handleCategoryChange = (catSlug) => {
    const updatedCats = product.categories?.includes(catSlug)
      ? product.categories.filter(c => c !== catSlug)
      : [...(product.categories || []), catSlug];
    setProduct(prev => ({ ...prev, categories: updatedCats }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (indexToRemove) => {
    setPreviews(prev => prev.filter((_, i) => i !== indexToRemove));
    setImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };
  const addSizeRow = () => {
    setSizeChart([...sizeChart, { size: '', length: '', chest: '', waist: '', weight: '' }]);
  };

  const removeSizeRow = (index) => {
    setSizeChart(sizeChart.filter((_, i) => i !== index));
  };

  const handleDelete = async (productId) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج من WIND؟")) {
      try {
        await deleteDoc(doc(db, "products", productId));
        setProductsList(productsList.filter(p => p.id !== productId));
        alert("تم الحذف بنجاح");
      } catch (error) {
        alert("خطأ في الحذف: " + error.message);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // معالجة الألوان والروابط
      let finalColors = colorVariants.map(v => ({
        name: v.name || "",
        swatch: v.swatchUrl || v.swatch || v.preview || ""
      }));

      const productData = {
        ...product,
        price: Number(product.price) || 0,
        compareAtPrice: Number(product.compareAtPrice) || 0,
        costPerItem: Number(product.costPerItem) || 0,
        quantity: Number(product.quantity) || 0,
        categories: product.categories || [],
        // تحويل التاجز والمقاسات لمصفوفات (Arrays) كما في منطقك الأصلي
        tags: typeof product.tags === 'string' ? product.tags.split(',').map(t => t.trim()) : product.tags,
        options: {
          colors: finalColors,
          sizes: typeof product.sizes === 'string' ? product.sizes.split(',').map(s => s.trim()) : product.sizes,
          sizeChart: [...sizeChart],
          chartHeaders: { ...chartHeaders },
        },
        seo: {
          title: product.seoTitle || product.title || "",
          description: product.seoDesc || product.description || "",
          handle: product.handle || "",
          seoCategory: product.seoCategory || ""
        },
        images: previews, // الروابط المرفوعة عبر ImageKit أو الروابط اليدوية
        updatedAt: serverTimestamp(),
      };

      if (id) {
        await updateDoc(doc(db, "products", id), productData);
        alert("✅ تم تحديث منتج WIND بنجاح!");
      } else {
        productData.createdAt = serverTimestamp();
        await addDoc(collection(db, "products"), productData);
        
        // تحديث عداد الأقسام ديناميكياً
        if (product.categories?.length > 0) {
          for (const catSlug of product.categories) {
            const q = query(collection(db, "collections"), where("slug", "==", catSlug));
            const snap = await getDocs(q);
            if (!snap.empty) {
              await updateDoc(doc(db, "collections", snap.docs[0].id), { productCount: increment(1) });
            }
          }
        }
        alert("✅ تم إضافة المنتج لـ WIND وتحديث العدادات!");
      }
      window.location.reload(); 
    } catch (error) {
      alert("خطأ في الحفظ: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] shadow-xl">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {id ? 'تعديل منتج WIND' : 'إضافة منتج جديد لـ WIND'}
        </h2>
        <button 
          onClick={handleSave}
          disabled={loading}
          className={`px-12 py-3 rounded-xl font-bold text-black transition-all transform active:scale-95 ${loading ? 'bg-gray-500' : 'bg-[#F5C518] hover:bg-[#ffdb4d] shadow-[0_0_15px_rgba(245,197,24,0.3)]'}`}
        >
          {loading ? 'جاري الحفظ...' : (id ? 'تحديث المنتج' : 'حفظ ونشر')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* المحتوى الرئيسي (2 عمود) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* الاسم والوصف */}
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] space-y-5">
            <div>
              <label className="block text-xs font-bold mb-2 text-[#F5C518] uppercase tracking-widest">اسم المنتج</label>
              <input name="title" value={product.title} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white focus:border-[#F5C518] outline-none transition-all" placeholder="مثال: هاي كول تريكو مضلع" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-[#F5C518] uppercase tracking-widest">وصف المنتج (يدعم HTML شوبيفاي)</label>
              <textarea name="description" value={product.description} onChange={handleChange} className="w-full h-72 bg-[#121212] border border-[#333] p-5 rounded-xl text-white focus:border-[#F5C518] outline-none resize-none leading-relaxed" placeholder="اكتب وصف المنتج هنا..."></textarea>
            </div>
          </div>

          {/* قسم الصور المطور (ImageKit + Manual) */}
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] space-y-6">
            <h3 className="font-bold text-[#F5C518] border-b border-[#333] pb-3 uppercase text-sm tracking-widest">صور المنتج (اسحب للترتيب)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* مكون الرفع لـ ImageKit */}
              <ImageUploader label="الرفع المباشر لـ ImageKit" onUploadSuccess={handleImageKitSuccess} />
              
              <div className="bg-[#121212] p-5 rounded-xl border border-[#333] flex flex-col justify-center">
                <label className="text-[10px] text-gray-500 block mb-2 font-bold uppercase">أو ضع رابط صورة يدوياً</label>
                <input 
                  name="mainImageUrl" 
                  value={product.mainImageUrl} 
                  onChange={handleChange} 
                  onKeyDown={handleImageUrlKeyDown}
                  className="w-full bg-black border border-[#444] p-3 rounded-lg text-xs text-[#F5C518] outline-none focus:border-[#F5C518]" 
                  placeholder="رابط الصورة + Enter" 
                />
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEndImages}>
              <Droppable droppableId="images-grid" direction="horizontal">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {previews.map((src, i) => (
                      <Draggable key={`img-${i}`} draggableId={`img-${i}`} index={i}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="relative aspect-square group">
                            <img src={src} className="h-full w-full object-cover rounded-xl border-2 border-[#333] group-hover:border-[#F5C518] transition-all" />
                            <button onClick={() => removeImage(i)} className="absolute -top-2 -left-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* الألوان والخيارات (مع ألوان شوبيفاي) */}
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] space-y-6">
            <h3 className="font-bold text-[#F5C518] uppercase text-sm tracking-widest">الألوان والبدائل</h3>
            <DragDropContext onDragEnd={onDragEndColors}>
              <Droppable droppableId="colors-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {colorVariants.map((v, i) => (
                      <Draggable key={`color-${i}`} draggableId={`color-${i}`} index={i}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} className="flex gap-3 items-center bg-[#121212] p-4 rounded-xl border border-[#333]">
                            <div {...provided.dragHandleProps} className="text-gray-600 px-1 cursor-grab">⠿</div>
                            <div className="w-12 h-12 rounded-full bg-black overflow-hidden border-2 border-[#333] shrink-0">
                               {(v.swatchUrl || v.swatch) && <img src={v.swatchUrl || v.swatch} className="w-full h-full object-cover" />}
                            </div>
                            <select 
                              className="bg-transparent text-white text-sm outline-none flex-1 border-b border-[#333] pb-1 focus:border-[#F5C518]"
                              value={v.name}
                              onChange={(e) => { const n = [...colorVariants]; n[i].name = e.target.value; setColorVariants(n); }}
                            >
                              <option value="" className="bg-black">اختر لوناً...</option>
                              {shopifyColors.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                            </select>
                            <input placeholder="رابط صورة اللون" value={v.swatchUrl || v.swatch || ""} className="bg-[#1a1a1a] text-[#F5C518] text-xs p-2 rounded-lg border border-[#333] w-1/3"
                                onChange={(e) => { const n = [...colorVariants]; n[i].swatchUrl = e.target.value; setColorVariants(n); }}
                            />
                            <button onClick={() => removeColorVariant(i)} className="text-red-500 text-2xl hover:bg-red-950/30 w-10 h-10 rounded-full transition-all">×</button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <button onClick={addColorVariant} className="text-[#F5C518] text-xs font-bold hover:underline tracking-widest uppercase">+ إضافة لون جديد لـ WIND</button>
          </div>

          {/* دليل القياسات */}
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#333]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-[#F5C518] uppercase text-sm tracking-widest">دليل القياسات (سم)</h3>
              <button onClick={addSizeRow} className="text-xs bg-[#F5C518] text-black px-5 py-2 rounded-lg font-bold hover:bg-[#ffdb4d] transition-all">+ إضافة مقاس</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm text-white border-separate border-spacing-2">
                <thead>
                  <tr className="text-gray-500 font-bold uppercase text-[10px]">
                    {['col1','col2','col3','col4','col5'].map(c => (
                      <th key={c}><input className="bg-transparent text-center w-full focus:text-[#F5C518] outline-none border-b border-transparent focus:border-[#F5C518]" value={chartHeaders[c]} onChange={(e)=>setChartHeaders({...chartHeaders, [c]: e.target.value})} /></th>
                    ))}
                    <th>حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.map((row, index) => (
                    <tr key={index}>
                      <td><input value={row.size} onChange={(e) => handleSizeChartChange(index, 'size', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-3 rounded-lg text-center text-[#F5C518] font-bold" /></td>
                      <td><input value={row.length} onChange={(e) => handleSizeChartChange(index, 'length', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-3 rounded-lg text-center" /></td>
                      <td><input value={row.chest} onChange={(e) => handleSizeChartChange(index, 'chest', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-3 rounded-lg text-center" /></td>
                      <td><input value={row.waist} onChange={(e) => handleSizeChartChange(index, 'waist', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-3 rounded-lg text-center" /></td>
                      <td><input value={row.weight} onChange={(e) => handleSizeChartChange(index, 'weight', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-3 rounded-lg text-center" /></td>
                      <td className="text-center"><button onClick={() => removeSizeRow(index)} className="text-red-500 text-2xl hover:text-red-400">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* الشريط الجانبي (1 عمود) */}
        <div className="space-y-6">
          {/* الأسعار والمخزن */}
          <div className="bg-[#1a1a1a] p-7 rounded-2xl border border-[#333] shadow-lg space-y-5">
            <h3 className="font-bold text-[#F5C518] uppercase text-xs tracking-widest border-b border-[#333] pb-2">السعر والمخزن</h3>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-2">السعر الحالي</label>
              <input type="number" name="price" value={product.price} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-white font-bold focus:border-[#F5C518] outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-2">قبل الخصم (للعرض)</label>
              <input type="number" name="compareAtPrice" value={product.compareAtPrice} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-gray-400 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-2">الكمية بالمخزن</label>
              <input type="number" name="quantity" value={product.quantity} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-white outline-none" />
            </div>
          </div>

          {/* التنظيم والربط */}
          <div className="bg-[#1a1a1a] p-7 rounded-2xl border border-[#333] shadow-lg space-y-5">
            <h3 className="font-bold text-[#F5C518] uppercase text-xs tracking-widest border-b border-[#333] pb-2">التنظيم</h3>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-3">الأقسام</label>
              <div className="space-y-2 max-h-56 overflow-y-auto bg-black p-4 rounded-xl border border-[#333] custom-scrollbar">
                {availableCollections.map(col => (
                  <label key={col.id} className="flex items-center gap-3 text-sm text-gray-300 hover:text-white cursor-pointer transition-all">
                    <input type="checkbox" checked={product.categories?.includes(col.slug)} onChange={() => handleCategoryChange(col.slug)} className="accent-[#F5C518] w-4 h-4 rounded" />
                    {col.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-2">المقاسات (مفصولة بفاصلة)</label>
              <input name="sizes" value={product.sizes} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-xs text-white" placeholder="S, M, L, XL" />
            </div>
          </div>

          {/* SEO ومسارات شوبيفاي */}
          <div className="bg-[#1a1a1a] p-7 rounded-2xl border border-[#333] shadow-lg space-y-5">
            <h3 className="font-bold text-[#F5C518] uppercase text-xs tracking-widest border-b border-[#333] pb-2">SEO وربط شوبيفاي</h3>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-2">Handle (الرابط الفرعي)</label>
              <input name="handle" value={product.handle} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-xs text-[#F5C518] font-mono" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-2">منتجات مقترحة (Handles)</label>
              <input name="suggestedProducts" value={product.suggestedProducts} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-xs text-white" placeholder="handle1, handle2" />
            </div>
          </div>
        </div>
      </div>

      {/* جدول إدارة المنتجات بالأسفل (كما في كودك الأصلي) */}
      <div className="mt-12 bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] shadow-2xl">
        <h3 className="text-xl font-bold text-[#F5C518] mb-6 tracking-widest uppercase">إدارة منتجات WIND الحالية</h3>
        <div className="overflow-hidden rounded-xl border border-[#333]">
          <table className="w-full text-right text-sm text-white">
            <thead className="bg-[#222] text-[#F5C518] font-bold uppercase text-xs">
              <tr>
                <th className="p-5">الصورة</th>
                <th className="p-5">المنتج</th>
                <th className="p-4">السعر</th>
                <th className="p-5">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {productsList.map((p) => (
                <tr key={p.id} className="hover:bg-[#252525] transition-colors">
                  <td className="p-4">
                    <img src={p.images?.[0] || p.mainImageUrl} className="w-14 h-14 object-cover rounded-lg border border-[#444]" alt="" />
                  </td>
                  <td className="p-4 font-bold text-gray-200">{p.title}</td>
                  <td className="p-4 font-mono text-[#F5C518]">{p.price} ج.م</td>
                  <td className="p-4">
                    <div className="flex gap-5">
                      <Link href={`/admin/products/create?id=${p.id}`} className="text-blue-400 font-bold hover:underline tracking-widest uppercase text-xs">تعديل</Link>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 font-bold hover:underline tracking-widest uppercase text-xs">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}