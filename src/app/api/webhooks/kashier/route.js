import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/kashier';
import { successResponse, errorResponse, unauthorizedError } from '@/lib/apiResponse';

export async function POST(request) {
    try {
        const body = await request.json();
        const { data, event } = body;
        const kashierSignature = request.headers.get('x-kashier-signature');

        // Verify webhook signature to prevent spoofing
        const isValid = verifyWebhookSignature(data, kashierSignature);

        if (!isValid) {
            console.error("Invalid Webhook Signature!");
            const response = unauthorizedError('Invalid webhook signature');
            return NextResponse.json(response.body, { status: response.status });
        }

        // Handle payment success event (update order status in database)
        if (event === 'pay' && data.status === 'SUCCESS') {
            console.log(`Payment Successful for Order: ${data.merchantOrderId}`);
            // TODO: Update order status in Firestore
            // TODO: Send confirmation email to customer
            // Example: updateOrderStatus(data.merchantOrderId, 'paid')
        }

        // Always respond with 200 OK as required by Kashier webhook spec
        return NextResponse.json({ success: true }, { status: 200 });
        
    } catch (error) {
        console.error("Webhook Error:", error);
        const response = errorResponse('Webhook processing failed', 'WEBHOOK_ERROR', 500);
        return NextResponse.json(response.body, { status: response.status });
    }
}