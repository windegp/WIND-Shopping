import ImageKit from "imagekit";
import { NextResponse } from "next/server";

// ✅ السطر ده بيعرف Next.js إن الصفحة دي ديناميكية وميقرأهاش وقت الـ Build
export const dynamic = "force-dynamic";

export async function GET() {
  // 1. جلب المفاتيح من البيئة (Environment)
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  // 2. التحقق من وجود المفاتيح قبل البدء (أمان إضافي)
  if (!publicKey || !privateKey || !urlEndpoint) {
    return NextResponse.json(
      { error: "ImageKit credentials are missing" },
      { status: 500 }
    );
  }

  // 3. تعريف ImageKit "داخل" الدالة لضمان تنفيذه عند الطلب فقط
  const imagekit = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}