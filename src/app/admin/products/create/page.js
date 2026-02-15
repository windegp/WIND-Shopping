"use client";
import { useState } from 'react';
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CreateProductPage() {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState({
    title: '', description: '', price: '', compareAtPrice: '',
    costPerItem: '', sku: '', quantity: 0, category: 'shawls',
    tags: '', sizes: '', seoTitle: '', seoDesc: '', handle: '',
    mainImageUrl: '',
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [colorVariants, setColorVariants] = useState([]);

  // 1. تعريف حالة جدول القياسات (Snippet 1)
  const [sizeChart, setSizeChart] = useState([
    { size: 'S', length: '', chest: '', waist: '', weight: '' }
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    if (name === 'title' && !product.handle) {
      setProduct(prev => ({ ...prev, handle: value.toLowerCase().replace(/\s+/g, '-') }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const addColorVariant = () => {
    setColorVariants([...colorVariants, { name: '', file: null, preview: '', swatchUrl: '' }]);
  };

  // 2. دوال التحكم في جدول القياسات (Snippet 2)
  const handleSizeChartChange = (index, field, value) => {
    const newChart = [...sizeChart];
    newChart[index][field] = value;
    setSizeChart(newChart);
  };

  const addSizeRow = () => {
    setSizeChart([...sizeChart, { size: '', length: '', chest: '', waist: '', weight: '' }]);
  };

  const removeSizeRow = (index) => {
    const newChart = sizeChart.filter((_, i) => i !== index);
    setSizeChart(newChart);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let imageUrls = product.mainImageUrl ? [product.mainImageUrl] : [];
      
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

      let finalColors = [];
      for (let variant of colorVariants) {
        let finalSwatch = variant.swatchUrl;
        if (variant.file && !finalSwatch) {
          try {
            const vRef = ref(storage, `variants/${Date.now()}-${variant.file.name}`);
            const vSnap = await uploadBytes(vRef, variant.file);
            finalSwatch = await getDownloadURL(vSnap.ref);
          } catch(e) {}
        }
        finalColors.push({ name: variant.name, swatch: finalSwatch });
      }

      // 3. دمج بيانات جدول القياسات داخل كائن المنتج (Snippet 3)
      const productData = {
        ...product,
        price: Number(product.price),
        compareAtPrice: Number(product.compareAtPrice),
        costPerItem: Number(product.costPerItem),
        quantity: Number(product.quantity),
        tags: product.tags ? product.tags.split(',').map(t => t.trim()) : [],
        options: {
          colors: finalColors,
          sizes: product.sizes ? product.sizes.split(',').map(s => s.trim()) : [],
          sizeChart: sizeChart, // تم إضافة السطر هنا
        },
        seo: {
          title: product.seoTitle || product.title,
          description: product.seoDesc || product.description,
          slug: product.handle
        },
        images: imageUrls,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "products"), productData);
      alert("✅ تم إضافة المنتج بنجاح!");
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
        <h2 className="text-2xl font-bold">إضافة منتج جديد</h2>
        <button 
          onClick={handleSave}
          disabled={loading}
          className={`px-8 py-3 rounded font-bold text-black ${loading ? 'bg-gray-500' : 'bg-[#F5C518] hover:bg-[#ffdb4d]'}`}
        >
          {loading ? 'جاري الحفظ...' : 'حفظ ونشر'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* تفاصيل المنتج */}
          <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
             <label className="block text-sm font-bold mb-2 text-[#F5C518]">اسم المنتج</label>
             <input name="title" onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded text-white focus:border-[#F5C518] outline-none" placeholder="مثال: عباية كتان أسود" />
             
             <label className="block text-sm font-bold mt-4 mb-2 text-[#F5C518]">وصف المنتج</label>
             <textarea 
                name="description" 
                onChange={handleChange} 
                className="w-full h-64 bg-[#121212] border border-[#333] p-4 rounded text-white focus:border-[#F5C518] outline-none resize-none font-light leading-relaxed"
                placeholder="اكتب وصف المنتج هنا..."
             ></textarea>
          </div>

          {/* الصور */}
          <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
             <h3 className="font-bold mb-4 text-[#F5C518]">الصور</h3>
             <input name="mainImageUrl" onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-[#F5C518] text-sm mb-4" placeholder="رابط مباشر (ImgBB) - اختياري" />
             <div className="grid grid-cols-4 gap-2 mb-4">
                 {previews.map((src, i) => <img key={i} src={src} className="h-20 w-full object-cover rounded border border-[#333]" />)}
             </div>
             <div className="border-2 border-dashed border-[#333] p-6 text-center rounded relative hover:bg-[#222]">
                 <input type="file" multiple onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                 <span className="text-gray-400 text-sm">اضغط لرفع الصور</span>
             </div>
          </div>
          
          {/* الخيارات والألوان */}
          <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
            <h3 className="font-bold mb-4 text-[#F5C518]">الخيارات والألوان</h3>
            <div className="space-y-3">
                {colorVariants.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center bg-[#121212] p-2 rounded border border-[#333]">
                        <div className="w-8 h-8 rounded-full bg-black overflow-hidden border border-[#F5C518]">
                             {(v.preview || v.swatchUrl) && <img src={v.preview || v.swatchUrl} className="w-full h-full object-cover" />}
                        </div>
                        <input placeholder="اسم اللون" className="bg-transparent text-white text-sm outline-none flex-1" 
                            onChange={(e) => { const n = [...colorVariants]; n[i].name = e.target.value; setColorVariants(n); }} 
                        />
                        <input placeholder="رابط صورة اللون" className="bg-[#222] text-[#F5C518] text-xs p-1 rounded w-1/3"
                            onChange={(e) => { const n = [...colorVariants]; n[i].swatchUrl = e.target.value; setColorVariants(n); }}
                        />
                    </div>
                ))}
                <button onClick={addColorVariant} className="text-[#F5C518] text-xs font-bold">+ إضافة لون</button>
            </div>
            <div className="mt-4 border-t border-[#333] pt-4">
                 <label className="text-xs text-gray-400 block mb-1">المقاسات (مفصولة بفاصلة)</label>
                 <input name="sizes" onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white" placeholder="S, M, L, XL" />
            </div>
          </div>

          {/* 4. واجهة جدول دليل القياسات (Snippet 4) */}
          <div className="bg-[#1a1a1a] p-6 rounded border border-[#333] mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#F5C518]">دليل القياسات (بالسنتيمتر)</h3>
              <button onClick={addSizeRow} className="text-xs bg-[#333] hover:bg-[#444] text-white px-3 py-1 rounded transition">
                + إضافة صف
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-[#333]">
                    <th className="pb-2">المقاس</th>
                    <th className="pb-2">الطول</th>
                    <th className="pb-2">الصدر</th>
                    <th className="pb-2">الوسط</th>
                    <th className="pb-2">الوزن (كجم)</th>
                    <th className="pb-2">حذف</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {sizeChart.map((row, index) => (
                    <tr key={index} className="group">
                      <td className="p-1"><input value={row.size} onChange={(e) => handleSizeChartChange(index, 'size', e.target.value)} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-center text-[#F5C518] font-bold" placeholder="S" /></td>
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

        {/* القسم الأيسر */}
        <div className="space-y-6">
            <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
                <h3 className="font-bold mb-4 text-[#F5C518]">السعر والتنظيم</h3>
                <div className="space-y-3">
                    <div><label className="text-xs text-gray-500">السعر</label><input type="number" name="price" onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white"/></div>
                    <div><label className="text-xs text-gray-500">قبل الخصم</label><input type="number" name="compareAtPrice" onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white"/></div>
                    <div>
                        <label className="text-xs text-gray-500">القسم</label>
                        <select name="category" onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white">
                            <option value="shawls">شيلان</option>
                            <option value="winter">شتوي</option>
                            <option value="new">وصل حديثاً</option>
                        </select>
                    </div>
                </div>
            </div>
             <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
                <h3 className="font-bold mb-4 text-[#F5C518]">SEO (محركات البحث)</h3>
                <input name="seoTitle" onChange={handleChange} placeholder="عنوان الصفحة" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-sm mb-2 text-white" />
                <textarea name="seoDesc" onChange={handleChange} placeholder="الوصف" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-sm h-20 resize-none text-white"></textarea>
            </div>
        </div>
      </div>
    </div>
  );
}