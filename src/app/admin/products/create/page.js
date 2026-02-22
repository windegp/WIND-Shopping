"use client";
import { 
  collection, addDoc, serverTimestamp, doc, getDoc, 
  updateDoc, getDocs, deleteDoc, query, where, increment 
} from "firebase/firestore";
import { useState, useEffect, Suspense } from 'react';
import { db } from "@/lib/firebase";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
// استيراد المكون الافتراضي
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

  const [product, setProduct] = useState({
    title: '', description: '', price: '', compareAtPrice: '',
    costPerItem: '', sku: '', quantity: 0, 
    categories: [], tags: '', sizes: '', seoTitle: '', seoDesc: '', 
    handle: '', mainImageUrl: '', seoCategory: '',
    suggestedProducts: '', 
  });

  const [previews, setPreviews] = useState([]);
  const [colorVariants, setColorVariants] = useState([]);
  const [chartHeaders, setChartHeaders] = useState({
    col1: 'المقاس', col2: 'الطول', col3: 'الصدر', col4: 'الوسط', col5: 'الوزن (كجم)'
  });
  const [sizeChart, setSizeChart] = useState([
    { size: 'S', length: '', chest: '', waist: '', weight: '' }
  ]);

  // ألوان شوبيفاي الأساسية لـ WIND
  const shopifyColors = ["fuchsia", "jeans-blue", "beige", "clear", "green", "black", "burgundy", "rose"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const colSnapshot = await getDocs(collection(db, "collections"));
        setAvailableCollections(colSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        if (id) {
          const docSnap = await getDoc(doc(db, "products", id));
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
        console.error("Fetch Error:", err);
      }
    };
    fetchData();
  }, [id]);

  // --- جميع الدوال المطلوبة للواجهة (إياك أن تحذف واحدة) ---

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
    if (name === 'title' && !product.handle) {
      setProduct(prev => ({ ...prev, handle: value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\u0621-\u064A0-9-a-z-]/g, '') }));
    }
  };

  const handleCategoryChange = (catSlug) => {
    const updatedCats = product.categories?.includes(catSlug)
      ? product.categories.filter(c => c !== catSlug)
      : [...(product.categories || []), catSlug];
    setProduct(prev => ({ ...prev, categories: updatedCats }));
  };

  // ✅ الدالة التي كانت تسبب الخطأ (addColorVariant)
  const addColorVariant = () => {
    setColorVariants([...colorVariants, { name: '', swatch: '', preview: '', swatchUrl: '' }]);
  };

  const removeColorVariant = (index) => {
    setColorVariants(colorVariants.filter((_, i) => i !== index));
  };

  const handleSizeChartChange = (index, field, value) => {
    const newChart = [...sizeChart];
    newChart[index] = { ...newChart[index], [field]: value };
    setSizeChart(newChart);
  };

  const addSizeRow = () => {
    setSizeChart([...sizeChart, { size: '', length: '', chest: '', waist: '', weight: '' }]);
  };

  const removeSizeRow = (index) => {
    setSizeChart(sizeChart.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const productData = {
        ...product,
        price: Number(product.price) || 0,
        compareAtPrice: Number(product.compareAtPrice) || 0,
        images: previews,
        updatedAt: serverTimestamp(),
        options: {
          colors: colorVariants,
          sizeChart: sizeChart,
          chartHeaders: chartHeaders,
          sizes: typeof product.sizes === 'string' ? product.sizes.split(',').map(s => s.trim()) : product.sizes,
        }
      };

      if (id) {
        await updateDoc(doc(db, "products", id), productData);
        alert("✅ تم التحديث!");
      } else {
        productData.createdAt = serverTimestamp();
        await addDoc(collection(db, "products"), productData);
      }
      router.refresh();
      window.location.reload();
    } catch (error) {
      alert("خطأ: " + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (productId) => {
    if (confirm("حذف المنتج؟")) {
      await deleteDoc(doc(db, "products", productId));
      setProductsList(productsList.filter(p => p.id !== productId));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4" dir="rtl">
      {/* الرأس */}
      <div className="flex justify-between items-center bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
        <h2 className="text-2xl font-bold text-white tracking-tight">{id ? 'تعديل منتج WIND' : 'إضافة منتج لـ WIND'}</h2>
        <button onClick={handleSave} disabled={loading} className="px-10 py-3 rounded-lg font-bold text-black bg-[#F5C518] hover:bg-[#ffdb4d]">
          {loading ? 'جاري الحفظ...' : 'حفظ ونشر'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* الاسم والوصف */}
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] space-y-4">
            <h3 className="text-[#F5C518] font-bold">المعلومات الأساسية</h3>
            <input name="title" value={product.title} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded text-white" placeholder="اسم المنتج" />
            <textarea name="description" value={product.description} onChange={handleChange} className="w-full h-64 bg-[#121212] border border-[#333] p-4 rounded text-white resize-none" placeholder="الوصف"></textarea>
          </div>

          {/* الصور - استدعاء المكون اللي صلحناه */}
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
            <h3 className="font-bold mb-4 text-[#F5C518]">صور المنتج</h3>
            <ImageUploader label="الرفع لـ ImageKit" onUploadSuccess={handleImageKitSuccess} />
            <DragDropContext onDragEnd={onDragEndImages}>
              <Droppable droppableId="images" direction="horizontal">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-4 gap-2 mt-4">
                    {previews.map((src, i) => (
                      <Draggable key={i} draggableId={`img-${i}`} index={i}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="relative aspect-square">
                            <img src={src} className="w-full h-full object-cover rounded border border-[#333]" />
                            <button onClick={() => setPreviews(previews.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-bl">×</button>
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

          {/* الألوان */}
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
            <h3 className="font-bold mb-4 text-[#F5C518]">الألوان والبدائل</h3>
            <DragDropContext onDragEnd={onDragEndColors}>
              <Droppable droppableId="colors">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {colorVariants.map((v, i) => (
                      <Draggable key={i} draggableId={`col-${i}`} index={i}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} className="flex gap-2 items-center bg-[#121212] p-3 rounded border border-[#333]">
                            <div {...provided.dragHandleProps} className="px-2 text-gray-500">⠿</div>
                            <select value={v.name} onChange={(e) => { const n = [...colorVariants]; n[i].name = e.target.value; setColorVariants(n); }} className="bg-transparent text-white text-sm outline-none flex-1">
                              <option value="">اختر لوناً</option>
                              {shopifyColors.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input value={v.swatchUrl} onChange={(e) => { const n = [...colorVariants]; n[i].swatchUrl = e.target.value; setColorVariants(n); }} placeholder="رابط اللون" className="bg-[#1a1a1a] text-[#F5C518] text-xs p-2 rounded w-1/3 border border-[#333]" />
                            <button onClick={() => removeColorVariant(i)} className="text-red-500 text-xl px-2">×</button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <button onClick={addColorVariant} className="text-[#F5C518] text-xs font-bold mt-4 hover:underline">+ إضافة لون جديد</button>
          </div>

          {/* جدول المقاسات */}
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#F5C518]">دليل القياسات</h3>
              <button onClick={addSizeRow} className="text-xs bg-[#333] text-white px-3 py-1 rounded">+ مقاس جديد</button>
            </div>
            <table className="w-full text-center text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-[#333]">
                  {['col1','col2','col3','col4','col5'].map(c => (
                    <th key={c} className="pb-2"><input className="bg-transparent text-center w-full outline-none focus:text-[#F5C518]" value={chartHeaders[c]} onChange={(e)=>setChartHeaders({...chartHeaders, [c]: e.target.value})} /></th>
                  ))}
                  <th>حذف</th>
                </tr>
              </thead>
              <tbody>
                {sizeChart.map((row, index) => (
                  <tr key={index}>
                    <td><input value={row.size} onChange={(e) => handleSizeChartChange(index, 'size', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 text-center" /></td>
                    <td><input value={row.length} onChange={(e) => handleSizeChartChange(index, 'length', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 text-center" /></td>
                    <td><input value={row.chest} onChange={(e) => handleSizeChartChange(index, 'chest', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 text-center" /></td>
                    <td><input value={row.waist} onChange={(e) => handleSizeChartChange(index, 'waist', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 text-center" /></td>
                    <td><input value={row.weight} onChange={(e) => handleSizeChartChange(index, 'weight', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 text-center" /></td>
                    <td><button onClick={() => removeSizeRow(index)} className="text-red-500">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* الجانبي */}
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] space-y-4">
            <h3 className="text-[#F5C518] font-bold">السعر والمخزن</h3>
            <input type="number" name="price" value={product.price} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded" placeholder="السعر" />
            <input type="number" name="compareAtPrice" value={product.compareAtPrice} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded" placeholder="السعر قبل الخصم" />
            <input type="number" name="quantity" value={product.quantity} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded" placeholder="الكمية" />
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] space-y-4">
            <h3 className="text-[#F5C518] font-bold">التنظيم</h3>
            <div className="max-h-48 overflow-y-auto space-y-2 bg-black p-3 rounded border border-[#333]">
              {availableCollections.map(col => (
                <label key={col.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={product.categories?.includes(col.slug)} onChange={() => handleCategoryChange(col.slug)} className="accent-[#F5C518]" />
                  {col.name}
                </label>
              ))}
            </div>
            <input name="sizes" value={product.sizes} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded text-xs" placeholder="المقاسات (S, M, L)" />
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] space-y-4">
            <h3 className="text-[#F5C518] font-bold">SEO</h3>
            <input name="handle" value={product.handle} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded text-xs text-[#F5C518] font-mono" placeholder="handle-slug" />
            <input name="suggestedProducts" value={product.suggestedProducts} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded text-xs" placeholder="منتجات مقترحة (Handles)" />
          </div>
        </div>
      </div>

      {/* الجدول السفلي */}
      <div className="mt-12 bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
        <h3 className="text-xl font-bold text-[#F5C518] mb-4 uppercase">إدارة منتجات WIND</h3>
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-[#222] text-[#F5C518]">
              <th className="p-3">المنتج</th>
              <th className="p-3">السعر</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {productsList.map((p) => (
              <tr key={p.id} className="border-b border-[#333]">
                <td className="p-3 font-bold">{p.title}</td>
                <td className="p-3">{p.price} ج.م</td>
                <td className="p-3 flex gap-4">
                  <Link href={`/admin/products/create?id=${p.id}`} className="text-blue-400">تعديل</Link>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}