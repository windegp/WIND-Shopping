import Link from 'next/link';

export default function FailedPage() {
    return (
        <div className="text-center mt-20">
            <div className="text-red-500 text-6xl mb-4">✘</div>
            <h1 className="text-2xl font-bold mb-2">نأسف، لم تكتمل العملية</h1>
            <p className="text-gray-600 mb-8">يرجى التأكد من بيانات البطاقة أو المحاولة مرة أخرى لاحقاً.</p>
            <Link 
                href="/checkout" 
                className="bg-blue-600 text-white px-6 py-2 rounded-md"
            >
                إعادة المحاولة
            </Link>
        </div>
    );
}