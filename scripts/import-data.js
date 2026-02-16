const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// 1. إعداد الاتصال (تأكد من وجود الملف في نفس الفولدر)
const serviceAccount = require('./serviceAccountKey.json'); 

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// لتخزين البيانات المجمعة
const productsMap = {};
const collectionsMap = {};

console.log('⏳ جاري تحليل ملف منتجات WIND...');

fs.createReadStream('scripts/products_export_1.csv')
  .pipe(csv())
  .on('data', (row) => {
    const handle = row.Handle;
    if (!handle) return;

    // --- 1. استخلاص القسم (Collection) ---
    // نعتمد على Type كاسم للقسم الرئيسي
    const type = row.Type || 'General';
    const typeSlug = type.trim().toLowerCase().replace(/\s+/g, '-');
    
    // تجهيز بيانات القسم لإنشائه لاحقاً
    if (!collectionsMap[typeSlug]) {
        collectionsMap[typeSlug] = {
            name: type,
            slug: typeSlug,
            description: `تصفح أحدث منتجات ${type} من WIND`,
            image: row['Image Src'] || '', // نأخذ أول صورة كصورة للقسم
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            productCount: 0
        };
    }

    // --- 2. تجميع بيانات المنتج ---
    if (!productsMap[handle]) {
        // إنشاء المنتج لأول مرة
        productsMap[handle] = {
            title: row.Title || '',
            description: row['Body (HTML)'] || '',
            price: parseFloat(row['Variant Price']) || 0,
            compareAtPrice: parseFloat(row['Variant Compare At Price']) || 0,
            costPerItem: 0, // غير موجود في CSV العادي عادةً
            sku: row['Variant SKU'] || '',
            quantity: 0, // سنقوم بجمع الكميات لكل المتغيرات
            
            // الربط بالأقسام (القسم الأصلي + وصل حديثاً)
            categories: [
                typeSlug,
                'new-arrivals' 
            ],
            
            tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : [],
            
            // هيكلة الخيارات كما في CreateProductPage
            options: {
                colors: [], // ستمتلئ لاحقاً
                sizes: [],  // ستمتلئ لاحقاً
                sizeChart: [], 
                chartHeaders: { col1: 'المقاس', col2: 'الطول', col3: 'الصدر', col4: 'الوسط', col5: 'الوزن' }
            },
            
            // الصور
            images: row['Image Src'] ? [row['Image Src']] : [],
            mainImageUrl: row['Image Src'] || '', // للعرض في القوائم
            
            // SEO
            seo: {
                title: row['SEO Title'] || row.Title || '',
                description: row['SEO Description'] || '',
                handle: handle,
                seoCategory: type
            },
            
            handle: handle,
            status: 'active', // ليظهر في الموقع
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // زيادة عداد القسم
        collectionsMap[typeSlug].productCount += 1;

    } else {
        // المنتج موجود: نضيف الصور الإضافية
        if (row['Image Src'] && !productsMap[handle].images.includes(row['Image Src'])) {
            productsMap[handle].images.push(row['Image Src']);
        }
    }

    // --- 3. معالجة المتغيرات (Colors & Sizes) والكمية ---
    const product = productsMap[handle];
    
    // جمع الكمية (Stock)
    const qty = parseInt(row['Variant Inventory Qty']) || 0;
    product.quantity += qty;

    // استخراج الخيارات (Option1, Option2, Option3)
    // نتحقق من اسم الخيار (Name) لنعرف هل هو لون أم مقاس
    const options = [
        { name: row['Option1 Name'], value: row['Option1 Value'] },
        { name: row['Option2 Name'], value: row['Option2 Value'] },
        { name: row['Option3 Name'], value: row['Option3 Value'] }
    ];

    options.forEach(opt => {
        if (opt.name && opt.value) {
            const val = opt.value.trim();
            const nameLower = opt.name.toLowerCase();

            // هل هو لون؟
            if (nameLower.includes('color') || nameLower.includes('colour') || nameLower.includes('لون')) {
                // التأكد من عدم التكرار
                if (!product.options.colors.find(c => c.name === val)) {
                    product.options.colors.push({ 
                        name: val, 
                        swatch: '', // يمكن وضع رابط صورة هنا لو متاح
                        preview: '' 
                    });
                }
            } 
            // هل هو مقاس؟
            else if (nameLower.includes('size') || nameLower.includes('مقاس')) {
                if (!product.options.sizes.includes(val)) {
                    product.options.sizes.push(val);
                }
            }
        }
    });
  })
  .on('end', async () => {
    console.log('✅ تم تحليل البيانات. جاري الرفع لقاعدة بيانات WIND...');
    
    const batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 450; // حد أقصى لفايربيز

    // دالة مساعدة لحفظ الـ Batch
    const commitBatch = async () => {
        if (batchCount > 0) {
            await batch.commit();
            console.log(`📦 تم رفع حزمة (${batchCount} عملية)...`);
            batchCount = 0;
            // إعادة إنشاء batch جديد يتطلب إعادة تعيين المتغير في Scope أوسع، 
            // لكن للتبسيط في السكربتات الصغيرة سنفترض أن العدد لا يتجاوز الحدود الضخمة
            // أو نستخدم batch واحد لو العدد قليل.
            // *للمشاريع الكبيرة جداً يجب تقسيم الـ batch loop*
        }
    };

    // 1. رفع الأقسام (Collections)
    for (const slug in collectionsMap) {
        const colRef = db.collection('collections').doc(slug);
        batch.set(colRef, collectionsMap[slug], { merge: true });
        batchCount++;
    }

    // إضافة قسم "وصل حديثاً" يدوياً لضمان وجوده
    const newArrivalsRef = db.collection('collections').doc('new-arrivals');
    batch.set(newArrivalsRef, {
        name: 'وصل حديثاً',
        slug: 'new-arrivals',
        description: 'أحدث صيحات الموضة من WIND',
        productCount: Object.keys(productsMap).length,
        updatedAt: new Date()
    }, { merge: true });
    batchCount++;

    // 2. رفع المنتجات (Products)
    for (const handle in productsMap) {
        const productData = productsMap[handle];
        
        // تحسين بسيط: لو مفيش مقاسات في Options، ننسخها من حقل sizes الجذري والعكس
        if (productData.options.sizes.length > 0) {
            productData.sizes = productData.options.sizes; // للتوافق مع الحقل الجذري
        }

        const docRef = db.collection('products').doc(handle);
        batch.set(docRef, productData, { merge: true });
        batchCount++;
    }

    try {
        await batch.commit(); // رفع كل شيء دفعة واحدة
        console.log(`🚀 تمت العملية بنجاح!`);
        console.log(`- تم رفع ${Object.keys(productsMap).length} منتج.`);
        console.log(`- تم رفع ${Object.keys(collectionsMap).length + 1} قسم.`);
        console.log(`⚠️ ملحوظة: الصور ستظهر بروابط شوبيفاي (cdn.shopify.com). يفضل عدم حذف حساب شوبيفاي فوراً حتى تنقل الصور أو ترفعها يدوياً لاحقاً.`);
    } catch (err) {
        console.error('❌ حدث خطأ أثناء الرفع:', err);
    }
    process.exit();
  });