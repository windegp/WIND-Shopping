"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import ImageUploader from "@/components/ImageUploader";
import { 
  Save, Loader2, ArrowRight, Image as ImageIcon, 
  CheckCircle2, Globe, Box, Settings, Tag, 
  Truck, Info, ListFilter, AlertCircle, Database, Layout, Trash2, X, ChevronRight, ChevronLeft
} from "lucide-react";

// ==========================================
// مكون الفورم الأساسي (كامل بـ 800 سطر منطقي)
// ==========================================
function CreateProductForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('id');
  const isEditing = !!productId;

  const [availableCollections, setAvailableCollections] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  // --- إضافات شيت شوبيفاي الكاملة (Constants) ---
  const csvColors = ['fuchsia', 'jeans-blue', 'beige', 'clear', 'green', 'black', 'burgundy', 'rose', 'patterned', 'navy', 'blue', 'red', 'brown', 'pink', 'gray', 'olive', 'chocolate', 'yellow', 'purple', 'orange', 'mint', 'terracotta', 'coral-pink', 'turquoise', 'gold', 'bronze', 'silver', 'off-white'];
  const csvSizes = ['One Size', '50-80-kg', '55-90-kg', '50-90-kg', '55-95-kg', '85-kg'];
  const csvTypes = ['Knitwear', 'Prayer Dress', 'Sweatshirt', 'Shawl', 'Hoodie', 'Sets', 'dress', 'Jacket'];
  const csvCollections = [
    'Apparel & Accessories > Clothing > Clothing Tops > Sweaters',
    'Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing',
    'Apparel & Accessories > Clothing > Clothing Tops > T-Shirts',
    'Apparel & Accessories > Clothing > Clothing Tops > Cardigans',
    'Apparel & Accessories > Clothing Accessories > Scarves & Shawls',
    'Apparel & Accessories > Clothing > Activewear > Activewear Sweatshirts & Hoodies > Hoodies',
    'Apparel & Accessories > Clothing > Clothing Tops > Hoodies',
    'Apparel & Accessories > Clothing > Outfit Sets',
    'Apparel & Accessories > Clothing > Clothing Tops > Tunics',
    'Apparel & Accessories > Clothing > Clothing Tops > Sweatshirts',
    'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
    'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets > Wrap Coats',
    'Apparel & Accessories > Clothing > Pants > Trousers'
  ];

  // --- إدارة الحالة (States) - كاملة بدون اختصار ---
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [chargeTax, setChargeTax] = useState(false);
  const [inventoryTracked, setInventoryTracked] = useState(true);
  const [physicalProduct, setPhysicalProduct] = useState(true);
  
  // 🔥 تعديل جوهري: لو منتج جديد، هنبدأ بخياري اللون والمقاس افتراضياً
  const [options, setOptions] = useState(isEditing ? [] : [
    { name: 'Color', values: '' },
    { name: 'Size', values: '' }
  ]);
  
  const [colorSwatches, setColorSwatches] = useState({}); // لحفظ الصور المرتبطة بالألوان
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [urlHandle, setUrlHandle] = useState("");

  const [productData, setProductData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    compareAtPrice: "",
    costPerItem: "",
    quantity: "",
    sku: "",
    barcode: "",
    sellOutOfStock: "No",
    weight: "",
    weightUnit: "kg",
    countryOfOrigin: "Egypt",
    status: "Active",
    type: "",
    vendor: "WIND",
    selectedCollections: [], // حقل الربط الجديد
    tags: "",
    themeTemplate: "Default product"
  });

  const [metafields, setMetafields] = useState({
    youMayAlsoLike: "",
    isdalBundle: "",
    sizeChart: "",
    colorsBundle: "",
    suggested: "",
    fabric: "",
    fit: ""
  });
  // ==========================================
  // 2. جلب الأقسام (Collections) المتاحة من Firestore
  // ==========================================
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "collections"));
        const cols = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAvailableCollections(cols);
      } catch (err) {
        console.error("Error fetching collections:", err);
      }
    };
    fetchCats();
  }, []);

// ==========================================
  // 3. جلب بيانات المنتج والربط الذكي (WIND Master Sync)
  // ==========================================
  useEffect(() => {
    if (productId && availableCollections.length > 0) {
      const fetchProduct = async () => {
        try {
          const docRef = doc(db, "products", productId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // --- [بداية خوارزمية الربط الذكي] ---
            let combinedSlugs = [];

            // أ) قراءة الروابط الموجودة فعلياً في المنتج (سواء في categories أو collections)
            const existingEntries = data.categories || data.collections || [];
            const entriesArray = Array.isArray(existingEntries) ? existingEntries : [existingEntries];

            entriesArray.forEach(entry => {
              if (typeof entry === 'string') {
                // 1. هل الكلمة دي slug موجود فعلاً عندنا في صفحة الكولكشن؟ (بنشيل السلاش للمطابقة)
                const cleanEntry = entry.replace(/^\/+/, '');
                const isDirectSlug = availableCollections.find(c => c.slug === cleanEntry);
                if (isDirectSlug) {
                  combinedSlugs.push(cleanEntry);
                }
                // 2. لو هي "جملة شوبيفاي الطويلة"، هندور جوه الجملة على أي اسم كولكشن من بتاعنا
                else {
                  const matchInString = availableCollections.find(c => 
                    entry.toLowerCase().includes(c.name.toLowerCase()) || 
                    entry.toLowerCase().includes(c.slug.toLowerCase())
                  );
                  if (matchInString) combinedSlugs.push(matchInString.slug);
                }
              }
            });

            // ب) الربط بناءً على الـ Type (الموجود في شيت شوبيفاي)
            if (data.type) {
              const typeToSearch = data.type.toLowerCase().trim();
              const matchedByType = availableCollections.find(c => 
                c.slug === typeToSearch.replace(/\s+/g, '-') || 
                c.name.toLowerCase() === typeToSearch
              );
              if (matchedByType && !combinedSlugs.includes(matchedByType.slug)) {
                combinedSlugs.push(matchedByType.slug);
              }
            }

            // تصفية المصفوفة من أي تكرار
            const finalSelected = [...new Set(combinedSlugs)];
            // --- [نهاية خوارزمية الربط] ---

            // تعبئة الـ States (نفس الهيكل بتاعك بالظبط بدون حذف)
            setProductData({
              title: data.title || "",
              description: data.description || "",
              category: data.category || "", // بنسيب حقل شوبيفاي زي ما هو للمطابقة
              price: data.price || (data.variants?.[0]?.price) || "",
              compareAtPrice: data.compareAtPrice || (data.variants?.[0]?.compareAtPrice) || "",
              costPerItem: data.costPerItem || "",
              quantity: data.quantity || (data.variants?.[0]?.quantity) || "",
              sku: data.sku || (data.variants?.[0]?.sku) || "",
              barcode: data.barcode || "",
              sellOutOfStock: data.sellOutOfStock || "No",
              weight: data.weight || "",
              weightUnit: data.weightUnit || "kg",
              countryOfOrigin: data.countryOfOrigin || "Egypt",
              status: data.status || "Active",
              type: data.type || "",
              vendor: data.vendor || "WIND",
              selectedCollections: finalSelected, // هنا المربعات هتنور لوحدها
              tags: data.tags || "",
              themeTemplate: data.themeTemplate || "Default product"
            });

            setImages(data.images || (data.image ? [data.image] : []));
            setSeoTitle(data.seo?.title || "");
            setSeoDesc(data.seo?.description || "");
            setUrlHandle(data.seo?.handle || productId);
            setColorSwatches(data.colorSwatches || {}); // الإضافة لجلب الروابط المرتبطة بالألوان

            setMetafields({
              youMayAlsoLike: data.metafields?.youMayAlsoLike || "",
              isdalBundle: data.metafields?.isdalBundle || "",
              sizeChart: data.metafields?.sizeChart || "",
              colorsBundle: data.metafields?.colorsBundle || "",
              suggested: data.metafields?.suggested || "",
              fabric: data.metafields?.fabric || "",
              fit: data.metafields?.fit || ""
            });

            if (data.options && data.options.length > 0) {
              setOptions(data.options);
            } else if (data.variants && data.variants.length > 0) {
              const loadedOptions = [];
              const opt1Name = data.variants[0].option1Name;
              if (opt1Name) {
                const vals = [...new Set(data.variants.map(v => v.option1Value))].filter(Boolean).join(', ');
                loadedOptions.push({ name: opt1Name, values: vals });
              }
              setOptions(loadedOptions.length > 0 ? loadedOptions : [ { name: 'Color', values: '' }, { name: 'Size', values: '' } ]);
            }
          }
        } catch (error) {
          console.error("Error loading product:", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchProduct();
    }
  }, [productId, availableCollections]);

  // ==========================================
  // 4. دوال التحكم (Handlers) - كاملة من الكود الأصلي
  // ==========================================
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleMetafieldChange = (e) => {
    const { name, value } = e.target;
    setMetafields(prev => ({ ...prev, [name]: value }));
  };

  const handleCollectionToggle = (colSlug) => {
    const current = productData.selectedCollections || [];
    if (current.includes(colSlug)) {
      setProductData({ ...productData, selectedCollections: current.filter(c => c !== colSlug) });
    } else {
      setProductData({ ...productData, selectedCollections: [...current, colSlug] });
    }
  };

  // دعم الرفع المتعدد (يقبل رابط واحد أو مصفوفة روابط من ImageUploader)
  const handleImageKitSuccess = (urls) => {
    if (Array.isArray(urls)) {
      setImages((prev) => [...prev, ...urls]);
    } else {
      setImages((prev) => [...prev, urls]);
    }
  };
  
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim() !== "") {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput(""); 
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // دوال تحريك الصور (يمين ويسار) لترتيبها
  const moveImageLeft = (index) => {
    if (index === 0) return; // لو دي أول صورة، مفيش تحريك
    const newImages = [...images];
    // تبديل مكان الصورة مع الصورة اللي قبلها
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
  };

  const moveImageRight = (index) => {
    if (index === images.length - 1) return; // لو دي آخر صورة، مفيش تحريك
    const newImages = [...images];
    // تبديل مكان الصورة مع الصورة اللي بعدها
    [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
    setImages(newImages);
  };

  const addOption = () => setOptions([...options, { name: '', values: '' }]);
  const removeOption = (index) => setOptions(options.filter((_, i) => i !== index));
  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  // 🔥 إضافة جديدة: التعرف الذكي على حقول الألوان والمقاسات
  const isColorOption = (name) => {
    if (!name) return false;
    const n = name.toLowerCase().trim();
    return n.includes('color') || n.includes('colour') || n.includes('لون') || n.includes('الوان');
  };

  const isSizeOption = (name) => {
    if (!name) return false;
    const n = name.toLowerCase().trim();
    return n.includes('size') || n.includes('مقاس') || n.includes('حجم');
  };

  // 🔥 إضافة جديدة: دالة لإضافة القيمة بسرعة من الأزرار الجاهزة (Chips)
  const appendOptionValue = (index, val) => {
    const currentValues = options[index].values;
    const currentArr = currentValues.split(',').map(s => s.trim()).filter(Boolean);
    if (!currentArr.includes(val)) {
      currentArr.push(val);
      // بنجمعهم ونحط مسافة بعد الفاصلة عشان الشكل، وممكن اليوزر يكمل كتابة
      updateOption(index, 'values', currentArr.join(', '));
    }
  };

  // ==========================================
  // 5. الحفظ الفعلي في قاعدة البيانات (Firebase)
  // ==========================================
  const handleSaveProduct = async () => {
    if (!productData.title) return alert("يرجى إدخال عنوان المنتج على الأقل!");
    
    setIsSaving(true);
    try {
      // تجهيز الرابط المخصص (Handle)
      const handleToUse = urlHandle || productData.title.toLowerCase().trim().replace(/\s+/g, '-');
      const documentId = isEditing ? productId : handleToUse;

 // --- الربط المصيري بين الأقسام والمنتج ---
      // السحر هنا: بنحفظ الـ slug مرتين (مرة عادي ومرة بسلاش / ) عشان يشتغل مع صفحة الكولكشن وشوبيفاي 100%
      const finalCategories = (productData.selectedCollections || []).flatMap(slug => [slug, `/${slug}`]);
      const { selectedCollections, ...cleanProductData } = productData; // عشان منخزنش الداتا المؤقتة في الفايربيس
      
      const finalProduct = {
        ...cleanProductData,
        categories: finalCategories, 
        collections: finalCategories, 
        images,
        chargeTax,
        inventoryTracked,
        physicalProduct,
        options,
        colorSwatches, // حفظ الصور المرتبطة بالألوان
        seo: { 
          title: seoTitle || productData.title, 
          description: seoDesc || productData.description.substring(0, 160), 
          handle: handleToUse 
        },
        metafields,
        updatedAt: serverTimestamp(),
      };

      if (!isEditing) {
        finalProduct.createdAt = serverTimestamp();
      }

      // الحفظ مع خاصية merge لضمان عدم ضياع أي بيانات مخفية
      await setDoc(doc(db, "products", documentId), finalProduct, { merge: true });
      
      alert(isEditing ? "تم تحديث بيانات WIND بنجاح! ✨" : "تم إضافة المنتج بنجاح! 🚀");
      router.push('/admin/products'); 
      
    } catch (error) {
      console.error("Save Error:", error);
      alert("حدث خطأ أثناء الحفظ، يرجى مراجعة الصلاحيات.");
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // 6. واجهة المستخدم (The UI) - العمود الرئيسي
  // ==========================================
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center text-[#202223] gap-4">
        <Loader2 className="animate-spin text-[#008060]" size={50} />
        <h2 className="text-sm font-bold text-gray-500">جاري تحميل بيانات المنتج...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans pb-24 text-[#202223]" dir="rtl">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      
        {/* هيدر الصفحة - الأزرار والتحكم السريع */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 bg-white">
              <ArrowRight size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#202223] flex items-center gap-2">
                {isEditing ? "تعديل المنتج" : "إضافة منتج جديد"}
              </h1>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <button 
              onClick={handleSaveProduct} 
              disabled={isSaving}
              className="w-full sm:w-auto bg-[#008060] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[#006e52] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
              {isEditing ? "حفظ التعديلات" : "حفظ المنتج"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative items-start">
          
          {/* العمود الأيمن (المحتوى والبيانات - 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* صندوق العنوان والوصف */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <div className="mb-6">
                <label className="block text-sm font-bold text-[#202223] mb-2">
                  العنوان (Title)
                </label>
                <input 
                  type="text" 
                  name="title"
                  value={productData.title}
                  onChange={handleProductChange}
                  placeholder="مثال: قميص قطني قصير الأكمام" 
                  className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg text-sm focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none transition-all text-[#202223]" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#202223] mb-2">
                  الوصف (Description)
                </label>
                <div className="rounded-lg border border-gray-300 overflow-hidden focus-within:border-[#008060] focus-within:ring-1 focus-within:ring-[#008060] transition-all bg-white">
                   <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex gap-3 items-center">
                      <span className="font-bold cursor-help hover:text-black">B</span>
                      <span className="font-bold cursor-help hover:text-black italic">I</span>
                      <span className="font-bold cursor-help hover:text-black underline">U</span>
                   </div>
                   <textarea 
                    name="description"
                    value={productData.description}
                    onChange={handleProductChange}
                    rows="8" 
                    className="w-full p-4 text-sm text-[#202223] outline-none resize-y"
                    placeholder="أدخل وصفاً تفصيلياً للمنتج..."
                   ></textarea>
                </div>
              </div>
            </div>

            {/* صندوق الوسائط والصور */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-[#202223]">الوسائط (Media)</h3>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors group relative">
                <ImageUploader onUploadSuccess={handleImageKitSuccess} />
                
                <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                  <input 
                    type="url" 
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="إضافة صورة عبر الرابط (URL)..." 
                    className="flex-1 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all text-[#202223]"
                  />
                  <button 
                    onClick={handleAddImageUrl} 
                    type="button" 
                    className="bg-white border border-gray-300 text-[#202223] px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    إضافة رابط
                  </button>
                </div>
              </div>

       {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-6">
                  {images.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
                      <img src={src} className="w-full h-full object-cover" alt="product media"/>
                      
                      {/* علامة الغلاف للصورة الأولى */}
                      <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        {i === 0 ? "الغلاف" : i + 1}
                      </div>

                      {/* طبقة التحكم عند الوقوف بالماوس */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        {/* سهم يمين (يخليها تروح للأول عشان عربي RTL) */}
                        {i > 0 && (
                          <button 
                            type="button"
                            onClick={() => moveImageLeft(i)} 
                            className="p-1 bg-white text-gray-800 rounded hover:bg-gray-200 transition-colors shadow-sm"
                            title="تحريك للأول"
                          >
                            <ChevronRight size={16} />
                          </button>
                        )}

                        {/* زر الحذف */}
                        <button 
                          type="button"
                          onClick={() => removeImage(i)} 
                          className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors shadow-sm"
                          title="حذف الصورة"
                        >
                          <Trash2 size={15} />
                        </button>

                        {/* سهم يسار (يخليها تروح للآخر) */}
                        {i < images.length - 1 && (
                          <button 
                            type="button"
                            onClick={() => moveImageRight(i)} 
                            className="p-1 bg-white text-gray-800 rounded hover:bg-gray-200 transition-colors shadow-sm"
                            title="تحريك للآخر"
                          >
                            <ChevronLeft size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* صندوق التصنيف (Shopify Category Sync) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <label className="block text-sm font-bold text-[#202223] mb-2">
                 التصنيف الأساسي (Category)
              </label>
              <input 
                type="text" 
                name="category"
                value={productData.category}
                onChange={handleProductChange}
                list="csv-collections"
                placeholder="ابحث عن تصنيف..." 
                className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all text-[#202223]" 
              />
              <p className="text-xs text-gray-500 mt-2">يحدد الفئة الضريبية ويساعد في تحسين محركات البحث.</p>
            </div>

            {/* 4. التسعير (Pricing) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#202223] mb-4">التسعير (Pricing)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">السعر (Price)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">E£</span>
                    <input 
                      type="number" 
                      name="price"
                      value={productData.price}
                      onChange={handleProductChange}
                      placeholder="0.00" 
                      className="w-full bg-white border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all text-[#202223]" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">السعر قبل الخصم (Compare at price)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">E£</span>
                    <input 
                      type="number" 
                      name="compareAtPrice"
                      value={productData.compareAtPrice}
                      onChange={handleProductChange}
                      placeholder="0.00" 
                      className="w-full bg-white border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all text-[#202223]" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs text-gray-600 mb-1.5">التكلفة (Cost per item)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">E£</span>
                    <input 
                      type="number" 
                      name="costPerItem"
                      value={productData.costPerItem}
                      onChange={handleProductChange}
                      placeholder="0.00" 
                      className="w-full bg-white border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all text-[#202223]" 
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="chargeTax"
                    checked={chargeTax}
                    onChange={() => setChargeTax(!chargeTax)}
                    className="w-4 h-4 text-[#008060] border-gray-300 rounded focus:ring-[#008060]"
                  />
                  <label htmlFor="chargeTax" className="text-sm text-gray-700 cursor-pointer">فرض ضرائب على هذا المنتج</label>
                </div>
              </div>
            </div>

            {/* 5. المخزون (Inventory) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#202223] mb-4">المخزون (Inventory)</h3>
              
              <div className="mb-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="inventoryTracked"
                    checked={inventoryTracked}
                    onChange={() => setInventoryTracked(!inventoryTracked)}
                    className="w-4 h-4 text-[#008060] border-gray-300 rounded focus:ring-[#008060]"
                  />
                  <label htmlFor="inventoryTracked" className="text-sm text-gray-700 cursor-pointer">تتبع الكمية (Track quantity)</label>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="sellOutOfStock"
                    checked={productData.sellOutOfStock === "Yes"}
                    onChange={(e) => handleProductChange({ target: { name: 'sellOutOfStock', value: e.target.checked ? "Yes" : "No" }})}
                    className="w-4 h-4 text-[#008060] border-gray-300 rounded focus:ring-[#008060]"
                  />
                  <label htmlFor="sellOutOfStock" className="text-sm text-gray-700 cursor-pointer">الاستمرار في البيع عند نفاد الكمية</label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pt-6 border-t border-gray-100">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">الكمية المتاحة</label>
                  <input 
                    type="number" 
                    name="quantity"
                    value={productData.quantity}
                    onChange={handleProductChange}
                    placeholder="0" 
                    className="w-full bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all text-[#202223]" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">رمز الصنف (SKU)</label>
                  <input 
                    type="text" 
                    name="sku" 
                    value={productData.sku} 
                    onChange={handleProductChange} 
                    className="w-full bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all text-[#202223]" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">الباركود (Barcode)</label>
                  <input 
                    type="text" 
                    name="barcode" 
                    value={productData.barcode} 
                    onChange={handleProductChange} 
                    className="w-full bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] transition-all text-[#202223]" 
                  />
                </div>
              </div>
            </div>

            {/* 6. البدائل (Variants) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-bold text-[#202223]">البدائل (Variants)</h3>
                 <button onClick={addOption} className="text-[#005bd3] text-sm font-bold hover:underline">+ إضافة خيارات أخرى</button>
              </div>
              
              <div className="space-y-4">
                {options.map((option, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 p-4 sm:p-5 rounded-xl relative group">
                    <button 
                      onClick={() => removeOption(index)} 
                      className="absolute top-2 left-2 text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="إزالة هذا الخيار"
                    >
                      <X size={16} />
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">اسم الخيار (Option name)</label>
                        <input 
                          type="text" 
                          value={option.name} 
                          onChange={(e) => updateOption(index, 'name', e.target.value)} 
                          placeholder="مثال: Color أو Size" 
                          className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] text-[#202223]" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">القيم (مفصولة بفاصلة)</label>
                        <input 
                          type="text" 
                          value={option.values} 
                          onChange={(e) => updateOption(index, 'values', e.target.value)} 
                          placeholder="Red, Blue, Green" 
                          className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] text-[#202223]" 
                        />
                      </div>
                      
                      {/* 🔥 الأزرار السريعة (Chips) للألوان 🔥 */}
                      {isColorOption(option.name) && (
                        <div className="col-span-1 sm:col-span-2 mt-1">
                          <span className="text-[10px] text-gray-500 font-bold mb-2 block">ألوان مقترحة (اضغط للإضافة السريعة):</span>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                            {csvColors.map(c => (
                              <button 
                                key={c} 
                                type="button" 
                                onClick={() => appendOptionValue(index, c)}
                                className="bg-white hover:bg-[#008060] hover:text-white text-[#202223] text-[11px] px-3 py-1.5 rounded-full transition-colors border border-gray-300 shadow-sm"
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 🔥 الأزرار السريعة (Chips) للمقاسات 🔥 */}
                      {isSizeOption(option.name) && (
                        <div className="col-span-1 sm:col-span-2 mt-1">
                          <span className="text-[10px] text-gray-500 font-bold mb-2 block">مقاسات مقترحة (اضغط للإضافة السريعة):</span>
                          <div className="flex flex-wrap gap-2">
                            {csvSizes.map(s => (
                              <button 
                                key={s} 
                                type="button" 
                                onClick={() => appendOptionValue(index, s)}
                                className="bg-white hover:bg-[#008060] hover:text-white text-[#202223] text-[11px] px-3 py-1.5 rounded-full transition-colors border border-gray-300 shadow-sm"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 🔥 اختيار صورة المنتج لكل لون 🔥 */}
                    {isColorOption(option.name) && option.values.trim() !== '' && (
                      <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <label className="block text-xs font-bold text-[#202223] mb-3">ربط الألوان بصور المنتج</label>
                        
                        {images.length === 0 ? (
                          <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-md">أضف صوراً للمنتج في الأعلى لتتمكن من ربطها بالألوان.</p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {option.values.split(',').map(val => val.trim()).filter(Boolean).map((colorName, i) => (
                              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                                <span className="text-xs font-bold text-[#202223] w-20 shrink-0">{colorName}:</span>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                  {images.map((imgUrl, imgIdx) => (
                                    <img
                                      key={imgIdx}
                                      src={imgUrl}
                                      onClick={() => setColorSwatches({...colorSwatches, [colorName]: imgUrl})}
                                      className={`w-10 h-10 shrink-0 rounded object-cover cursor-pointer border-2 transition-all duration-200 ${colorSwatches[colorName] === imgUrl ? 'border-[#008060] shadow-sm scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                      alt={`اختيار صورة لـ ${colorName}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 7. الـ Metafields والبيانات المخصصة */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#202223] mb-4">بيانات مخصصة (Metafields)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {Object.keys(metafields).map((key) => (
                   <div key={key}>
                      <label className="block text-xs text-gray-600 mb-1.5 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <input 
                        type="text" 
                        name={key} 
                        value={metafields[key]} 
                        onChange={handleMetafieldChange} 
                        className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] text-[#202223]" 
                      />
                   </div>
                 ))}
              </div>
            </div>

            {/* 8. محركات البحث (SEO) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#202223] mb-1">محركات البحث (SEO)</h3>
              <p className="text-xs text-gray-500 mb-5">كيف سيظهر منتجك في نتائج بحث جوجل.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">عنوان الصفحة (Page title)</label>
                  <input 
                    type="text" 
                    value={seoTitle} 
                    onChange={(e) => setSeoTitle(e.target.value)} 
                    maxLength={70} 
                    className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] text-[#202223]" 
                  />
                  <p className="text-[10px] text-gray-500 mt-1">{seoTitle.length} / 70</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">الوصف (Meta description)</label>
                  <textarea 
                    value={seoDesc} 
                    onChange={(e) => setSeoDesc(e.target.value)} 
                    maxLength={320} 
                    className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none h-20 resize-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] text-[#202223]"
                  ></textarea>
                  <p className="text-[10px] text-gray-500 mt-1">{seoDesc.length} / 320</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">الرابط (URL handle)</label>
                  <div className="flex items-center text-sm bg-gray-50 border border-gray-300 rounded-lg px-3 overflow-hidden" dir="ltr">
                    <span className="text-gray-500 whitespace-nowrap py-2">windeg.com/products/</span>
                    <input 
                      type="text" 
                      value={urlHandle} 
                      onChange={(e) => setUrlHandle(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
                      className="bg-transparent text-[#202223] outline-none flex-1 py-2 w-full min-w-0" 
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* العمود الأيسر (الجانبي - 33%) */}
          <div className="space-y-6 lg:sticky lg:top-6">
            
            {/* صندوق الحالة */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <label className="block text-sm font-bold text-[#202223] mb-3">حالة المنتج (Status)</label>
              <select 
                name="status" 
                value={productData.status} 
                onChange={handleProductChange} 
                className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] text-[#202223] cursor-pointer"
              >
                <option value="Active">نشط (Active)</option>
                <option value="Draft">مسودة (Draft)</option>
              </select>
            </div>

            {/* 🔥 قائمة الأقسام (Collections) - تم تحسينها جداً للموبايل 🔥 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold text-[#202223]">أقسام المتجر (Collections)</h3>
                <p className="text-[10px] text-gray-500 mt-1">اختر الأقسام التي سيظهر فيها المنتج.</p>
              </div>
              
              <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                {availableCollections.length > 0 ? (
                  <div className="space-y-1">
                    {availableCollections.map((col) => {
                      const isChecked = (productData.selectedCollections || []).includes(col.slug);
                      return (
                        <label 
                          key={col.id} 
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                        >
                          <div className="pt-0.5">
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => handleCollectionToggle(col.slug)} 
                              className="w-4 h-4 text-[#008060] border-gray-300 rounded focus:ring-[#008060] cursor-pointer" 
                            />
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className={`text-sm font-bold ${isChecked ? 'text-[#008060]' : 'text-[#202223]'}`}>{col.name}</span>
                            <span className="text-[10px] text-gray-500" dir="ltr">{col.slug}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500">جاري تحميل الأقسام...</div>
                )}
              </div>
            </div>

            {/* التنظيم (Organization) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#202223] mb-1">التنظيم (Organization)</h3>
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">النوع (Product type)</label>
                <input 
                  type="text" 
                  name="type" 
                  value={productData.type} 
                  onChange={handleProductChange} 
                  list="csv-types" 
                  placeholder="مثال: تيشرتات" 
                  className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] text-[#202223]" 
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">المورد (Vendor)</label>
                <input 
                  type="text" 
                  name="vendor" 
                  value={productData.vendor} 
                  onChange={handleProductChange} 
                  className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] text-[#202223]" 
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">العلامات (Tags - مفصولة بفاصلة)</label>
                <input 
                  type="text" 
                  name="tags" 
                  value={productData.tags} 
                  onChange={handleProductChange} 
                  placeholder="صيفي، جديد" 
                  className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060] text-[#202223]" 
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Datalists الكاملة لضمان التوافق مع شيت Shopify */}
      <datalist id="csv-collections">
        {csvCollections.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="csv-types">
        {csvTypes.map(t => <option key={t} value={t} />)}
      </datalist>
      <datalist id="csv-colors">
        {csvColors.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="csv-sizes">
        {csvSizes.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="csv-option-names">
        <option value="Color" /><option value="Size" />
      </datalist>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d2d5d8; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a6aab0; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// التصدير النهائي المغلف بـ Suspense لضمان الاستقرار على Vercel
export default function CreateProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center text-[#202223] gap-4">
        <Loader2 className="animate-spin text-[#008060]" size={50} />
        <h2 className="text-sm font-bold text-gray-500">جاري تهيئة نظام إدارة المنتجات...</h2>
      </div>
    }>
      <CreateProductForm />
    </Suspense>
  );
}