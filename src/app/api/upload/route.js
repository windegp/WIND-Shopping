import { NextResponse } from 'next/server';
import ImageKit from "@imagekit/nodejs"; // التعديل هنا: اسم المكتبة الجديد

export async function GET() {
  try {
    // التأكد من أن القيم موجودة في الـ Environment Variables
    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) {
      console.error("❌ Missing ImageKit Keys");
      return NextResponse.json({ error: "Missing Keys" }, { status: 500 });
    }

    const imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
    });

    const authParams = imagekit.getAuthenticationParameters();
    return NextResponse.json(authParams);
  } catch (error) {
    console.error("❌ ImageKit Auth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}