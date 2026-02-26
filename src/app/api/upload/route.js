import { NextResponse } from 'next/server';
import crypto from 'crypto';

// السطر ده مهم جداً عشان يمنع فيرسيل من كأشحة الصفحة
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // السيرفر بيقرا المفاتيح المتخزنة بأمان في فيرسيل
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (!privateKey || !publicKey) {
      return NextResponse.json({ error: "الخزنة مقفولة: المفاتيح مش موجودة في فيرسيل" }, { status: 500 });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expire = Math.floor(Date.now() / 1000) + 2400;
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire.toString())
      .digest('hex');

    // بنبعت المفتاح العام والـ Endpoint للـ Frontend عشان نريحه
    return NextResponse.json({
      token,
      expire,
      signature,
      publicKey,
      urlEndpoint
    });

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}