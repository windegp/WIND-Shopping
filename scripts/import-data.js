const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// 1. استخدام المفتاح السري
const serviceAccount = require('./serviceAccountKey.json'); 

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const productsMap = {};
const finalCollections = {};

console.log('⏳ جاري معالجة بيانات WIND من الملف...');

fs.createReadStream('scripts/products_export_1.csv')
  .pipe(csv())
  .on('data', (row) => {
    const handle = row.Handle;
    if (!handle) return;

    // تجهيز الـ Slug الخاص بالقسم (من النوع أو التاجز)
    const categoryName = row.Type || 'General';
    const categorySlug = categoryName.trim().toLowerCase().replace(/\s+/g, '-');

    if (!productsMap[handle]) {
        productsMap[handle] = {
            title: row.Title || '',
            description: row['Body (HTML)'] || '',
            price: row['Variant Price'] || '0',
            compareAtPrice: row['Variant Compare At Price'] || '',
            images: row['Image Src'] ? [row['Image Src']] : [],
            categories: [categorySlug], // الربط بـ slug القسم
            options: row['Option1 Value'] ? [row['Option1 Value']] : [],
            inventory: row['Variant Inventory Qty'] || '0',
            createdAt: new Date(),
            updatedAt: new Date(),
            slug: handle,
            status: 'active'
        };

        // تجميع الأقسام لإنشائها بشكل مستقل
        if (!finalCollections[categorySlug]) {
            finalCollections[categorySlug] = {
                name: categoryName,
                slug: categorySlug,
                productCount: 0,
                image: row['Image Src'] || '', // نأخذ أول صورة للمنتج كصورة للقسم مؤقتاً
                createdAt: new Date()
            };
        }
    } else {
        // إضافة الصور الإضافية والألوان للمنتج الموجود
        if (row['Image Src'] && !productsMap[handle].images.includes(row['Image Src'])) {
            productsMap[handle].images.push(row['Image Src']);
        }
        if (row['Option1 Value'] && !productsMap[handle].options.includes(row['Option1 Value'])) {
            productsMap[handle].options.push(row['Option1 Value']);
        }
    }
    // زيادة عداد المنتجات في القسم
    finalCollections[categorySlug].productCount += 1;
  })
  .on('end', async () => {
    console.log('✅ تحليل البيانات اكتمل. جاري الرفع لـ Firebase...');
    
    const batch = db.batch();

    // 1. رفع الأقسام أولاً (عشان تظهر في لوحة التحكم)
    for (const slug in finalCollections) {
        const colRef = db.collection('collections').doc(slug); // نستخدم الـ slug كـ ID للسهولة
        batch.set(colRef, finalCollections[slug], { merge: true });
    }

    // 2. رفع المنتجات
    for (const handle in productsMap) {
        const prodRef = db.collection('products').doc(handle); 
        batch.set(prodRef, productsMap[handle], { merge: true });
    }

    try {
        await batch.commit();
        console.log(`🚀 تم الرفع بنجاح!`);
        console.log(`- عدد المنتجات: ${Object.keys(productsMap).length}`);
        console.log(`- عدد الأقسام: ${Object.keys(finalCollections).length}`);
        console.log(`⚠️ ادخل الآن لوحة التحكم ستجد كل شيء متاحاً للتعديل.`);
    } catch (err) {
        console.error('❌ فشل الرفع:', err);
    }
    process.exit();
  });