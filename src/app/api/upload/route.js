import { NextResponse } from 'next/server';
import ImageKit from "@imagekit/nodejs";

export async function GET() {
  try {
    // 1. فحص وجود المفاتيح في بيئة السيرفر
    const pubKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEnd = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (!pubKey || !privKey || !urlEnd) {
      console.error("❌ مفاتيح ناقصة:", { pubKey: !!pubKey, privKey: !!privKey, urlEnd: !!urlEnd });
      return NextResponse.json({ 
        error: "Missing Keys", 
        details: { pubKey: !!pubKey, privKey: !!privKey, urlEnd: !!urlEnd } 
      }, { status: 500 });
    }

    // 2. محاولة تشغيل المكتبة
    const imagekit = new ImageKit({
      publicKey: pubKey,
      privateKey: privKey,
      urlEndpoint: urlEnd
    });

    const authParams = imagekit.getAuthenticationParameters();
    return NextResponse.json(authParams);

  } catch (error) {
    console.error("❌ خطأ داخلي في الـ API:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}