import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'linear-gradient(160deg, #f0fce8 0%, #e8f6ff 100%)' }}>
      <div className="text-7xl mb-6 animate-bounce">🛵</div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">Lost in transit?</h1>
      <p className="text-gray-500 mb-8 text-sm leading-relaxed max-w-xs">The page you're looking for doesn't exist or has been moved.</p>
      <Link href="/" className="px-8 py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 hover:opacity-90" style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.3)' }}>
        Go Home
      </Link>
    </div>
  );
}
