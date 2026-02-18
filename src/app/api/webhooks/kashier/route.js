import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/kashier';

export async function POST(request) {
    try {
        const body = await request.json();
        const { data, event } = body;
        const kashierSignature = request.headers.get('x-kashier-signature');

        // التحقق من صحة التوقيع لمنع التزوير
        const isValid = verifyWebhookSignature(data, kashierSignature);

        if (!isValid) {
            console.error("Invalid Webhook Signature!");
            return new Response('Invalid Signature', { status: 401 });
        }

        // معالجة الحدث (مثلاً: تحديث حالة الطلب في قاعدة البيانات)
        if (event === 'pay' && data.status === 'SUCCESS') {
            console.log(`Payment Successful for Order: ${data.merchantOrderId}`);
            // هنا تضع كود تحديث قاعدة البيانات لموقع الملابس الخاص بك
        }

        // الرد بـ 200 OK فوراً كما تطلب كاشير
        return new Response('OK', { status: 200 });
        
    } catch (error) {
        console.error("Webhook Error:", error);
        return new Response('Error', { status: 500 });
    }
}