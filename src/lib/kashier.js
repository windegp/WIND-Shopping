import crypto from 'crypto';

// إنشاء التوقيع الأساسي لطلب الدفع
export function generatePaymentHash(orderId, amount, currency) {
    const mid = process.env.KASHIER_MERCHANT_ID;
    const apiKey = process.env.KASHIER_API_KEY;
    const path = `&payment=${mid}${orderId}${amount}${currency}`;
    // استخدام خوارزمية HMAC-SHA256 للتشفير الآمن 
    return crypto.createHmac('sha256', apiKey).update(path).digest('hex');
}

// التحقق من صحة بيانات الـ Webhook القادمة من كاشير
export function verifyWebhookSignature(data, receivedSignature) {
    const apiKey = process.env.KASHIER_API_KEY;
    const signatureKeys = data.signatureKeys.sort(); // ترتيب المفاتيح أبجدياً كما تطلب كاشير
    const payload = signatureKeys
      .map(key => `${key}=${encodeURIComponent(data[key])}`)
      .join('&');
    const computedSignature = crypto.createHmac('sha256', apiKey).update(payload).digest('hex');
    return computedSignature === receivedSignature;
}