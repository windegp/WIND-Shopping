const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');

// 1. إعداد الاتصال بـ Firebase
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "wind-reviews.appspot.com" // 👈 تم التعديل هنا
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function uploadToStorage(url, destination) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        const file = bucket.file(destination);
        await file.save(response.data, {
            metadata: { contentType: response.headers['content-type'] },
            public: true
        });

        // الرابط الجديد العام
        return `https://storage.googleapis.com/${bucket.name}/${destination}`;
    } catch (error) {
        console.error(`❌ فشل تحميل الصورة: ${url}`, error.message);
        return null;
    }
}

async function startMigration() {
    console.log('⏳ جاري بدء عملية نقل صور WIND إلى سيرفرك الخاص...');
    
    const productsSnapshot = await db.collection('products').get();
    let updatedCount = 0;

    for (const doc of productsSnapshot.docs) {
        const product = doc.data();
        const newImages = [];
        let mainImageUrl = product.mainImageUrl;

        console.log(`📸 معالجة منتج: ${product.title}`);

        if (product.images && Array.isArray(product.images)) {
            for (let i = 0; i < product.images.length; i++) {
                const oldUrl = product.images[i];
                
                // تخطي لو الصورة مرفوعة فعلياً على جوجل
                if (oldUrl.includes('storage.googleapis.com')) {
                    newImages.push(oldUrl);
                    continue;
                }

                const fileName = `products/${doc.id}/img-${i}-${Date.now()}.jpg`;
                const newUrl = await uploadToStorage(oldUrl, fileName);

                if (newUrl) {
                    newImages.push(newUrl);
                    // لو كانت دي أول صورة، حدث الـ mainImageUrl
                    if (i === 0) mainImageUrl = newUrl;
                } else {
                    newImages.push(oldUrl); // حافظ على القديم لو الرفع فشل
                }
            }

            // تحديث الوثيقة في Firestore
            await doc.ref.update({
                images: newImages,
                mainImageUrl: mainImageUrl,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            updatedCount++;
            console.log(`✅ تم نقل ${newImages.length} صور للمنتج بنجاح.`);
        }
    }

    console.log(`\n✨ انتهت المهمة! تم تحديث ${updatedCount} منتج بنجاح.`);
    process.exit();
}

startMigration();