import Link from 'next/link';

export default function SuccessPage() {
    return (
        <div className="text-center mt-20">
            <div className="text-green-500 text-6xl mb-4">✔</div>
            <h1 className="text-3xl font-bold mb-2">شكراً لشرائك!</h1>
            <p className="text-gray-600 mb-8">تم استلام طلبك بنجاح وجاري تجهيز قطع الملابس الخاصة بك.</p>
            <Link 
                href="/" 
                className="bg-gray-800 text-white px-6 py-2 rounded-md hover:bg-black"
            >
                العودة للتسوق
            </Link>
        </div>
    );
}