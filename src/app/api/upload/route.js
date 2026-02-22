export const runtime = 'nodejs'; 
import { NextResponse } from 'next/server';
import ImageKit from "imagekit";

export async function POST(request) {
  try {
    // 💡 التعديل هنا: نقلنا الإعدادات داخل الدالة عشان Vercel ما يزعلش وقت الـ Build
    const imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
    });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'لم يتم العثور على صورة' }, { status: 400 });
    }

    // تحويل الصورة لبيانات يفهمها السيرفر
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // الرفع المباشر
    const response = await imagekit.upload({
      file: buffer,
      fileName: file.name.replace(/\s+/g, '-'), 
      folder: "/WIND_Shopping", 
    });

    return NextResponse.json({ url: response.url }, { status: 200 });

  } catch (error) {
    console.error('❌ ImageKit Upload Error:', error);
    return NextResponse.json({ error: 'فشل رفع الصورة' }, { status: 500 });
  }
}