"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import ImageUploader from "@/components/ImageUploader";
import { 
  Save, Loader2, ArrowRight, Image as ImageIcon, 
  CheckCircle2, Globe, Box, Settings, Tag, 
  Truck, Info, ListFilter, AlertCircle, Database, Layout
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
  const [options, setOptions] = useState([]);
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
                // 1. هل الكلمة دي slug موجود فعلاً عندنا في صفحة الكولكشن؟
                const isDirectSlug = availableCollections.find(c => c.slug === entry);
                if (isDirectSlug) {
                  combinedSlugs.push(entry);
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

            setMetafields({
              youMayAlsoLike: data.metafields?.youMayAlsoLike || "",
              isdalBundle: data.metafields?.isdalBundle || "",
              sizeChart: data.metafields?.sizeChart || "",
              colorsBundle: data.metafields?.colorsBundle || "",
              suggested: data.metafields?.suggested || "",
              fabric: data.metafields?.fabric || "",
              fit: data.metafields?.fit || ""
            });

            if (data.options) {
              setOptions(data.options);
            } else if (data.variants && data.variants.length > 0) {
              const loadedOptions = [];
              const opt1Name = data.variants[0].option1Name;
              if (opt1Name) {
                const vals = [...new Set(data.variants.map(v => v.option1Value))].filter(Boolean).join(', ');
                loadedOptions.push({ name: opt1Name, values: vals });
              }
              setOptions(loadedOptions);
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

  const handleImageKitSuccess = (url) => setImages((prev) => [...prev, url]);
  
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim() !== "") {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput(""); 
    }
  };

  const addOption = () => setOptions([...options, { name: '', values: '' }]);
  const removeOption = (index) => setOptions(options.filter((_, i) => i !== index));
  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
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
      // بنحفظ المصفوفة في categories (عشان المنيو) وفي collections (عشان توافق شوبيفاي)
      const finalProduct = {
        ...productData,
        categories: productData.selectedCollections || [], 
        collections: productData.selectedCollections || [], 
        images,
        chargeTax,
        inventoryTracked,
        physicalProduct,
        options,
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
      <div className="h-screen bg-[#121212] flex flex-col items-center justify-center text-[#F5C518] gap-4">
        <Loader2 className="animate-spin" size={50} />
        <h2 className="text-xl font-black tracking-widest animate-pulse">WIND ENGINE LOADING...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 text-right pb-20 font-sans" dir="rtl">
      
      {/* هيدر الصفحة - الأزرار والتحكم السريع */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-[#1a1a1a] p-6 rounded-3xl border border-[#333] sticky top-4 z-50 shadow-2xl backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-5">
          <div onClick={() => router.back()} className="p-3 bg-[#222] rounded-2xl cursor-pointer hover:bg-[#F5C518] hover:text-black text-gray-400 transition-all duration-300">
            <ArrowRight size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Box className="text-[#F5C518]" /> {isEditing ? "تعديل المنتج" : "إضافة منتج جديد"}
            </h1>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">WIND Management System v2.0</span>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={handleSaveProduct} 
            disabled={isSaving}
            className="flex-1 md:flex-none justify-center bg-[#F5C518] text-black px-12 py-4 rounded-2xl font-black hover:bg-white transition-all duration-300 flex items-center gap-3 shadow-[0_10px_30px_rgba(245,197,24,0.2)] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />} 
            {isEditing ? "حفظ التعديلات" : "نشر الآن"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* العمود الأيمن (المحتوى والبيانات - 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* صندوق العنوان والوصف */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#333] p-8 shadow-sm hover:border-gray-700 transition-all duration-500">
            <div className="mb-8">
              <label className="block text-sm font-black text-gray-400 mb-4 flex items-center gap-2">
                <Tag size={18} className="text-[#F5C518]"/> العنوان (Product Title)
              </label>
              <input 
                type="text" 
                name="title"
                value={productData.title}
                onChange={handleProductChange}
                placeholder="مثال: Sweatshirt Oversized Cotton" 
                className="w-full bg-[#121212] border border-[#333] p-5 rounded-2xl text-white focus:border-[#F5C518] outline-none transition-all font-bold text-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-400 mb-4 flex items-center gap-2">
                <Layout size={18} className="text-[#F5C518]"/> الوصف (Description)
              </label>
              <div className="rounded-2xl border border-[#333] overflow-hidden focus-within:border-[#F5C518] transition-all">
                 <div className="bg-[#222] p-3 flex gap-4 border-b border-[#333]">
                    <span className="text-gray-500 text-xs font-bold cursor-help hover:text-white">B</span>
                    <span className="text-gray-500 text-xs font-bold cursor-help hover:text-white italic">I</span>
                    <span className="text-gray-500 text-xs font-bold cursor-help hover:text-white underline">U</span>
                    <div className="w-[1px] h-4 bg-[#333]"></div>
                    <span className="text-gray-500 text-[10px] font-bold">WIND Rich Editor Mode</span>
                 </div>
                 <textarea 
                  name="description"
                  value={productData.description}
                  onChange={handleProductChange}
                  rows="10" 
                  className="w-full bg-[#121212] p-5 text-white outline-none resize-none leading-relaxed text-sm"
                  placeholder="اكتب تفاصيل المنتج بوضوح..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* صندوق الوسائط والصور */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#333] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-black text-gray-400 flex items-center gap-2">
                 <ImageIcon size={20} className="text-[#F5C518]"/> معرض الصور (Media)
               </h3>
               <span className="text-[10px] text-gray-600">Max 5MB per image</span>
            </div>
            
            <div className="border-4 border-dashed border-[#121212] rounded-3xl p-10 text-center bg-[#151515] hover:border-[#F5C518] transition-all duration-500 group relative">
              <ImageUploader onUploadSuccess={handleImageKitSuccess} />
              <p className="text-xs text-gray-500 mt-4 font-bold group-hover:text-gray-300 transition-colors">Drag and drop images or click to upload</p>
              
              <div className="mt-8 pt-8 border-t border-[#333] flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
                <input 
                  type="url" 
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="أو أضف رابط صورة مباشر (URL)..." 
                  className="flex-1 bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-xs text-white outline-none focus:border-[#F5C518] transition-all"
                />
                <button 
                  onClick={handleAddImageUrl} 
                  type="button" 
                  className="bg-[#222] text-[#F5C518] px-8 py-4 rounded-2xl text-xs font-black hover:bg-[#F5C518] hover:text-black transition-all"
                >إدراج رابط</button>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10">
                {images.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-[#333] group shadow-lg">
                    <img src={src} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125" alt="product"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => removeImage(i)} 
                        className="bg-red-600/90 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-red-500 transition-all active:scale-90"
                      >حذف الصورة</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* صندوق التصنيف (Shopify Category Sync) */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#333] p-8 shadow-sm">
            <label className="block text-sm font-black text-gray-400 mb-4 flex items-center gap-2">
               <Database size={18} className="text-[#F5C518]"/> التصنيف الأساسي (Shopify Matching)
            </label>
            <input 
              type="text" 
              name="category"
              value={productData.category}
              onChange={handleProductChange}
              list="csv-collections"
              placeholder="اختر التصنيف المطابق للشيت..." 
              className="w-full bg-[#121212] border border-[#333] p-5 rounded-2xl text-white outline-none focus:border-[#F5C518] transition-all font-bold" 
            />
            <p className="text-[10px] text-gray-600 mt-3">* هذا الحقل يستخدم للمطابقة مع شيت Shopify فقط، وللربط بالمنيو استخدم القائمة الجانبية.</p>
          </div>
          {/* 4. التسعير (Pricing) */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#333] p-8 shadow-sm">
            <h3 className="text-sm font-black text-gray-400 mb-6 flex items-center gap-2">
              <Tag size={18} className="text-[#F5C518]"/> التسعير (Pricing)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 font-bold">E£</span>
                  <input 
                    type="number" 
                    name="price"
                    value={productData.price}
                    onChange={handleProductChange}
                    placeholder="0.00" 
                    className="w-full bg-[#121212] border border-[#333] p-4 pl-12 rounded-2xl text-white outline-none focus:border-[#F5C518] transition-all font-bold" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Compare at price</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 font-bold">E£</span>
                  <input 
                    type="number" 
                    name="compareAtPrice"
                    value={productData.compareAtPrice}
                    onChange={handleProductChange}
                    placeholder="0.00" 
                    className="w-full bg-[#121212] border border-[#333] p-4 pl-12 rounded-2xl text-gray-400 outline-none focus:border-[#F5C518] transition-all font-bold" 
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-[#333] mt-8 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Cost per item</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 font-bold">E£</span>
                  <input 
                    type="number" 
                    name="costPerItem"
                    value={productData.costPerItem}
                    onChange={handleProductChange}
                    placeholder="0.00" 
                    className="w-full bg-[#121212] border border-[#333] p-4 pl-12 rounded-2xl text-white outline-none focus:border-[#F5C518] transition-all font-bold" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 justify-center md:col-span-2 bg-[#121212] p-4 rounded-2xl border border-[#333]">
                <span className="text-sm font-black text-gray-300">Charge tax on this product</span>
                <button onClick={() => setChargeTax(!chargeTax)} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${chargeTax ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 ${chargeTax ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* 5. المخزون (Inventory) */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#333] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-gray-400 flex items-center gap-2">
                <Settings size={18} className="text-[#F5C518]"/> المخزون (Inventory)
              </h3>
              <div className="flex items-center gap-3 bg-[#121212] px-4 py-2 rounded-xl border border-[#333]">
                <span className="text-[10px] font-black text-gray-500 uppercase">Track Inventory</span>
                <button onClick={() => setInventoryTracked(!inventoryTracked)} className={`w-10 h-5 rounded-full relative transition-all duration-300 ${inventoryTracked ? 'bg-[#F5C518]' : 'bg-gray-700'}`}>
                  <div className={`w-3.5 h-3.5 bg-black rounded-full absolute top-[3px] transition-all duration-300 ${inventoryTracked ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
            
            <div className="bg-[#121212] border border-[#333] rounded-3xl p-6 mb-8">
              <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-4">
                <span className="text-sm font-black text-white uppercase tracking-tighter">Location: Obour City</span>
                <span className="text-[10px] text-[#F5C518] font-black cursor-pointer hover:underline uppercase">Edit Location</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Available Quantity</span>
                <input 
                  type="number" 
                  name="quantity"
                  value={productData.quantity}
                  onChange={handleProductChange}
                  placeholder="0" 
                  className="w-32 bg-[#1a1a1a] border border-[#333] p-3 rounded-xl text-center text-white outline-none focus:border-[#F5C518] font-black" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">SKU (Stock Keeping Unit)</label>
                <input type="text" name="sku" value={productData.sku} onChange={handleProductChange} className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white outline-none focus:border-[#F5C518]" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">Barcode (ISBN, UPC, GTIN)</label>
                <input type="text" name="barcode" value={productData.barcode} onChange={handleProductChange} className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white outline-none focus:border-[#F5C518]" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">OutOfStock Policy</label>
                <select name="sellOutOfStock" value={productData.sellOutOfStock} onChange={handleProductChange} className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white outline-none focus:border-[#F5C518] font-bold">
                  <option value="No">Stop selling</option>
                  <option value="Yes">Continue selling</option>
                </select>
              </div>
            </div>
          </div>

          {/* 6. البدائل (Variants) */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#333] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-sm font-black text-gray-400 flex items-center gap-2"><ListFilter size={18} className="text-[#F5C518]"/> البدائل (Variants)</h3>
               <button onClick={addOption} className="bg-[#222] text-[#F5C518] px-4 py-2 rounded-xl text-xs font-black hover:bg-[#F5C518] hover:text-black transition-all">+ Add Option</button>
            </div>
            
            <div className="space-y-6">
              {options.map((option, index) => (
                <div key={index} className="bg-[#121212] border border-[#333] p-6 rounded-3xl relative group border-dashed">
                  <button onClick={() => removeOption(index)} className="absolute -top-3 -left-3 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl font-bold">×</button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 mb-2 uppercase">Option Name</label>
                      <input type="text" value={option.name} onChange={(e) => updateOption(index, 'name', e.target.value)} placeholder="Color or Size" list="csv-option-names" className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-white outline-none focus:border-[#F5C518] font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 mb-2 uppercase">Option Values (Separate with comma)</label>
                      <input type="text" value={option.values} onChange={(e) => updateOption(index, 'values', e.target.value)} placeholder="fuchsia, black, jeans-blue" className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl text-white outline-none focus:border-[#F5C518]" />
                    </div>
                  </div>
                </div>
              ))}
              {options.length === 0 && (
                <p className="text-center text-gray-600 text-xs py-4 border border-dashed border-[#333] rounded-3xl font-bold italic">No variants added. Product will be sold as a single unit.</p>
              )}
            </div>
          </div>

          {/* 7. الـ Metafields والبيانات المخصصة */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#333] p-8 shadow-sm">
            <h3 className="text-sm font-black text-gray-400 mb-8 border-b border-[#333] pb-4">بيانات WIND المخصصة (Metafields)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {Object.keys(metafields).map((key) => (
                 <div key={key}>
                    <label className="block text-[10px] font-black text-gray-600 mb-2 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                    <input 
                      type="text" 
                      name={key} 
                      value={metafields[key]} 
                      onChange={handleMetafieldChange} 
                      className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-sm text-[#F5C518] outline-none focus:border-white transition-all font-mono" 
                    />
                 </div>
               ))}
            </div>
          </div>

          {/* 8. محركات البحث (SEO) */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#333] p-8 shadow-sm border-dashed">
            <h3 className="text-sm font-black text-gray-400 mb-2 flex items-center gap-2"><Globe size={18} className="text-[#F5C518]"/> Search engine listing</h3>
            <p className="text-[10px] text-gray-600 mb-8">This is how your product will appear in search results</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase">Page title</label>
                <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} className="w-full bg-[#121212] border border-[#333] p-4 rounded-2xl text-white outline-none focus:border-[#F5C518] font-bold" />
                <p className="text-[9px] text-gray-600 mt-2">{seoTitle.length} of 70 characters</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase">Meta description</label>
                <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} maxLength={320} className="w-full bg-[#121212] border border-[#333] p-4 rounded-2xl text-white outline-none h-28 resize-none focus:border-[#F5C518]"></textarea>
                <p className="text-[9px] text-gray-600 mt-2">{seoDesc.length} of 320 characters</p>
              </div>
              <div className="bg-[#121212] p-5 rounded-2xl border border-[#333]">
                 <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">URL and handle</label>
                 <div className="flex items-center text-xs font-bold" dir="ltr">
                    <span className="text-gray-600">windeg.com/products/</span>
                    <input 
                      type="text" 
                      value={urlHandle} 
                      onChange={(e) => setUrlHandle(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
                      className="bg-transparent text-[#F5C518] outline-none border-b border-[#333] focus:border-[#F5C518] flex-1 ml-1" 
                    />
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* العمود الأيسر (الجانبي - 33%) */}
        <div className="space-y-8">
          {/* صندوق الحالة */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#333] p-8 shadow-sm">
            <label className="block text-[10px] font-black text-gray-500 mb-4 uppercase tracking-widest">Product Status</label>
            <select name="status" value={productData.status} onChange={handleProductChange} className="w-full bg-[#121212] border border-[#333] p-4 rounded-2xl text-white outline-none focus:border-[#F5C518] font-black">
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* 🔥 الربط الذهبي: قائمة الأقسام (Checkboxes) 🔥 */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#F5C518]/30 p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-[#F5C518] uppercase tracking-tighter">الأقسام والمنيو (Collections)</h3>
              <Info size={14} className="text-gray-600" />
            </div>
            
            <div className="bg-black/40 rounded-2xl p-4 border border-[#333] space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {availableCollections.length > 0 ? (
                availableCollections.map((col) => {
                  const isChecked = (productData.selectedCollections || []).includes(col.slug);
                  return (
                    <label key={col.id} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-all duration-300 group ${isChecked ? 'bg-[#F5C518] border-transparent shadow-lg' : 'bg-[#1a1a1a] border-[#333] hover:border-gray-600'}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleCollectionToggle(col.slug)} className="hidden" />
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all duration-300 ${isChecked ? 'bg-black border-black scale-110' : 'bg-transparent border-gray-700'}`}>
                        {isChecked && <CheckCircle2 size={14} className="text-[#F5C518]" />}
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className={`text-xs font-black transition-colors ${isChecked ? 'text-black' : 'text-gray-300 group-hover:text-white'}`}>{col.name}</span>
                        <span className={`text-[9px] font-bold ${isChecked ? 'text-black/60' : 'text-gray-600'}`} dir="ltr">{col.slug}</span>
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-[#333] rounded-2xl text-gray-700 text-[10px] font-black uppercase">جاري مزامنة الكولكشنز...</div>
              )}
            </div>
            <p className="mt-4 text-[9px] text-gray-500 font-bold leading-relaxed">* سيظهر المنتج تلقائياً في كل قسم تقوم باختياره، وسيرتبط بالمنيو فور الحفظ.</p>
          </div>

          {/* التنظيم (Organization) */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#333] p-8 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-[#333] pb-4">Organization</h3>
            <div>
              <label className="block text-[10px] font-black text-gray-600 mb-2 uppercase tracking-widest">Product Type</label>
              <input type="text" name="type" value={productData.type} onChange={handleProductChange} list="csv-types" placeholder="Sweatshirt, Jacket..." className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white outline-none focus:border-[#F5C518]" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 mb-2 uppercase tracking-widest">Vendor</label>
              <input type="text" name="vendor" value={productData.vendor} onChange={handleProductChange} className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white outline-none focus:border-[#F5C518]" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 mb-2 uppercase tracking-widest">Tags (Separate with comma)</label>
              <input type="text" name="tags" value={productData.tags} onChange={handleProductChange} placeholder="winter, new-collection" className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white outline-none focus:border-[#F5C518]" />
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
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #F5C518; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}

// التصدير النهائي المغلف بـ Suspense لضمان الاستقرار على Vercel
export default function CreateProductPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#121212] flex flex-col items-center justify-center text-[#F5C518] gap-6">
        <Loader2 className="animate-spin" size={60} />
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-black tracking-[0.3em] uppercase animate-pulse">WIND Engine</h2>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Initializing Smart Content Management System...</p>
        </div>
      </div>
    }>
      <CreateProductForm />
    </Suspense>
  );
}