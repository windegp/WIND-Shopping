import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const ORDER_NUMBER_FILE = path.join(process.cwd(), 'order_count.txt');

function getNextOrderNumber() {
  try {
    if (!fs.existsSync(ORDER_NUMBER_FILE)) {
      fs.writeFileSync(ORDER_NUMBER_FILE, '1001');
      return '1001';
    }
    const currentNumber = fs.readFileSync(ORDER_NUMBER_FILE, 'utf8');
    const nextNumber = parseInt(currentNumber) + 1;
    fs.writeFileSync(ORDER_NUMBER_FILE, nextNumber.toString());
    return nextNumber.toString();
  } catch (error) {
    console.error("خطأ في ملف عداد الطلبات:", error);
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}

export async function POST(req) {
  try {
    const { formData, cartItems, total } = await req.json();
    const orderNumber = getNextOrderNumber();

    // 1. إرسال الإيميل
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("بيانات الإيميل غير موجودة في الـ .env");
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const itemsHtml = cartItems.map(item => `
      <div style="border-bottom: 1px solid #eee; padding: 10px 0; text-align: right;" dir="rtl">
        <p><strong>المنتج:</strong> ${item.title}</p>
        <p><strong>المقاس:</strong> ${item.selectedSize}</p>
        <p><strong>الكمية:</strong> ${item.qty}</p>
        <p><strong>السعر:</strong> ${item.price} EGP</p>
      </div>
    `).join('');

    const adminMailOptions = {
      from: `"WIND Store" <${process.env.EMAIL_USER}>`,
      to: "windegp@gmail.com",
      subject: `طلب جديد رقم #${orderNumber} - من ${formData.firstName}`,
      html: `<div dir="rtl" style="font-family: Arial;"><h2>طلب جديد #${orderNumber}</h2>${itemsHtml}<h3>الإجمالي: ${total} EGP</h3></div>`,
    };

    await transporter.sendMail(adminMailOptions);

    // 2. إرسال الإشعار لـ OneSignal (تم تصحيح الـ Headers)
    const appId = process.env.ONESIGNAL_APP_ID;
    const restKey = process.env.ONESIGNAL_REST_API_KEY;

    if (appId && restKey) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

        // تنظيف المفتاح من أي مسافات أو حروف غريبة
        const cleanRestKey = restKey.trim();

        await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            // الحل هنا: نكتب Basic كـ String ونضيف المفتاح النظيف
            "Authorization": "Basic " + cleanRestKey 
          },
          body: JSON.stringify({
            app_id: appId,
            included_segments: ["Subscribed Users"],
            headings: { "ar": "💰 أوردر جديد لـ WIND!", "en": "New Order!" },
            contents: { 
              "ar": `العميل: ${formData.firstName} | الإجمالي: ${total} EGP`,
              "en": `New Order from ${formData.firstName}`
            },
            web_sound: siteUrl + "/sounds/cashier.mp3",
            priority: 10,
          })
        });
      } catch (oneSignalError) {
        console.error("فشل إرسال إشعار OneSignal:", oneSignalError.message);
      }
    }

    return NextResponse.json({ orderNumber }, { status: 200 });

  } catch (error) {
    console.error("السيرفر واجه مشكلة:", error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}