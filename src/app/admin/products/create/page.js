"use client";
import { useState, useEffect, Suspense } from 'react';
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, getDocs, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

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
  const id = params.id || searchParams.get('id'); 
  
  const [loading, setLoading] = useState(false);
  const [productsList, setProductsList] = useState([]);
  
  const [product, setProduct] = useState({
    title: '', description: '', price: '', compareAtPrice: '',
    costPerItem: '', sku: '', quantity: 0, 
    categories: ['shawls'], 
    tags: '', sizes: '', seoTitle: '', seoDesc: '', handle: '',
    mainImageUrl: '',
    seoCategory: '',
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [colorVariants, setColorVariants] = useState([]);

  // رؤوس الجدول
  const [chartHeaders, setChartHeaders] = useState({
    col1: 'المقاس', col2: 'الطول', col3: 'الصدر', col4: 'الوسط', col5: 'الوزن (كجم)'
  });
  // بيانات الجدول
  const [sizeChart, setSizeChart] = useState([
    { size: 'S', length: '', chest: '', waist: '', weight: '' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ ...data, id: docSnap.id });
          
          if (data.options?.chartHeaders) {
            setChartHeaders({ ...data.options.chartHeaders });
          }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    if (name === 'title' && !product.handle) {
      setProduct(prev => ({ ...prev, handle: value.toLowerCase().replace(/\s+/g, '-') }));
    }
  };

  // وظيفة إضافة رابط الصورة للمعاينة عند الضغط على Enter
  const handleImageUrlKeyDown = (e) => {
    if (e.key === 'Enter' && product.mainImageUrl.trim() !== '') {
      e.preventDefault(); // منع إرسال الفورم
      if (!previews.includes(product.mainImageUrl)) {
        setPreviews(prev => [product.mainImageUrl, ...prev]);
      }
    }
  };

  const handleCategoryChange = (cat) => {
    const updatedCats = product.categories?.includes(cat)
      ? product.categories.filter(c => c !== cat)
      : [...(product.categories || []), cat];
    setProduct(prev => ({ ...prev, categories: updatedCats }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const addColorVariant = () => {
    setColorVariants([...colorVariants, { name: '', swatch: '', preview: '', swatchUrl: '' }]);
  };

  const removeColorVariant = (index) => {
    const updated = colorVariants.filter((_, i) => i !== index);
    setColorVariants(updated);
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
    const newChart = sizeChart.filter((_, i) => i !== index);
    setSizeChart(newChart);
  };

  const handleDelete = async (productId) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
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
      let imageUrls = [...previews.filter(p => p.startsWith('http'))]; 
      
      if (product.mainImageUrl && !imageUrls.includes(product.mainImageUrl)) {
        imageUrls.unshift(product.mainImageUrl);
      }

      if (images.length > 0) {
        for (let img of images) {
          try {
            const imgRef = ref(storage, `products/${Date.now()}-${img.name}`);
            const snap = await uploadBytes(imgRef, img);
            const url = await getDownloadURL(snap.ref);
            imageUrls.push(url);
          } catch (e) { console.log("Upload error", e); }
        }
      }

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
        tags: product.tags ? (Array.isArray(product.tags) ? product.tags : product.tags.split(',').map(t => t.trim())) : [],
        options: {
          colors: finalColors,
          sizes: product.sizes ? (Array.isArray(product.sizes) ? product.sizes : product.sizes.split(',').map(s => s.trim())) : [],
          sizeChart: [...sizeChart],
          chartHeaders: { ...chartHeaders },
        },
        seo: {
          title: product.seoTitle || product.title || "",
          description: product.seoDesc || product.description || "",
          handle: product.handle || "",
          seoCategory: product.seoCategory || ""
        },
        images: [...new Set(imageUrls)],
        updatedAt: serverTimestamp(),
      };

      if (id) {
        await updateDoc(doc(db, "products", id), productData);
        alert("✅ تم تحديث منتج WIND بنجاح!");
      } else {
        productData.createdAt = serverTimestamp();
        await addDoc(collection(db, "products"), productData);
        alert("✅ تم إضافة منتج جديد لـ WIND!");
      }
      window.location.reload();
      
    } catch (error) {
      console.error(error);
      alert("خطأ: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{id ? 'تعديل منتج في WIND' : 'إضافة منتج جديد لـ WIND'}</h2>
        <button 
          onClick={handleSave}
          disabled={loading}
          className={`px-8 py-3 rounded font-bold text-black ${loading ? 'bg-gray-500' : 'bg-[#F5C518] hover:bg-[#ffdb4d]'}`}
        >
          {loading ? 'جاري الحفظ...' : (id ? 'تحديث المنتج' : 'حفظ ونشر')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
             <label className="block text-sm font-bold mb-2 text-[#F5C518]">اسم المنتج</label>
             <input name="title" value={product.title} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded text-white focus:border-[#F5C518] outline-none" placeholder="مثال: عباية كتان أسود" />
             
             <label className="block text-sm font-bold mt-4 mb-2 text-[#F5C518]">وصف المنتج</label>
             <textarea 
                name="description" 
                value={product.description}
                onChange={handleChange} 
                className="w-full h-64 bg-[#121212] border border-[#333] p-4 rounded text-white focus:border-[#F5C518] outline-none resize-none font-light leading-relaxed"
                placeholder="اكتب وصف المنتج هنا..."
             ></textarea>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
             <h3 className="font-bold mb-4 text-[#F5C518]">الصور</h3>
             <input 
                name="mainImageUrl" 
                value={product.mainImageUrl} 
                onChange={handleChange} 
                onKeyDown={handleImageUrlKeyDown}
                className="w-full bg-[#121212] border border-[#333] p-2 rounded text-[#F5C518] text-sm mb-4 focus:border-[#F5C518] outline-none" 
                placeholder="أضف رابط صورة مباشر واضغط Enter للمعاينة" 
             />
             <div className="grid grid-cols-4 gap-2 mb-4">
                 {previews.map((src, i) => <img key={i} src={src} className="h-20 w-full object-cover rounded border border-[#333]" />)}
             </div>
             <div className="border-2 border-dashed border-[#333] p-6 text-center rounded relative hover:bg-[#222]">
                 <input type="file" multiple onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                 <span className="text-gray-400 text-sm">اضغط لرفع صور إضافية من جهازك</span>
             </div>
          </div>
          
          <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
            <h3 className="font-bold mb-4 text-[#F5C518]">الخيارات والألوان</h3>
            <div className="space-y-3">
                {colorVariants.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center bg-[#121212] p-2 rounded border border-[#333]">
                        <div className="w-8 h-8 rounded-full bg-black overflow-hidden border border-[#F5C518] shrink-0">
                             {(v.preview || v.swatchUrl || v.swatch) && <img src={v.preview || v.swatchUrl || v.swatch} className="w-full h-full object-cover" />}
                        </div>
                        <input placeholder="اسم اللون" value={v.name} className="bg-transparent text-white text-sm outline-none flex-1" 
                            onChange={(e) => { const n = [...colorVariants]; n[i].name = e.target.value; setColorVariants(n); }} 
                        />
                        <input placeholder="رابط صورة اللون" value={v.swatchUrl || v.swatch || ""} className="bg-[#222] text-[#F5C518] text-xs p-1 rounded w-1/2"
                            onChange={(e) => { const n = [...colorVariants]; n[i].swatchUrl = e.target.value; setColorVariants(n); }}
                        />
                        <button onClick={() => removeColorVariant(i)} className="text-red-500 px-2">×</button>
                    </div>
                ))}
                <button onClick={addColorVariant} className="text-[#F5C518] text-xs font-bold">+ إضافة لون جديد</button>
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded border border-[#333] mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#F5C518]">دليل القياسات (بالسنتيمتر)</h3>
              <button onClick={addSizeRow} className="text-xs bg-[#333] hover:bg-[#444] text-white px-3 py-1 rounded transition">
                + إضافة مقاس جديد
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm text-white">
                <thead>
                  <tr className="text-gray-500 border-b border-[#333]">
                    <th className="pb-2 px-1"><input className="bg-transparent text-center w-full focus:text-[#F5C518] outline-none" value={chartHeaders.col1} onChange={(e)=>setChartHeaders({...chartHeaders, col1: e.target.value})} /></th>
                    <th className="pb-2 px-1"><input className="bg-transparent text-center w-full focus:text-[#F5C518] outline-none" value={chartHeaders.col2} onChange={(e)=>setChartHeaders({...chartHeaders, col2: e.target.value})} /></th>
                    <th className="pb-2 px-1"><input className="bg-transparent text-center w-full focus:text-[#F5C518] outline-none" value={chartHeaders.col3} onChange={(e)=>setChartHeaders({...chartHeaders, col3: e.target.value})} /></th>
                    <th className="pb-2 px-1"><input className="bg-transparent text-center w-full focus:text-[#F5C518] outline-none" value={chartHeaders.col4} onChange={(e)=>setChartHeaders({...chartHeaders, col4: e.target.value})} /></th>
                    <th className="pb-2 px-1"><input className="bg-transparent text-center w-full focus:text-[#F5C518] outline-none" value={chartHeaders.col5} onChange={(e)=>setChartHeaders({...chartHeaders, col5: e.target.value})} /></th>
                    <th className="pb-2">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {sizeChart.map((row, index) => (
                    <tr key={index}>
                      <td className="p-1"><input value={row.size} onChange={(e) => handleSizeChartChange(index, 'size', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-center text-[#F5C518] font-bold" /></td>
                      <td className="p-1"><input value={row.length} onChange={(e) => handleSizeChartChange(index, 'length', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-center text-white" /></td>
                      <td className="p-1"><input value={row.chest} onChange={(e) => handleSizeChartChange(index, 'chest', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-center text-white" /></td>
                      <td className="p-1"><input value={row.waist} onChange={(e) => handleSizeChartChange(index, 'waist', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-center text-white" /></td>
                      <td className="p-1"><input value={row.weight} onChange={(e) => handleSizeChartChange(index, 'weight', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-center text-white" /></td>
                      <td className="p-1 text-center">
                        <button onClick={() => removeSizeRow(index)} className="text-red-500 hover:text-red-400">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
                <h3 className="font-bold mb-4 text-[#F5C518]">السعر والمخزن</h3>
                <div className="space-y-3">
                    <div><label className="text-xs text-gray-500">السعر الحالي</label><input type="number" name="price" value={product.price} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white"/></div>
                    <div><label className="text-xs text-gray-500">قبل الخصم</label><input type="number" name="compareAtPrice" value={product.compareAtPrice} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white"/></div>
                    {/* الحقل المعاد إضافته */}
                    <div><label className="text-xs text-gray-500">تكلفة المنتج (لصاحب الموقع)</label><input type="number" name="costPerItem" value={product.costPerItem} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white" placeholder="0"/></div>
                    <div><label className="text-xs text-gray-500">الكمية بالمخزن</label><input type="number" name="quantity" value={product.quantity} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white" placeholder="0"/></div>
                    
                    <div className="pt-2">
                        <label className="text-xs text-gray-500 block mb-2">الأقسام</label>
                        <div className="space-y-2 bg-[#121212] p-3 rounded border border-[#333]">
                          {['shawls', 'winter', 'new', 'accessories'].map(cat => (
                            <label key={cat} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={product.categories?.includes(cat)} 
                                onChange={() => handleCategoryChange(cat)}
                                className="accent-[#F5C518]"
                              />
                              {cat === 'shawls' ? 'شيلان' : cat === 'winter' ? 'شتوي' : cat === 'new' ? 'وصل حديثاً' : 'إكسسوارات'}
                            </label>
                          ))}
                        </div>
                    </div>
                </div>
            </div>

             <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
                <h3 className="font-bold mb-4 text-[#F5C518]">محركات البحث (SEO)</h3>
                <div className="space-y-4 text-white">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Page title</label>
                    <input name="seoTitle" value={product.seoTitle} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Meta description</label>
                    <textarea name="seoDesc" value={product.seoDesc} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-sm h-20 text-white resize-none"></textarea>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">URL handle</label>
                    <input name="handle" value={product.handle} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">SEO Category</label>
                    <input name="seoCategory" value={product.seoCategory} onChange={handleChange} placeholder="الملابس > أردية" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-sm text-[#F5C518]" />
                  </div>
                </div>
            </div>
        </div>
      </div>

      <hr className="border-[#333] my-10" />

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#F5C518]">إدارة منتجات WIND الحالية</h3>
        <div className="bg-[#1a1a1a] rounded border border-[#333] overflow-hidden">
          <table className="w-full text-right text-sm text-white">
            <thead className="bg-[#222] text-[#F5C518]">
              <tr>
                <th className="p-4">الصورة</th>
                <th className="p-4">المنتج</th>
                <th className="p-4">السعر</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {productsList.map((p) => (
                <tr key={p.id} className="hover:bg-[#222]">
                  <td className="p-4">
                    <img src={p.images?.[0] || p.mainImageUrl} className="w-12 h-12 object-cover rounded border border-[#333]" alt="" />
                  </td>
                  <td className="p-4 font-bold">{p.title}</td>
                  <td className="p-4">{p.price} ج.م</td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      <Link href={`/admin/products/create?id=${p.id}`} className="text-blue-400 font-bold hover:underline">تعديل</Link>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 font-bold hover:underline">حذف</button>
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