const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// 1. ضع ملف الـ Service Account الخاص بـ Firebase هنا
const serviceAccount = require('./serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const products = {}; // لتجميع المنتجات المكررة
const collectionsSet = new Set(); // لتجميع الأقسام الفريدة

fs.createReadStream('products_export_1.csv')
  .pipe(csv())
  .on('data', (row) => {
    const handle = row.Handle;

    if (!products[handle]) {
      // إذا كان المنتج يظهر لأول مرة في القراءة
      products[handle] = {
        title: row.Title,
        description: row['Body (HTML)'],
        vendor: row.Vendor,
        type: row.Type,
        tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : [],
        price: parseFloat(row['Variant Price']) || 0,
        compareAtPrice: parseFloat(row['Variant Compare At Price']) || 0,
        images: row['Image Src'] ? [row['Image Src']] : [],
        options: row['Option1 Value'] ? [row['Option1 Value']] : [], // غالباً الألوان
        slug: handle,
        inventory: parseInt(row['Variant Inventory Qty']) || 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        categories: []
      };

      // إضافة الـ Type والـ Tags كأقسام للمنتج
      if (row.Type) products[handle].categories.push(row.Type.toLowerCase());
      if (row.Tags) {
        const tagsArray = row.Tags.split(',').map(t => t.trim().toLowerCase());
        products[handle].categories = [...new Set([...products[handle].categories, ...tagsArray])];
        tagsArray.forEach(tag => collectionsSet.add(tag)); // تجميع كل الأقسام لإنشائها لاحقاً
      }
      if (row.Type) collectionsSet.add(row.Type.toLowerCase());

    } else {
      // إذا كان المنتج موجود (سطر إضافي لصورة أو لون جديد)
      if (row['Image Src'] && !products[handle].images.includes(row['Image Src'])) {
        products[handle].images.push(row['Image Src']);
      }
      if (row['Option1 Value'] && !products[handle].options.includes(row['Option1 Value'])) {
        products[handle].options.push(row['Option1 Value']);
      }
    }
  })
  .on('end', async () => {
    console.log('✅ تم تحليل الملف بنجاح. جاري الرفع لـ WIND...');

    const batch = db.batch();

    // 1. رفع المنتجات
    for (const handle in products) {
      const productRef = db.collection('products').doc(); // معرف تلقائي
      batch.set(productRef, products[handle]);
    }

    // 2. رفع الأقسام (تلقائياً من الـ Tags)
    collectionsSet.forEach(colName => {
      const colRef = db.collection('collections').doc();
      batch.set(colRef, {
        name: colName,
        slug: colName.replace(/\s+/g, '-'),
        image: '', // تترك فارغة لترفعها لاحقاً من لوحة التحكم
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`🚀 مبروك! تم رفع ${Object.keys(products).length} منتج و ${collectionsSet.size} قسم بنجاح.`);
    process.exit();
  });