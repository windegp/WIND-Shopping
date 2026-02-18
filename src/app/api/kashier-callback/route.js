import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const paymentStatus = searchParams.get('paymentStatus');
    
    if (paymentStatus === 'SUCCESS') {
        // توجيه لصفحة النجاح في موقع الملابس
        return NextResponse.redirect(new URL('/checkout/success', request.url));
    }
    
    return NextResponse.redirect(new URL('/checkout/failed', request.url));
}