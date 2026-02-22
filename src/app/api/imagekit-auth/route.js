import ImageKit from "imagekit";
import { NextResponse } from "next/server";

// إعداد "الكلاينت" باستخدام المفاتيح اللي سجلناها في الـ Environment Variables
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

export async function GET() {
  try {
    // توليد باراميترات المصادقة (التوقيع الرقمي)
    const authenticationParameters = imagekit.getAuthenticationParameters();
    
    // إرجاع البيانات للمتصفح ليستخدمها في عملية الرفع
    return NextResponse.json(authenticationParameters);
  } catch (error) {
    console.error("ImageKit Auth Error:", error);
    return NextResponse.json(
      { error: "فشلت عملية المصادقة مع ImageKit" }, 
      { status: 500 }
    );
  }
}