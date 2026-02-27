export const runtime = 'nodejs'; // إجبار فيرسيل على استخدام بيئة نود الكاملة
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend'; // استيراد Resend بدلاً من nodemailer

// تهيئة Resend باستخدام مفتاح الـ API الخاص بك
const resend = new Resend('re_iNyysf4J_BD7FfZgwCsvBUW7vuY3o3SBw');

// دالة توليد رقم أوردر فريد
function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().split('T')[0].replace(/-/g, ''); // 20260219
  const timePart = now.getTime().toString().slice(-4); // آخر 4 أرقام من الوقت
  return `WND-${datePart}-${timePart}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      paymentMethod, 
      orderId, 
      amount, 
      customerName, 
      customerEmail, 
      phone, 
      formData, 
      cartItems, 
      total,
      appliedPromo 
    } = body;

    // ============================================
    // 1. كاشير — إرجاع بيانات الـ iFrame (hash + params)
    //    ⚠️ تغيير: بدل ما نرجع paymentUrl للـ redirect،
    //    نرجع الـ hash والبيانات عشان الـ iFrame يشتغل
    //    في نفس الصفحة بدون redirect
    // ============================================
    if (paymentMethod === 'card') {
      const merchantId = process.env.KASHIER_MERCHANT_ID;
      const paymentApiKey = process.env.KASHIER_API_KEY;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const mode = process.env.KASHIER_MODE || 'live';
      const currency = 'EGP';

      if (!merchantId || !paymentApiKey || !baseUrl) {
        return NextResponse.json(
          { error: `متغير ناقص في الإعدادات` },
          { status: 500 }
        );
      }

      const amountStr = parseFloat(amount).toFixed(2);

      // توليد الـ hash (HMAC SHA256) — نفس المنطق بالظبط
      const hashPath = `/?payment=${merchantId}.${orderId}.${amountStr}.${currency}`;
      const hash = crypto
        .createHmac('sha256', paymentApiKey)
        .update(hashPath)
        .digest('hex');

      // ✅ إرجاع بيانات الـ iFrame بدل رابط الـ redirect
      return NextResponse.json({
        success: true,
        iframeData: {
          merchantId,
          hash,
          orderId,
          amount: amountStr,
          currency,
          mode,
          merchantRedirect: `${baseUrl}/checkout/success`,
          failureRedirect: `${baseUrl}/checkout/failed`,
          allowedMethods: 'bank_installments,card,wallet',
          display: 'ar',
          brandColor: '#F5C518',
        }
      });
    }

    // ============================================
    // 2. COD أو InstaPay أو Card_Success — إرسال الإيميل
    //    ⚠️ لم يتغير شيء هنا — نفس الكود بالكامل
    // ============================================
    const orderNumber = generateOrderNumber(); 

    // --- تجهيز بيانات الإيميل ---
    const shippingText = appliedPromo === 'free' ? '0 EGP (شحن مجاني 🎉)' : '70 EGP';
    
    let displayPaymentMethod = 'دفع عند الاستلام';
    if (paymentMethod === 'instapay') displayPaymentMethod = 'إنستا باي';
    if (paymentMethod === 'card_success') displayPaymentMethod = 'بطاقة ائتمان (مدفوع بنجاح ✅)';

    // --- بناء محتوى الإيميل (htmlContent) ---
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
          <p style="margin: 5px 0; font-size: 14px;"><strong>طريقة الدفع:</strong> <span style="color: #10b981; font-weight: bold;">${displayPaymentMethod}</span></p>
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
            <tr>
              <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; color: #a1a1a1;">مصاريف الشحن:</td>
              <td style="padding: 12px; text-align: left; font-weight: bold; color: ${appliedPromo === 'free' ? '#10b981' : '#eee'};">${shippingText}</td>
            </tr>
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

    // ============================================
    // 3. إرسال الإيميل عبر Resend — لم يتغير شيء
    // ============================================
    try {
      await resend.emails.send({
        from: 'Wind Website <info@windeg.com>', 
        to: 'info@windeg.com',
        subject: `طلب جديد من ${formData.firstName} #${orderNumber}`,
        html: htmlContent,
      });
      console.log('✅ Email sent successfully via Resend');
    } catch (emailError) {
      console.error('❌ Resend Email Error:', emailError.message);
      // لا نعطل العملية بالكامل إذا فشل الإيميل، لكن نسجل الخطأ
    }

    // الرد النهائي بنجاح العملية
    return NextResponse.json({ orderNumber }, { status: 200 });

  } catch (error) {
    console.error('Server Error:', error.message);
    return NextResponse.json(
      { message: 'Internal Server Error', details: error.message }, 
      { status: 500 }
    );
  }
}