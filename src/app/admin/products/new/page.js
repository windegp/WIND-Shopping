"use client";
import { useState } from 'react';
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CreateProductPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // الحالة الشاملة للمنتج (State)
  const [product, setProduct] = useState({
    title: '',
    description: '',
    price: '',
    compareAtPrice: '',
    costPerItem: '', // لن يظهر للعميل
    sku: '',
    quantity: 0,
    category: 'shawls',
    tags: '', // مفصول بفواصل
    colors: '', // مفصول بفواصل
    sizes: '',  // مفصول بفواصل
    seoTitle: '',
    seoDesc: '',
    handle: '', // رابط الصفحة (Slug)
  });

  const [images, setImages] = useState([]);

  // دالة التعامل مع التغييرات
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    
    // توليد الرابط تلقائياً من العنوان إذا كان فارغاً
    if (name === 'title' && !product.handle) {
      setProduct(prev => ({ ...prev, handle: value.toLowerCase().replace(/\s+/g, '-') }));
    }
  };

  // دالة الحفظ
  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. رفع الصور (يمكن تطويرها لرفع متعدد)
      let imageUrls = [];
      for (let img of images) {
        const imgRef = ref(storage, `products/${Date.now()}-${img.name}`);
        const snap = await uploadBytes(imgRef, img);
        const url = await getDownloadURL(snap.ref);
        imageUrls.push(url);
      }

      // 2. تجهيز البيانات للإرسال
      const productData = {
        ...product,
        price: Number(product.price),
        compareAtPrice: Number(product.compareAtPrice),
        costPerItem: Number(product.costPerItem), // لحساب ربحك
        quantity: Number(product.quantity),
        tags: product.tags.split(',').map(t => t.trim()),
        options: {
          colors: product.colors.split(',').map(c => c.trim()),
          sizes: product.sizes.split(',').map(s => s.trim()),
        },
        seo: {
          title: product.seoTitle || product.title,
          description: product.seoDesc || product.description.substring(0, 160),
          slug: product.handle // الرابط المخصص
        },
        images: imageUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "products"), productData);
      alert("تم إنشاء المنتج بنجاح! الرابط: /product/" + product.handle);
      
    } catch (error) {
      console.error(error);
      alert("حدث خطأ: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f1f1f1] pb-20" dir="rtl">
      {/* الشريط العلوي */}
      <div className="bg-[#1a1a1a] text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <h1 className="font-bold text-lg">WIND Admin <span className="text-[#F5C518] text-xs">PRO</span></h1>
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
        
        {/* العمود الرئيسي (يمين) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* 1. المعلومات الأساسية */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <label className="block text-sm font-bold mb-2">عنوان المنتج</label>
            <input 
              name="title" value={product.title} onChange={handleChange}
              type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-[#F5C518] outline-none" placeholder="مثال: شال كشمير شتوي" 
            />
            
            <label className="block text-sm font-bold mt-4 mb-2">الوصف</label>
            <textarea 
              name="description" value={product.description} onChange={handleChange}
              className="w-full border p-2 rounded h-40 focus:ring-2 focus:ring-[#F5C518] outline-none" placeholder="اكتب تفاصيل المنتج..." 
            />
          </div>

          {/* 2. الوسائط (الصور) */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <h3 className="font-bold mb-4">الوسائط</h3>
            <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded hover:bg-gray-50 cursor-pointer relative">
              <input 
                type="file" multiple onChange={(e) => setImages([...e.target.files])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <p className="text-gray-500">
                {images.length > 0 ? `تم اختيار ${images.length} صور` : "اضغط لرفع الصور أو اسحبها هنا"}
              </p>
            </div>
          </div>

          {/* 3. التسعير (شامل التكلفة والربح) */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <h3 className="font-bold mb-4">التسعير</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">السعر (للعميل)</label>
                <input name="price" value={product.price} onChange={handleChange} type="number" className="w-full border p-2 rounded" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">السعر قبل الخصم</label>
                <input name="compareAtPrice" value={product.compareAtPrice} onChange={handleChange} type="number" className="w-full border p-2 rounded" placeholder="0.00" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">التكلفة عليك (Cost per item)</label>
                <input name="costPerItem" value={product.costPerItem} onChange={handleChange} type="number" className="w-full border p-2 rounded" placeholder="0.00" />
                <p className="text-[10px] text-gray-400 mt-1">لن يرى العملاء هذا الرقم.</p>
              </div>
              <div className="flex items-center text-sm text-green-600 pt-6">
                الربح المتوقع: {product.price && product.costPerItem ? product.price - product.costPerItem : 0} ج.م
              </div>
            </div>
          </div>

          {/* 4. المخزون والخيارات */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <h3 className="font-bold mb-4">المخزون والخيارات</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">وحدة التخزين (SKU)</label>
                <input name="sku" value={product.sku} onChange={handleChange} type="text" className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">الكمية المتاحة</label>
                <input name="quantity" value={product.quantity} onChange={handleChange} type="number" className="w-full border p-2 rounded" />
              </div>
            </div>
            
            <label className="text-xs text-gray-600 block mb-1">الألوان (افصل بفاصلة)</label>
            <input name="colors" value={product.colors} onChange={handleChange} type="text" className="w-full border p-2 rounded mb-3" placeholder="أحمر, أسود, أبيض" />
            
            <label className="text-xs text-gray-600 block mb-1">المقاسات (افصل بفاصلة)</label>
            <input name="sizes" value={product.sizes} onChange={handleChange} type="text" className="w-full border p-2 rounded" placeholder="S, M, L, XL" />
          </div>

          {/* 5. تحسين محركات البحث (SEO) */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">معاينة محرك البحث (SEO)</h3>
              <span className="text-xs text-[#F5C518] cursor-pointer">تعديل</span>
            </div>
            <div className="bg-gray-50 p-4 rounded mb-4 text-left" dir="ltr">
              <h4 className="text-blue-600 text-lg hover:underline cursor-pointer truncate">{product.seoTitle || product.title}</h4>
              <p className="text-green-700 text-sm">wind-eg.com/products/{product.handle}</p>
              <p className="text-gray-600 text-sm truncate">{product.seoDesc || product.description}</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">عنوان الصفحة (Page Title)</label>
                <input name="seoTitle" value={product.seoTitle} onChange={handleChange} type="text" className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">الوصف (Meta Description)</label>
                <textarea name="seoDesc" value={product.seoDesc} onChange={handleChange} className="w-full border p-2 rounded h-20 resize-none" maxLength={320} />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">رابط الصفحة (URL Handle)</label>
                <input name="handle" value={product.handle} onChange={handleChange} type="text" className="w-full border p-2 rounded bg-gray-50" />
              </div>
            </div>
          </div>
        </div>

        {/* العمود الجانبي (يسار) */}
        <div className="space-y-6">
          {/* حالة المنتج */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <h3 className="font-bold mb-4">حالة المنتج</h3>
            <select className="w-full border p-2 rounded bg-white">
              <option>نشط (Active)</option>
              <option>مسودة (Draft)</option>
            </select>
          </div>

          {/* تنظيم المنتج */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <h3 className="font-bold mb-4">التنظيم</h3>
            
            <label className="text-xs text-gray-600 block mb-1">القسم (Collection)</label>
            <select name="category" value={product.category} onChange={handleChange} className="w-full border p-2 rounded mb-4">
              <option value="shawls">شيلان</option>
              <option value="isdal">إسدالات</option>
              <option value="winter">شتوي</option>
              <option value="new">وصل حديثاً</option>
            </select>

            <label className="text-xs text-gray-600 block mb-1">Tags (الكلمات المفتاحية)</label>
            <input name="tags" value={product.tags} onChange={handleChange} type="text" className="w-full border p-2 rounded" placeholder="قطن, خصم, جديد" />
          </div>
        </div>

      </div>
    </div>
  );
}