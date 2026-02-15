"use client";
import { useState, useEffect } from 'react';
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CreateProductPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // الحالة الشاملة للمنتج
  const [product, setProduct] = useState({
    title: '', description: '', price: '', compareAtPrice: '',
    costPerItem: '', sku: '', quantity: 0, category: 'shawls',
    tags: '', sizes: '', seoTitle: '', seoDesc: '', handle: '',
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]); // للمعاينة
  const [colorVariants, setColorVariants] = useState([]); // للألوان بالصور

  // دالة التعامل مع التغييرات
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    if (name === 'title' && !product.handle) {
      setProduct(prev => ({ ...prev, handle: value.toLowerCase().replace(/\s+/g, '-') }));
    }
  };

  // معالجة الصور الرئيسية
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  // إضافة خيار لون بصورة
  const addColorVariant = () => {
    setColorVariants([...colorVariants, { name: '', file: null, preview: '' }]);
  };

  const handleColorFile = (index, file) => {
    const newVariants = [...colorVariants];
    newVariants[index].file = file;
    newVariants[index].preview = URL.createObjectURL(file);
    setColorVariants(newVariants);
  };

  // دالة الحفظ
  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. رفع الصور الرئيسية
      let imageUrls = [];
      for (let img of images) {
        const imgRef = ref(storage, `products/${Date.now()}-${img.name}`);
        const snap = await uploadBytes(imgRef, img);
        const url = await getDownloadURL(snap.ref);
        imageUrls.push(url);
      }

      // 2. رفع صور الألوان
      let finalColors = [];
      for (let variant of colorVariants) {
        let swatchUrl = "";
        if (variant.file) {
          const vRef = ref(storage, `variants/${Date.now()}-${variant.file.name}`);
          const vSnap = await uploadBytes(vRef, variant.file);
          swatchUrl = await getDownloadURL(vSnap.ref);
        }
        finalColors.push({ name: variant.name, swatch: swatchUrl });
      }

      // 3. تجهيز البيانات
      const productData = {
        ...product,
        price: Number(product.price),
        compareAtPrice: Number(product.compareAtPrice),
        costPerItem: Number(product.costPerItem),
        quantity: Number(product.quantity),
        tags: product.tags.split(',').map(t => t.trim()),
        options: {
          colors: finalColors, // الآن الألوان أصبحت مصفوفة كائنات (اسم وصورة)
          sizes: product.sizes.split(',').map(s => s.trim()),
        },
        seo: {
          title: product.seoTitle || product.title,
          description: product.seoDesc || product.description.substring(0, 160),
          slug: product.handle
        },
        images: imageUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "products"), productData);
      alert("تم الحفظ بنجاح!");
      window.location.reload();
      
    } catch (error) {
      console.error(error);
      alert("حدث خطأ: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20 font-sans" dir="rtl">
      {/* الشريط العلوي - معدل ليكون واضحاً */}
      <div className="bg-[#1a1a1a] border-b border-[#333] p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <h1 className="font-bold text-lg text-white">WIND Admin <span className="text-[#F5C518] text-xs">PRO</span></h1>
        <div className="flex gap-3">
          <button className="text-gray-400 text-sm hover:text-white">إلغاء</button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className={`px-6 py-2 rounded-sm font-bold text-black ${loading ? 'bg-gray-500' : 'bg-[#F5C518] hover:bg-[#ffdb4d]'}`}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        <div className="md:col-span-2 space-y-6">
          
          {/* 1. المعلومات الأساسية - خلفية داكنة لنصوص واضحة */}
          <div className="bg-[#1a1a1a] p-6 rounded shadow-sm border border-[#333]">
            <label className="block text-sm font-bold mb-2 text-[#F5C518]">عنوان المنتج</label>
            <input 
              name="title" value={product.title} onChange={handleChange}
              type="text" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none focus:border-[#F5C518]" 
              placeholder="مثال: شال كشمير شتوي" 
            />
            
            <label className="block text-sm font-bold mt-4 mb-2 text-[#F5C518]">الوصف</label>
            <textarea 
              name="description" value={product.description} onChange={handleChange}
              className="w-full bg-[#121212] border border-[#333] p-2 rounded h-40 text-white outline-none focus:border-[#F5C518]" 
              placeholder="اكتب تفاصيل المنتج..." 
            />
          </div>

          {/* 2. الوسائط (مع المعاينة) */}
          <div className="bg-[#1a1a1a] p-6 rounded shadow-sm border border-[#333]">
            <h3 className="font-bold mb-4 text-[#F5C518]">الوسائط</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {previews.map((src, i) => (
                <img key={i} src={src} className="w-full h-24 object-cover rounded border border-[#333]" />
              ))}
            </div>
            <div className="border-2 border-dashed border-[#333] p-8 text-center rounded hover:bg-[#222] cursor-pointer relative">
              <input 
                type="file" multiple onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <p className="text-gray-500">اضغط لرفع الصور أو اسحبها هنا</p>
            </div>
          </div>

          {/* 3. التسعير */}
          <div className="bg-[#1a1a1a] p-6 rounded shadow-sm border border-[#333]">
            <h3 className="font-bold mb-4 text-[#F5C518]">التسعير</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">السعر (للعميل)</label>
                <input name="price" value={product.price} onChange={handleChange} type="number" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">السعر قبل الخصم</label>
                <input name="compareAtPrice" value={product.compareAtPrice} onChange={handleChange} type="number" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#333] grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">التكلفة عليك</label>
                <input name="costPerItem" value={product.costPerItem} onChange={handleChange} type="number" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white" />
              </div>
              <div className="flex items-center text-sm text-green-500 pt-6">
                الربح المتوقع: {product.price && product.costPerItem ? product.price - product.costPerItem : 0} ج.م
              </div>
            </div>
          </div>

          {/* 4. المخزون والخيارات (تم تعديل الألوان لتكون بصور) */}
          <div className="bg-[#1a1a1a] p-6 rounded shadow-sm border border-[#333]">
            <h3 className="font-bold mb-4 text-[#F5C518]">المخزون والخيارات</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <input name="sku" value={product.sku} onChange={handleChange} placeholder="SKU" className="bg-[#121212] border border-[#333] p-2 rounded" />
              <input name="quantity" value={product.quantity} onChange={handleChange} type="number" placeholder="الكمية" className="bg-[#121212] border border-[#333] p-2 rounded" />
            </div>
            
            <label className="text-xs text-gray-400 block mb-2">الألوان المتاحة (صور الدوائر)</label>
            <div className="space-y-3 mb-4">
              {colorVariants.map((v, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#121212] p-2 rounded border border-[#333]">
                  <div className="w-10 h-10 rounded-full border border-[#F5C518] overflow-hidden bg-black">
                    {v.preview && <img src={v.preview} className="w-full h-full object-cover" />}
                  </div>
                  <input 
                    placeholder="اسم اللون" 
                    className="bg-transparent border-b border-[#333] outline-none text-sm flex-1"
                    onChange={(e) => {
                      const n = [...colorVariants];
                      n[i].name = e.target.value;
                      setColorVariants(n);
                    }}
                  />
                  <input type="file" className="hidden" id={`color-${i}`} onChange={(e) => handleColorFile(i, e.target.files[0])} />
                  <label htmlFor={`color-${i}`} className="text-[10px] bg-[#333] p-1 cursor-pointer rounded">اختر صورة اللون</label>
                </div>
              ))}
              <button onClick={addColorVariant} className="text-[#F5C518] text-sm">+ إضافة لون جديد</button>
            </div>
            
            <label className="text-xs text-gray-400 block mb-1">المقاسات (افصل بفاصلة)</label>
            <input name="sizes" value={product.sizes} onChange={handleChange} type="text" className="w-full bg-[#121212] border border-[#333] p-2 rounded" placeholder="S, M, L" />
          </div>

        </div>

        {/* العمود الجانبي */}
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] p-6 rounded shadow-sm border border-[#333]">
            <h3 className="font-bold mb-4 text-[#F5C518]">القسم</h3>
            <select name="category" value={product.category} onChange={handleChange} className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white">
              <option value="shawls">شيلان</option>
              <option value="isdal">إسدالات</option>
              <option value="winter">شتوي</option>
            </select>
          </div>
          <div className="bg-[#1a1a1a] p-6 rounded shadow-sm border border-[#333]">
            <h3 className="font-bold mb-4 text-[#F5C518]">تحسين محركات البحث</h3>
            <input name="seoTitle" value={product.seoTitle} onChange={handleChange} placeholder="عنوان SEO" className="w-full bg-[#121212] border border-[#333] p-2 rounded mb-2 text-sm" />
            <textarea name="seoDesc" value={product.seoDesc} onChange={handleChange} placeholder="وصف SEO" className="w-full bg-[#121212] border border-[#333] p-2 rounded h-20 text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}