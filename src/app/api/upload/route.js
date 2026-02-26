import { NextResponse } from 'next/server';
import ImageKit from "@imagekit/nodejs";

export async function GET() {
  try {
    // حط مفاتيحك هنا يدوياً للتجربة (بدون process.env)
    const imagekit = new ImageKit({
      publicKey: "public_qxxjKJ3sgdFJWnCWYk/BzUuiZlY=", // الـ Public Key بتاعك من ImageKit
      privateKey: "private_d/0OZReajja+/7TGxcbvQKUCl7g=", // الـ Private Key بتاعك
      urlEndpoint: "https://ik.imagekit.io/windeg" // الـ URL Endpoint بتاعك
    });

    const authParams = imagekit.getAuthenticationParameters();
    return NextResponse.json(authParams);

  } catch (error) {
    console.error("❌ Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}