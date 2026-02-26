import { NextResponse } from 'next/server';
import ImageKit from "@imagekit/nodejs";

export async function GET() {
  try {
    // 1. استخدام المفاتيح بشكل آمن من بيئة Vercel
    const imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
    });

    // 2. 💡 التعديل السحري: إضافة .helper قبل الدالة (للتوافق مع التحديث الجديد)
    const authParams = imagekit.helper.getAuthenticationParameters();
    
    return NextResponse.json(authParams);

  } catch (error) {
    console.error("❌ ImageKit API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}