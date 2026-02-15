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

  const handleColorFile = (index, file) => {
    const newVariants = [...colorVariants];
    newVariants[index].file = file;
    newVariants[index].preview = URL.createObjectURL(file);
    setColorVariants(newVariants);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let imageUrls = product.mainImageUrl ? [product.mainImageUrl] : [];
      
      // رفع الصور
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

      // رفع الألوان
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
    <div className="max-w-5xl mx-auto space-y-6">
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
        {/* القسم الأيمن: البيانات الرئيسية */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
             <label className="block text-sm font-bold mb-2 text-[#F5C518]">اسم المنتج</label>
             <input name="title" onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-3 rounded text-white focus:border-[#F5C518] outline-none" placeholder="مثال: عباية كتان أسود" />
             
             <label className="block text-sm font-bold mt-4 mb-2 text-[#F5C518]">وصف المنتج</label>
             {/* هنا استبدلنا المحرر بـ Textarea آمن */}
             <textarea 
                name="description" 
                onChange={handleChange} 
                className="w-full h-64 bg-[#121212] border border-[#333] p-4 rounded text-white focus:border-[#F5C518] outline-none resize-none font-light leading-relaxed"
                placeholder="اكتب وصف المنتج هنا... (يدعم الكتابة النصية المباشرة)"
             ></textarea>
             <p className="text-xs text-gray-500 mt-2">يمكنك استخدام هذا الحقل للكتابة بأمان دون أخطاء تقنية.</p>
          </div>

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
          
           {/* المخزون والألوان */}
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
            <div className="mt-4">
                 <label className="text-xs text-gray-400 block mb-1">المقاسات</label>
                 <input name="sizes" onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white" placeholder="S, M, L, XL" />
            </div>
          </div>
        </div>

        {/* القسم الأيسر: الإعدادات الجانبية */}
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