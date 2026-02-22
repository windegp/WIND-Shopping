export const runtime = 'nodejs'; // ضروري جداً عشان الـ Buffer يشتغل على Vercel
import { NextResponse } from 'next/server';
import ImageKit from "imagekit";

// ربط ImageKit بالمفاتيح اللي إنت حطيتها في ملف .env
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'لم يتم العثور على صورة' }, { status: 400 });
    }

    // تحويل الصورة لبيانات يفهمها السيرفر
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // رفع الصورة لـ ImageKit
    const response = await imagekit.upload({
      file: buffer,
      fileName: file.name.replace(/\s+/g, '-'), // بنشيل المسافات من اسم الصورة
      folder: "/wind_shop_images", // ده الفولدر اللي هيتعمل في حسابك هناك
    });

    // السيرفر بيرد عليك بالرابط النظيف للصورة!
    return NextResponse.json({ url: response.url }, { status: 200 });

  } catch (error) {
    console.error('❌ ImageKit Upload Error:', error);
    return NextResponse.json({ error: 'فشل رفع الصورة' }, { status: 500 });
  }
}