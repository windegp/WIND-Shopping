const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// 1. تأكد أن ملف serviceAccountKey.json موجود بجانب هذا الملف
const serviceAccount = require('./serviceAccountKey.json'); 

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// مخازن مؤقتة لتجميع البيانات
const productsMap = {};
const collectionsMap = {};

console.log('⏳ جاري تحليل ملف منتجات WIND بدقة...');

// دالة مساعدة لتنظيف النصوص وتحويلها لـ Slugs
const createSlug = (text) => text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

fs.createReadStream('scripts/products_export_1.csv')
  .pipe(csv())
  .on('data', (row) => {
    const handle = row.Handle;
    if (!handle) return;

    // --- 1. استخلاص وإعداد القسم (Collection) ---
    // في شوبيفاي، الـ Type هو أقرب شيء للقسم
    const typeRaw = row.Type || 'General';
    const typeSlug = createSlug(typeRaw);
    
    // تجهيز بيانات القسم لإنشائه لاحقاً
    if (!collectionsMap[typeSlug]) {
        collectionsMap[typeSlug] = {
            name: typeRaw,
            slug: typeSlug,
            description: `تصفح أحدث منتجات ${typeRaw} من WIND`,
            image: row['Image Src'] || '', // نأخذ أول صورة كصورة للقسم
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            productCount: 0
        };
    }

    // --- 2. تجهيز أو تحديث بيانات المنتج ---
    if (!productsMap[handle]) {
        // --> إنشاء المنتج لأول مرة
        productsMap[handle] = {
            title: row.Title || '',
            description: row['Body (HTML)'] || '',
            // تحويل الأسعار لأرقام (مهم جداً للموقع)
            price: parseFloat(row['Variant Price']) || 0,
            compareAtPrice: parseFloat(row['Variant Compare At Price']) || 0,
            costPerItem: 0, 
            sku: row['Variant SKU'] || '',
            quantity: 0, // سنقوم بجمع الكميات لاحقاً
            
            // *** الربط بالأقسام (Categories) ***
            // نضع الـ slug الخاص بالقسم + slug وصل حديثاً
            categories: [typeSlug, 'new-arrivals'], 
            
            tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : [],
            
            // *** هيكلة الخيارات (مطابقة تماماً لـ CreateProductPage) ***
            options: {
                colors: [], // Array of Objects { name, swatch }
                sizes: [],  // Array of Strings
                sizeChart: [], 
                chartHeaders: { col1: 'المقاس', col2: 'الطول', col3: 'الصدر', col4: 'الوسط', col5: 'الوزن' }
            },
            
            // الصور
            images: row['Image Src'] ? [row['Image Src']] : [],
            mainImageUrl: row['Image Src'] || '', 
            
            // SEO
            seo: {
                title: row['SEO Title'] || row.Title || '',
                description: row['SEO Description'] || '',
                handle: handle,
                seoCategory: typeRaw
            },
            
            handle: handle,
            status: 'active', // مفتاح الظهور في الموقع
            featured: true,   // لضمان ظهوره في الرئيسية
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // زيادة عداد القسم
        collectionsMap[typeSlug].productCount += 1;

    } else {
        // --> المنتج موجود (سطر إضافي): نضيف الصور الإضافية فقط
        if (row['Image Src'] && !productsMap[handle].images.includes(row['Image Src'])) {
            productsMap[handle].images.push(row['Image Src']);
        }
    }

    // --- 3. معالجة المتغيرات (Colors & Sizes) في كل سطر ---
    const product = productsMap[handle];
    
    // جمع الكمية (Stock)
    const qty = parseInt(row['Variant Inventory Qty']) || 0;
    product.quantity += qty;

    // استخراج الخيارات (Option1, Option2, Option3)
    const optionsToCheck = [
        { name: row['Option1 Name'], value: row['Option1 Value'] },
        { name: row['Option2 Name'], value: row['Option2 Value'] },
        { name: row['Option3 Name'], value: row['Option3 Value'] }
    ];

    optionsToCheck.forEach(opt => {
        if (opt.name && opt.value) {
            const val = opt.value.trim();
            const nameLower = opt.name.toLowerCase();

            // منطق الألوان (مطابق لـ CreateProductPage colorVariants)
            if (nameLower.includes('color') || nameLower.includes('colour') || nameLower.includes('لون')) {
                // التأكد من عدم تكرار اللون
                if (!product.options.colors.find(c => c.name === val)) {
                    product.options.colors.push({ 
                        name: val, 
                        swatch: '', // يمكن وضع رابط صورة مصغرة هنا لو متاح
                        preview: '',
                        swatchUrl: ''
                    });
                }
            } 
            // منطق المقاسات (مطابق لـ CreateProductPage sizes array)
            else if (nameLower.includes('size') || nameLower.includes('مقاس')) {
                if (!product.options.sizes.includes(val)) {
                    product.options.sizes.push(val);
                }
            }
        }
    });
  })
  .on('end', async () => {
    console.log('✅ تم تحليل البيانات بنجاح. جاري الرفع لـ Firebase...');
    
    const batch = db.batch();
    
    // --- 1. رفع الأقسام (Collections) ---
    // إضافة قسم "وصل حديثاً" يدوياً
    collectionsMap['new-arrivals'] = {
        name: 'وصل حديثاً',
        slug: 'new-arrivals',
        description: 'أحدث منتجات WIND',
        image: '',
        createdAt: new Date(),
        productCount: Object.keys(productsMap).length
    };

    let opCount = 0;

    for (const slug in collectionsMap) {
        const colRef = db.collection('collections').doc(slug);
        batch.set(colRef, collectionsMap[slug], { merge: true });
        opCount++;
    }

    // --- 2. رفع المنتجات (Products) ---
    for (const handle in productsMap) {
        const productData = productsMap[handle];
        
        // تحسين: نسخ المقاسات للحقل الجذري أيضاً للتوافق مع الفلاتر القديمة
        if (productData.options.sizes.length > 0) {
            productData.sizes = productData.options.sizes; 
        }

        const docRef = db.collection('products').doc(handle);
        batch.set(docRef, productData, { merge: true }); // Merge يحافظ على البيانات لو موجودة
        opCount++;
    }

    try {
        await batch.commit();
        console.log(`🚀 تمت العملية بنجاح ساحق!`);
        console.log(`- تم تحديث/إنشاء ${Object.keys(collectionsMap).length} قسم.`);
        console.log(`- تم رفع ${Object.keys(productsMap).length} منتج بكامل تفاصيلها.`);
        console.log(`⚠️ هام: توجه الآن للموقع واعمل Refresh. المنتجات ستظهر في "وصل حديثاً" وفي صفحة المنتجات.`);
    } catch (err) {
        console.error('❌ حدث خطأ أثناء الرفع:', err);
    }
    process.exit();
  });