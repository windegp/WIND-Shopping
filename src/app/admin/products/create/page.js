"use client";
import { useState } from 'react';
// تأكد من مسار الفولدر (Admin) كابيتال أو سمول حسب اللي شغال معاك
import ImageUploader from "@/components/ImageUploader";

export default function CreateProductPage() {
  // ==========================================
  // --- إضافات شيت شوبيفاي (للاقتراحات الذكية) ---
  // ==========================================
  const csvColors = ['fuchsia', 'jeans-blue', 'beige', 'clear', 'green', 'black', 'burgundy', 'rose', 'patterned', 'navy', 'blue', 'red', 'brown', 'pink', 'gray', 'olive', 'chocolate', 'yellow', 'purple', 'orange', 'mint', 'terracotta', 'coral-pink', 'turquoise', 'gold', 'bronze', 'silver', 'off-white'];
  const csvSizes = ['One Size', '50-80-kg', '55-90-kg', '50-90-kg', '55-95-kg', '85-kg'];
  const csvTypes = ['pullover', 'isdal', 'cardigan', 'set', 'dress', 'top'];

  // ==========================================
  // 1. إدارة حالة البيانات (States)
  // ==========================================
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [chargeTax, setChargeTax] = useState(false);
  
  // حالات المرحلة الثانية (الجديدة)
  const [inventoryTracked, setInventoryTracked] = useState(true);
  const [physicalProduct, setPhysicalProduct] = useState(true);
  const [options, setOptions] = useState([]); // للـ Variants (المقاس والألوان)
  
  // حالات الـ SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [urlHandle, setUrlHandle] = useState("");

  // ==========================================
  // 2. دوال التحكم (Functions)
  // ==========================================
  const handleImageKitSuccess = (url) => setImages((prev) => [...prev, url]);
  
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim() !== "") {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput(""); 
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // دوال الـ Variants
  const addOption = () => {
    setOptions([...options, { name: '', values: '' }]);
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  // ==========================================
  // 3. واجهة المستخدم (نسخة شوبيفاي المكتملة)
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 text-right pb-20" dir="rtl">
      
      {/* عنوان الصفحة */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-gray-500">{"<"}</span> إضافة منتج
        </h1>
        <button className="bg-[#F5C518] text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition">
          حفظ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ========================================== */}
        {/* العمود الأيمن (الرئيسي - 66%) */}
        {/* ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. العنوان والوصف */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">العنوان (Title)</label>
              <input type="text" placeholder="Short sleeve t-shirt" className="w-full bg-[#121212] border border-[#333] p-2.5 rounded-lg text-white focus:border-[#F5C518] outline-none transition" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">الوصف (Description)</label>
              <div className="border border-[#333] rounded-lg overflow-hidden">
                <div className="bg-[#222] border-b border-[#333] p-2 flex gap-3 text-gray-400 text-sm items-center">
                  <span className="cursor-pointer hover:text-white">✨</span>
                  <span className="cursor-pointer hover:text-white">Paragraph ▾</span>
                  <span className="cursor-pointer font-bold hover:text-white">B</span>
                  <span className="cursor-pointer italic hover:text-white">I</span>
                  <span className="cursor-pointer underline hover:text-white">U</span>
                  <span className="cursor-pointer hover:text-white">🔗</span>
                  <span className="cursor-pointer hover:text-white">📷</span>
                </div>
                <textarea rows="6" className="w-full bg-[#121212] p-3 text-white outline-none resize-none"></textarea>
              </div>
            </div>
          </div>

          {/* 2. الوسائط (Media) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <h3 className="text-sm text-gray-300 mb-3">الوسائط (Media)</h3>
            <div className="border-2 border-dashed border-[#444] rounded-lg p-6 text-center bg-[#121212]">
              <ImageUploader onUploadSuccess={handleImageKitSuccess} />
              <p className="text-xs text-gray-500 mt-3">Accepts images, videos, or 3D models</p>
              <div className="mt-6 border-t border-[#333] pt-4 flex gap-2 max-w-sm mx-auto">
                <input 
                  type="url" 
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="أو أضف رابط صورة مباشر (URL)" 
                  className="flex-1 bg-[#1a1a1a] border border-[#333] p-2 rounded text-xs text-white outline-none focus:border-[#F5C518]"
                />
                <button onClick={handleAddImageUrl} type="button" className="bg-[#333] text-white px-3 py-2 rounded text-xs font-bold hover:bg-[#444] transition">إضافة</button>
              </div>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {images.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#333] group">
                    <img src={src} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. التصنيف (Category) - تم إضافة الأقسام من الشيت */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <label className="block text-sm text-gray-300 mb-2">التصنيف (Category)</label>
            <select className="w-full bg-[#121212] border border-[#333] p-2.5 rounded-lg text-white outline-none">
              <option>Choose a product category</option>
              <option>Apparel & Accessories</option>
              <option>Apparel & Accessories {'>'} Clothing</option>
              <option>Apparel & Accessories {'>'} Clothing {'>'} Traditional & Ceremonial Clothing</option>
            </select>
          </div>

          {/* 4. السعر (Price) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <h3 className="text-sm text-gray-300 mb-4">السعر (Price)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Price</label>
                <div className="relative"><span className="absolute left-3 top-2 text-gray-500">E£</span><input type="number" placeholder="0.00" className="w-full bg-[#121212] border border-[#333] p-2 pl-8 rounded text-white outline-none" /></div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Compare at price</label>
                <div className="relative"><span className="absolute left-3 top-2 text-gray-500">E£</span><input type="number" placeholder="0.00" className="w-full bg-[#121212] border border-[#333] p-2 pl-8 rounded text-white outline-none" /></div>
              </div>
            </div>
            <div className="border-t border-[#333] mt-5 pt-5 grid grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cost per item</label>
                <div className="relative"><span className="absolute left-3 top-2 text-gray-500">E£</span><input type="number" placeholder="0.00" className="w-full bg-[#121212] border border-[#333] p-2 pl-8 rounded text-white outline-none" /></div>
              </div>
              <div className="flex items-center gap-2 mt-4 justify-center">
                <span className="text-sm text-gray-300">Charge tax</span>
                <button onClick={() => setChargeTax(!chargeTax)} className={`w-12 h-6 rounded-full relative transition-colors ${chargeTax ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${chargeTax ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* 5. المخزون (Inventory) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-gray-300 font-bold">المخزون (Inventory)</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Inventory tracked</span>
                <button onClick={() => setInventoryTracked(!inventoryTracked)} className={`w-10 h-5 rounded-full relative transition-colors ${inventoryTracked ? 'bg-[#F5C518]' : 'bg-gray-600'}`}>
                  <div className={`w-3.5 h-3.5 bg-black rounded-full absolute top-[3px] transition-all ${inventoryTracked ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
            
            <div className="border border-[#333] rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white">Quantity</span>
                <span className="text-xs text-[#F5C518] cursor-pointer">Edit</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#333] pt-3 mt-2">
                <span className="text-sm text-gray-300">Obour City</span>
                <input type="number" placeholder="0" className="w-24 bg-[#121212] border border-[#333] p-1.5 rounded text-center text-white outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs text-gray-400 mb-1">SKU</label><input type="text" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Barcode</label><input type="text" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white" /></div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Sell when out of stock</label>
                <select className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none"><option>No</option><option>Yes</option></select>
              </div>
            </div>
          </div>

          {/* 6. الشحن (Shipping) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-gray-300 font-bold">الشحن (Shipping)</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Physical product</span>
                <button onClick={() => setPhysicalProduct(!physicalProduct)} className={`w-10 h-5 rounded-full relative transition-colors ${physicalProduct ? 'bg-[#F5C518]' : 'bg-gray-600'}`}>
                  <div className={`w-3.5 h-3.5 bg-black rounded-full absolute top-[3px] transition-all ${physicalProduct ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
            {physicalProduct && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Product weight</label>
                  <div className="flex">
                    <input type="number" placeholder="0.0" className="flex-1 bg-[#121212] border border-[#333] border-l-0 rounded-r rounded-l-none p-2 text-white outline-none" />
                    <select className="bg-[#222] border border-[#333] text-white p-2 rounded-l outline-none"><option>kg</option><option>g</option></select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Country of origin</label>
                  <select className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none"><option>Egypt</option></select>
                </div>
              </div>
            )}
          </div>

          {/* 7. البدائل (Variants) - تم إضافة الاقتراحات من الشيت */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <h3 className="text-sm text-gray-300 font-bold mb-4">البدائل (Variants)</h3>
            
            {options.map((option, index) => (
              <div key={index} className="bg-[#121212] border border-[#333] p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-[#F5C518] font-bold">خيار {index + 1}</span>
                  <button onClick={() => removeOption(index)} className="text-red-500 text-xs hover:underline">حذف الخيار</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">اسم الخيار (مثال: المقاس، اللون)</label>
                    <input 
                      type="text" 
                      value={option.name} 
                      onChange={(e) => updateOption(index, 'name', e.target.value)} 
                      placeholder="Color أو Size" 
                      list="csv-option-names"
                      className="w-full bg-[#1a1a1a] border border-[#333] p-2 rounded text-white outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">القيم (افصل بينها بفاصلة)</label>
                    <input 
                      type="text" 
                      value={option.values} 
                      onChange={(e) => updateOption(index, 'values', e.target.value)} 
                      placeholder="S, M, L / fuchsia, black" 
                      list={option.name.toLowerCase().includes('color') ? 'csv-colors' : option.name.toLowerCase().includes('size') ? 'csv-sizes' : undefined}
                      className="w-full bg-[#1a1a1a] border border-[#333] p-2 rounded text-white outline-none" 
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addOption} className="text-[#F5C518] text-sm font-bold flex items-center gap-1 hover:text-yellow-400 transition">
              <span>+</span> Add options like size or color
            </button>
          </div>

          {/* 8. الحقول الإضافية (Metafields) - تم إضافة Fabric و Fit */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm space-y-4">
            <h3 className="text-sm text-gray-300 font-bold border-b border-[#333] pb-2 mb-4">الحقول المخصصة (Metafields)</h3>
            
            {[{label: "You May Also Like", name: "youMayAlsoLike"}, 
              {label: "isdal bundle-list", name: "isdalBundle"}, 
              {label: "Product Size-Chart", name: "sizeChart"}, 
              {label: "Product Colors Bundle", name: "colorsBundle"}, 
              {label: "Suggested Products", name: "suggested"},
              {label: "Fabric (الخامة)", name: "fabric"},
              {label: "Fit (القصة)", name: "fit"}].map((field, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-xs text-gray-400 w-1/3">{field.label}</label>
                <input type="text" className="flex-1 bg-[#121212] border border-[#333] p-2 rounded text-white outline-none" />
              </div>
            ))}
          </div>

          {/* 9. محركات البحث (Search engine listing) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <h3 className="text-sm text-gray-300 font-bold mb-1">Search engine listing</h3>
            <p className="text-xs text-gray-500 mb-4">Add a title and description to see how this product might appear in a search engine listing</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Page title</label>
                <input 
                  type="text" 
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  maxLength={70}
                  className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none focus:border-[#F5C518]" 
                />
                <p className="text-[10px] text-gray-500 mt-1">{seoTitle.length} of 70 characters used</p>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Meta description</label>
                <textarea 
                  rows="3" 
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  maxLength={320}
                  className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none resize-none focus:border-[#F5C518]" 
                ></textarea>
                <p className="text-[10px] text-gray-500 mt-1">{seoDesc.length} of 320 characters used</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">URL handle</label>
                <div className="flex">
                  <span className="bg-[#222] border border-[#333] border-l-0 text-gray-500 p-2 rounded-r text-xs flex items-center" dir="ltr">https://windeg.com/products/</span>
                  <input 
                    type="text" 
                    value={urlHandle}
                    onChange={(e) => setUrlHandle(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="flex-1 bg-[#121212] border border-[#333] border-r-0 rounded-l p-2 text-white outline-none text-xs" 
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================== */}
        {/* العمود الأيسر (الجانبي - 33%) */}
        {/* ========================================== */}
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <label className="block text-sm text-gray-300 mb-2">الحالة (Status)</label>
            <select className="w-full bg-[#121212] border border-[#333] p-2.5 rounded-lg text-white outline-none">
              <option>Active</option>
              <option>Draft</option>
            </select>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4"><h3 className="text-sm text-gray-300">النشر (Publishing)</h3><span className="text-gray-500 cursor-pointer">⋮</span></div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#222] text-xs text-gray-300 px-3 py-1.5 rounded-full flex items-center gap-1">Online Store 🟢</span>
              <span className="bg-[#222] text-xs text-gray-300 px-3 py-1.5 rounded-full">Point of Sale</span>
              <span className="bg-[#222] text-xs text-gray-300 px-3 py-1.5 rounded-full">Facebook & Instagram</span>
              <span className="bg-[#222] text-xs text-gray-300 px-3 py-1.5 rounded-full">Google & YouTube</span>
              <span className="bg-[#222] text-xs text-gray-300 px-3 py-1.5 rounded-full">TikTok</span>
            </div>
          </div>

          {/* التنظيم (Product organization) - تم تفعيل مقترحات الشيت للـ Type */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm space-y-4">
            <h3 className="text-sm text-gray-300">تنظيم المنتج (Product organization)</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <input type="text" list="csv-types" placeholder="e.g. pullover" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Vendor</label>
              <input type="text" defaultValue="WIND" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Collections</label>
              <div className="relative">
                <span className="absolute left-2 top-2.5 text-gray-500 text-xs">🔍</span>
                <input type="text" className="w-full bg-[#121212] border border-[#333] p-2 pl-7 rounded text-white outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tags</label>
              <input type="text" placeholder="winter, new, casual" className="w-full bg-[#121212] border border-[#333] p-2 rounded text-white outline-none" />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm">
            <label className="block text-sm text-gray-300 mb-2">Theme template</label>
            <select className="w-full bg-[#121212] border border-[#333] p-2.5 rounded-lg text-white outline-none"><option>Default product</option></select>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* قوائم الاقتراحات المخفية (تستمد البيانات من الشيت) */}
      {/* ========================================== */}
      <datalist id="csv-colors">
        {csvColors.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="csv-sizes">
        {csvSizes.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="csv-option-names">
        <option value="Color" />
        <option value="Size" />
      </datalist>
      <datalist id="csv-types">
        {csvTypes.map(t => <option key={t} value={t} />)}
      </datalist>

    </div>
  );
}