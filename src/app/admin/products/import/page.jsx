"use client";
import { useState } from 'react';
import Papa from 'papaparse';
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function ImportShopifyCSV() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const processAndUpload = () => {
    if (!file) return alert("اختر ملف الـ CSV أولاً!");
    setLoading(true);
    addLog("جاري قراءة الملف...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        addLog(`تم العثور على ${rows.length} سطر في الملف.`);
        
        // تجميع السطور في منتجات (لأن شوبيفاي بيحط كل صورة وكل لون في سطر لوحده لنفس المنتج)
        const productsMap = {};

        rows.forEach(row => {
          const handle = row['Handle'];
          if (!handle) return;

          // لو المنتج مش موجود في الخريطة، ننشئه
          if (!productsMap[handle]) {
            productsMap[handle] = {
              title: row['Title'] || "",
              description: row['Body (HTML)'] || "",
              vendor: row['Vendor'] || "WIND",
              type: row['Type'] || "",
              tags: row['Tags'] || "",
              collections: row['Product Category'] || "",
              category: row['Product Category'] || "", // للتوافق
              status: row['Published'] === 'TRUE' || row['Published'] === 'true' ? 'Active' : 'Draft',
              price: row['Variant Price'] || "0",
              compareAtPrice: row['Variant Compare At Price'] || "",
              images: [],
              variants: [],
              seo: {
                handle: handle,
                title: row['SEO Title'] || "",
                description: row['SEO Description'] || ""
              },
              metafields: {
                isdalBundle: row['isdal bundle list (product.metafields.custom.isdal_bundle_list)'] || "",
                sizeChart: row['Product Size Chart (product.metafields.custom.product_size_chart)'] || "",
                suggested: row['Suggested Products (product.metafields.custom.suggested_products)'] || "",
                youMayAlsoLike: row['You May Also Like (product.metafields.custom.you_may_also_like)'] || "",
                fabric: row['Fabric (shopify.fabric)'] || "",
                fit: row['Fit (shopify.fit)'] || ""
              },
              createdAt: serverTimestamp()
            };
          }

          // تجميع الصور (بدون تكرار)
          if (row['Image Src'] && !productsMap[handle].images.includes(row['Image Src'])) {
            productsMap[handle].images.push(row['Image Src']);
          }

          // تجميع البدائل (Variants) زي اللون والمقاس والسعر لكل بديل
          if (row['Option1 Value'] || row['Variant SKU']) {
            productsMap[handle].variants.push({
              option1Name: row['Option1 Name'] || "",
              option1Value: row['Option1 Value'] || "",
              option2Name: row['Option2 Name'] || "",
              option2Value: row['Option2 Value'] || "",
              price: row['Variant Price'] || "",
              compareAtPrice: row['Variant Compare At Price'] || "",
              sku: row['Variant SKU'] || "",
              quantity: parseInt(row['Variant Inventory Qty']) || 0,
            });
          }
        });

        const productsArray = Object.values(productsMap);
        addLog(`تم تجميعهم في ${productsArray.length} منتج فريد.`);
        addLog("بدأ الرفع إلى Firebase...");

        // رفع المنتجات لفايربيس
        let successCount = 0;
        let errorCount = 0;

        for (const product of productsArray) {
          try {
            // هنستخدم الـ handle كـ ID للمنتج في فايربيس عشان يبقى الرابط جميل (windeg.com/product/isdal-red)
            const productRef = doc(collection(db, "products"), product.seo.handle);
            await setDoc(productRef, product);
            successCount++;
            if (successCount % 5 === 0) addLog(`تم رفع ${successCount} منتجات...`);
          } catch (error) {
            console.error(error);
            errorCount++;
          }
        }

        addLog(`✅ اكتملت العملية! نجح: ${successCount}، فشل: ${errorCount}`);
        setLoading(false);
      },
      error: (error) => {
        addLog(`❌ خطأ في قراءة الملف: ${error.message}`);
        setLoading(false);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-white mb-6 border-r-4 border-[#F5C518] pr-3">
        استيراد المنتجات من Shopify (CSV)
      </h1>
      
      <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-xl shadow-lg">
        <p className="text-gray-400 mb-6 text-sm">
          ارفع ملف الـ CSV الخاص بـ Shopify هنا. سيقوم النظام أوتوماتيكياً بدمج الصور والبدائل (الألوان/المقاسات) ورفعها مباشرة إلى Firebase لتتوافق مع تصميمك الجديد.
        </p>

        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-[#F5C518] file:text-black
            hover:file:bg-yellow-500 cursor-pointer mb-6 bg-[#121212] p-2 rounded-lg border border-[#333]"
        />

        <button 
          onClick={processAndUpload}
          disabled={loading || !file}
          className={`w-full py-3 rounded-lg font-bold transition ${loading || !file ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-[#F5C518] text-black hover:bg-yellow-500'}`}
        >
          {loading ? 'جاري المعالجة والرفع...' : 'ابدأ استيراد المنتجات'}
        </button>
      </div>

      {/* شاشة مراقبة العملية (Log) */}
      {log.length > 0 && (
        <div className="mt-8 bg-black border border-[#333] rounded-lg p-4 font-mono text-xs text-left text-green-400" dir="ltr">
          <h3 className="text-white mb-2 border-b border-[#333] pb-2">عمليات النظام (Logs):</h3>
          <div className="h-48 overflow-y-auto space-y-1">
            {log.map((msg, i) => <div key={i}>{'>'} {msg}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}