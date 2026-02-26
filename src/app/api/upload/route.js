import { NextResponse } from 'next/server';
import crypto from 'crypto';

// 🚀 إجبار فيرسيل على عدم الكاش
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 👇👇👇 حط مفاتيحك هنا يدوياً للتجربة 👇👇👇
    const privateKey = "private_d/0OZReajja+/7TGxcbvQKUCl7g="; // انسخه من ImageKit
    const publicKey = "public_qxxjKJ3sgdFJWnCWYk/BzUuiZlY=";  // انسخه من ImageKit
    const urlEndpoint = "https://ik.imagekit.io/windeg";   // انسخه من ImageKit
    // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆

    // توليد التوقيع (Signature) يدوياً
    const token = crypto.randomBytes(20).toString('hex');
    const expire = Math.floor(Date.now() / 1000) + 2400;
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire.toString())
      .digest('hex');

    // بنرجع كل حاجة عشان الـ Client يستخدمها وميحتاجش Env Vars هو كمان
    return NextResponse.json({
      token,
      expire,
      signature,
      publicKey,
      urlEndpoint
    });

  } catch (error) {
    console.error("❌ Manual Code Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}