import ImageKit from "@imagekit/nodejs"; // التحديث هنا
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
  });

  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
  } catch (error) {
    console.error("ImageKit Auth Error:", error);
    return NextResponse.json({ error: "فشل في المصادقة" }, { status: 500 });
  }
}