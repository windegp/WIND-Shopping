import { NextResponse } from 'next/server';
import crypto from 'crypto';

// 💡 هذا هو السطر السحري: يجبر Vercel على تشغيل الكود في كل مرة وعدم استخدام الكاش
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    // لو المفتاح لسه مش مقروء، هيطلع لنا رسالة واضحة
    if (!privateKey) {
      return NextResponse.json({ error: "Private key is completely missing from Vercel" }, { status: 500 });
    }

    // توليد التوقيع يدوياً (أسرع وأضمن مليون مرة من المكتبة)
    const token = crypto.randomBytes(20).toString('hex');
    const expire = Math.floor(Date.now() / 1000) + 2400; // صالح لمدة 40 دقيقة
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire.toString())
      .digest('hex');

    return NextResponse.json({ token, expire, signature });
  } catch (error) {
    console.error("❌ Auth Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}