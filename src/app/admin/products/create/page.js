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

  // الوعاء الكامل (Schema) المتوافق مع شيت شوبيفاي
  const [product, setProduct] = useState({
    title: '', description: '', price: '', compareAtPrice: '',
    costPerItem: '', sku: '', quantity: 0, 
    categories: [], tags: '', sizes: '', seoTitle: '', seoDesc: '', 
    handle: '', mainImageUrl: '', seoCategory: '',
    // الميتافيلدز اللي كانت في الشيت
    suggestedProducts: '', 
    youMayAlsoLike: '',
    isdalBundleList: '',
    vendor: 'WIND',
    status: 'active'
  });

  const [previews, setPreviews] = useState([]);
  const [colorVariants, setColorVariants] = useState([]);
  const [chartHeaders, setChartHeaders] = useState({
    col1: 'المقاس', col2: 'الطول', col3: 'الصدر', col4: 'الوسط', col5: 'الوزن (كجم)'
  });
  const [sizeChart, setSizeChart] = useState([
    { size: 'S', length: '', chest: '', waist: '', weight: '' }
  ]);

  const shopifyColors = ["fuchsia", "jeans-blue", "beige", "clear", "green", "black", "burgundy", "rose"];

  useEffect(() => {
    const fetchData = async () => {
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
    };
    fetchData();
  }, [id]);

  const handleImageKitSuccess = (url) => setPreviews(prev => [...prev, url]);

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

  const addColorVariant = () => setColorVariants([...colorVariants, { name: '', swatch: '', preview: '', swatchUrl: '' }]);
  const removeColorVariant = (index) => setColorVariants(colorVariants.filter((_, i) => i !== index));

  const addSizeRow = () => setSizeChart([...sizeChart, { size: '', length: '', chest: '', waist: '', weight: '' }]);
  const handleSizeChartChange = (index, field, value) => {
    const newChart = [...sizeChart];
    newChart[index] = { ...newChart[index], [field]: value };
    setSizeChart(newChart);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const productData = {
        ...product,
        price: Number(product.price) || 0,
        compareAtPrice: Number(product.compareAtPrice) || 0,
        costPerItem: Number(product.costPerItem) || 0,
        quantity: Number(product.quantity) || 0,
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
        alert("✅ تم تحديث بيانات WIND بنجاح!");
      } else {
        productData.createdAt = serverTimestamp();
        await addDoc(collection(db, "products"), productData);
        alert("✅ تم إضافة منتج جديد لـ WIND!");
      }
      router.refresh();
      window.location.reload();
    } catch (error) { alert("خطأ: " + error.message); }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 text-right" dir="rtl">
      {/* الرأس */}
      <div className="flex justify-between items-center bg-[#1a1a1a] p-8 rounded-2xl border border-[#333]">
        <h2 className="text-2xl font-bold text-white">إدارة منتجات WIND</h2>
        <button onClick={handleSave} disabled={loading} className="bg-[#F5C518] px-12 py-3 rounded-xl font-bold text-black hover:scale-105 transition-all">
          {loading ? 'جاري الحفظ...' : 'حفظ ونشر'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* الوصف والاسم */}
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] space-y-4">
             <h3 className="text-[#F5C518] font-bold border-b border-[#333] pb-2 text-sm uppercase">المحتوى</h3>
             <input name="title" value={product.title} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white" placeholder="اسم المنتج" />
             <textarea name="description" value={product.description} onChange={handleChange} className="w-full h-64 bg-[#121212] border border-[#333] p-4 rounded-xl text-white" placeholder="وصف المنتج (HTML)"></textarea>
          </div>

          {/* الصور */}
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
             <h3 className="text-[#F5C518] font-bold mb-4 text-sm uppercase">الصور والوسائط</h3>
             <ImageUploader label="الرفع لـ ImageKit" onUploadSuccess={handleImageKitSuccess} />
             <div className="grid grid-cols-4 gap-3 mt-6">
               {previews.map((src, i) => (
                 <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#333] group">
                    <img src={src} className="w-full h-full object-cover" />
                    <button onClick={() => setPreviews(previews.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                 </div>
               ))}
             </div>
          </div>

          {/* الألوان والمقاسات */}
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] space-y-6">
             <h3 className="text-[#F5C518] font-bold text-sm uppercase">خيارات البدائل (Variants)</h3>
             {colorVariants.map((v, i) => (
               <div key={i} className="flex gap-2 items-center bg-black p-3 rounded-xl border border-[#333]">
                  <select value={v.name} onChange={(e) => { const n = [...colorVariants]; n[i].name = e.target.value; setColorVariants(n); }} className="bg-transparent text-white text-sm outline-none flex-1">
                    <option value="">اختر لوناً</option>
                    {shopifyColors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={v.swatchUrl} onChange={(e) => { const n = [...colorVariants]; n[i].swatchUrl = e.target.value; setColorVariants(n); }} placeholder="رابط صورة اللون" className="bg-[#1a1a1a] border border-[#333] p-2 rounded text-xs text-[#F5C518] w-1/2" />
                  <button onClick={() => removeColorVariant(i)} className="text-red-500">×</button>
               </div>
             ))}
             <button onClick={addColorVariant} className="text-[#F5C518] text-xs font-bold">+ إضافة لون</button>
          </div>

          {/* دليل القياسات */}
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#F5C518] font-bold text-sm uppercase">دليل القياسات (Size Chart)</h3>
              <button onClick={addSizeRow} className="text-xs bg-[#333] px-3 py-1 rounded text-white">+ صف جديد</button>
            </div>
            <table className="w-full text-center text-xs">
               <thead>
                 <tr className="text-gray-500">
                    {['col1','col2','col3','col4','col5'].map(c => <th key={c}><input className="bg-transparent text-center w-full outline-none" value={chartHeaders[c]} onChange={(e)=>setChartHeaders({...chartHeaders, [c]: e.target.value})} /></th>)}
                    <th>حذف</th>
                 </tr>
               </thead>
               <tbody>
                 {sizeChart.map((row, index) => (
                   <tr key={index} className="border-t border-[#222]">
                      <td><input value={row.size} onChange={(e)=>handleSizeChartChange(index,'size',e.target.value)} className="w-full bg-transparent text-center p-2 text-[#F5C518] font-bold" /></td>
                      <td><input value={row.length} onChange={(e)=>handleSizeChartChange(index,'length',e.target.value)} className="w-full bg-transparent text-center p-2 text-white" /></td>
                      <td><input value={row.chest} onChange={(e)=>handleSizeChartChange(index,'chest',e.target.value)} className="w-full bg-transparent text-center p-2 text-white" /></td>
                      <td><input value={row.waist} onChange={(e)=>handleSizeChartChange(index,'waist',e.target.value)} className="w-full bg-transparent text-center p-2 text-white" /></td>
                      <td><input value={row.weight} onChange={(e)=>handleSizeChartChange(index,'weight',e.target.value)} className="w-full bg-transparent text-center p-2 text-white" /></td>
                      <td><button onClick={()=>setSizeChart(sizeChart.filter((_,idx)=>idx!==index))} className="text-red-500">×</button></td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>

        {/* الشريط الجانبي (الأسعار والميتافيلدز) */}
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] space-y-4">
            <h3 className="text-[#F5C518] font-bold text-sm uppercase border-b border-[#333] pb-2">التسعير والمخزن</h3>
            <div><label className="text-[10px] text-gray-500 font-bold">السعر الحالي</label><input type="number" name="price" value={product.price} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white font-bold" /></div>
            <div><label className="text-[10px] text-gray-500 font-bold">السعر قبل الخصم</label><input type="number" name="compareAtPrice" value={product.compareAtPrice} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-gray-400" /></div>
            <div><label className="text-[10px] text-gray-500 font-bold text-[#F5C518]">سعر التكلفة (Cost per item)</label><input type="number" name="costPerItem" value={product.costPerItem} onChange={handleChange} className="w-full bg-black border border-[#F5C518]/30 p-2 rounded text-white" /></div>
            <div><label className="text-[10px] text-gray-500 font-bold">الكمية في المخزن</label><input type="number" name="quantity" value={product.quantity} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white font-bold" /></div>
            <div><label className="text-[10px] text-gray-500 font-bold">SKU (رمز المنتج)</label><input name="sku" value={product.sku} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white text-xs" /></div>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] space-y-4">
            <h3 className="text-[#F5C518] font-bold text-sm uppercase border-b border-[#333] pb-2">الربط (Shopify Metafields)</h3>
            <div><label className="text-[10px] text-gray-500 font-bold">منتجات قد تعجبك (Handles)</label><input name="youMayAlsoLike" value={product.youMayAlsoLike} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-xs text-white" placeholder="handle-1, handle-2" /></div>
            <div><label className="text-[10px] text-gray-500 font-bold">منتجات مقترحة (Suggested)</label><input name="suggestedProducts" value={product.suggestedProducts} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-xs text-white" /></div>
            <div><label className="text-[10px] text-gray-500 font-bold">رابط الـ Handle</label><input name="handle" value={product.handle} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-xs text-[#F5C518] font-mono" /></div>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] space-y-4">
            <h3 className="text-[#F5C518] font-bold text-sm uppercase">التنظيم</h3>
            <div className="max-h-48 overflow-y-auto space-y-1 bg-black p-3 rounded-xl border border-[#333]">
               {availableCollections.map(col => (
                 <label key={col.id} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" checked={product.categories?.includes(col.slug)} onChange={() => handleCategoryChange(col.slug)} className="accent-[#F5C518]" />
                    {col.name}
                 </label>
               ))}
            </div>
            <input name="sizes" value={product.sizes} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-[10px] text-white" placeholder="المقاسات المتاحة (S, M, L)" />
          </div>
        </div>
      </div>
    </div>
  );
}