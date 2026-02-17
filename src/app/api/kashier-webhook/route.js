import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId, paymentStatus, transactionId, signature } = body;

    // ← البيانات بتيجي تلقائياً من .env.local، مش محتاج تغير حاجة هنا
    const merchantId = process.env.KASHIER_MERCHANT_ID;
    const hashSecret = process.env.KASHIER_HASH_SECRET;

    // التحقق من صحة التوقيع القادم من كاشير
    const expectedSig = crypto
      .createHmac('sha256', hashSecret)
      .update(`${merchantId}${orderId}`)
      .digest('hex');

    if (signature !== expectedSig) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (paymentStatus === 'SUCCESS') {
      // ✅ الدفع نجح — هنا تحدّث قاعدة البيانات بتاعتك
      console.log(`دفع ناجح: ${orderId} | transaction: ${transactionId}`);

      // مثال Prisma:
      // await prisma.order.update({ where: { id: orderId }, data: { status: 'paid' } });

      // مثال Supabase:
      // await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);

    } else if (paymentStatus === 'FAILED') {
      console.log(`دفع فاشل: ${orderId}`);
      // await db.orders.update({ orderId, status: 'failed' });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}