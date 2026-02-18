import { NextResponse } from 'next/server';
import crypto from 'crypto';
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
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId, amount, customerName, customerEmail, phone, formData, cartItems, total, paymentMethod } = body;

    // ============================================
    // لو الطلب جاي من كاشير (card)
    // ============================================
    if (paymentMethod === 'card') {
      const merchantId = process.env.KASHIER_MERCHANT_ID;
      const hashSecret = process.env.KASHIER_HASH_SECRET;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const mode = process.env.KASHIER_MODE || 'live';
      const currency = 'EGP';

      if (!merchantId || !hashSecret || !baseUrl) {
        return NextResponse.json(
          { error: `متغير ناقص: merchantId=${!!merchantId} hashSecret=${!!hashSecret} baseUrl=${!!baseUrl}` },
          { status: 500 }
        );
      }

      const path2 = `/?payment=${merchantId}.${orderId}.${amount}.${currency}`;
      const hash = crypto.createHmac('sha256', hashSecret).update(path2).digest('hex');

      const kashierUrl = new URL('https://checkout.kashier.io');
      kashierUrl.searchParams.set('merchantId', merchantId);
      kashierUrl.searchParams.set('orderId', orderId);
      kashierUrl.searchParams.set('amount', amount);
      kashierUrl.searchParams.set('currency', currency);
      kashierUrl.searchParams.set('hash', hash);
      kashierUrl.searchParams.set('mode', mode);
      kashierUrl.searchParams.set('merchantRedirect', `${baseUrl}/checkout/success`);
      kashierUrl.searchParams.set('failureRedirect', `${baseUrl}/checkout/failure`);
      kashierUrl.searchParams.set('display', 'ar');
      kashierUrl.searchParams.set('brandColor', 'F5C518');
      kashierUrl.searchParams.set('allowedMethods', 'card,wallet');
      if (customerName) kashierUrl.searchParams.set('customerName', customerName);
      if (customerEmail) kashierUrl.searchParams.set('customerEmail', customerEmail);
      if (phone) kashierUrl.searchParams.set('customerPhone', phone);

      return NextResponse.json({ success: true, paymentUrl: kashierUrl.toString(), orderId });
    }

    // ============================================
    // لو الطلب COD أو InstaPay — بعت إيميل + OneSignal
    // ============================================
    const orderNumber = getNextOrderNumber();

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("بيانات الإيميل غير موجودة في الـ .env");
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const htmlContent = `
      <div dir="rtl" style="font-family: 'Arial', sans-serif; background-color: #121212; color: #ffffff; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #333;">
        <div style="text-align: center; border-bottom: 2px solid #F5C518; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #F5C518; margin: 0; font-size: 28px; letter-spacing: 2px;">WIND SHOPPING</h1>
          <p style="color: #a1a1a1; font-size: 14px; margin-top: 5px;">طلب جديد رقم #${orderNumber}</p>
        </div>
        <div style="background-color: #1a1a1a; padding: 15px; border-radius: 4px; margin-bottom: 25px; border-right: 4px solid #F5C518;">
          <h3 style="color: #F5C518; margin-top: 0; font-size: 16px;">بيانات العميل:</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>الاسم:</strong> ${formData.firstName} ${formData.lastName}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>الهاتف:</strong> ${formData.phone}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>العنوان:</strong> ${formData.address}, ${formData.governorate}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>البريد:</strong> ${formData.email}</p>
        </div>
        <h3 style="color: #F5C518; font-size: 16px; margin-bottom: 10px;">ملخص المشتريات:</h3>
        <table style="width: 100%; border-collapse: collapse; color: #ffffff;">
          <thead>
            <tr style="background-color: #222;">
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #333; font-size: 13px;">المنتج</th>
              <th style="padding: 12px; text-align: center; border-bottom: 1px solid #333; font-size: 13px;">الكمية</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #333; font-size: 13px;">السعر</th>
            </tr>
          </thead>
          <tbody>
            ${cartItems.map(item => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #222; font-size: 13px;">
                  <span style="font-weight: bold; color: #eee;">${item.title}</span><br/>
                  <small style="color: #F5C518;">المقاس: ${item.selectedSize}</small>
                </td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #222;">${item.qty}</td>
                <td style="padding: 12px; text-align: left; border-bottom: 1px solid #222; font-weight: bold;">${item.price} EGP</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 30px; padding: 15px; background-color: #F5C518; color: #000; border-radius: 4px; text-align: center;">
          <span style="font-size: 14px; font-weight: bold;">الإجمالي الكلي المستحق</span>
          <h2 style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900;">${total} EGP</h2>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #555; font-size: 11px;">
          <p>© 2026 WIND Shopping. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"WIND Shopping" <${process.env.EMAIL_USER}>`,
      to: "windegp@gmail.com",
      subject: `💰 طلب جديد #${orderNumber} - ${formData.firstName}`,
      html: htmlContent,
    });

    // OneSignal
    const appId = process.env.ONESIGNAL_APP_ID;
    const restKey = process.env.ONESIGNAL_REST_API_KEY;
    if (appId && restKey) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://windshopping.com";
        await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": "Basic " + restKey.trim()
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
      } catch (e) {
        console.error("OneSignal Error:", e.message);
      }
    }

    return NextResponse.json({ orderNumber }, { status: 200 });

  } catch (error) {
    console.error("Server Error:", error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}