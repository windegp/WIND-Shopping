import crypto from 'crypto';
import queryString from 'query-string';

// 1. إنشاء توقيع الدفع الابتدائي (Redirect Hash)
export function generatePaymentHash(orderId, amount, currency) {
    const mid = process.env.KASHIER_MERCHANT_ID;
    const apiKey = process.env.KASHIER_API_KEY;
    const path = `&payment=${mid}${orderId}${amount}${currency}`;
    return crypto.createHmac('sha256', apiKey).update(path).digest('hex');
}

// 2. التحقق من توقيع الـ Webhook (بناءً على طلب كاشير)
export function verifyWebhookSignature(data, receivedSignature) {
    const apiKey = process.env.KASHIER_API_KEY;
    
    // ترتيب المفاتيح أبجدياً كما تطلب كاشير
    const signatureKeys = data.signatureKeys.sort();
    
    // استخراج القيم وبناء سلسلة الاستعلام (Query String)
    const payload = signatureKeys
       .map(key => `${key}=${encodeURIComponent(data[key])}`)
       .join('&');

    const computedSignature = crypto
       .createHmac('sha256', apiKey)
       .update(payload)
       .digest('hex');

    return computedSignature === receivedSignature;
}