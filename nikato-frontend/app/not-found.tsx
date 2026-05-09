import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] px-6 text-center">
      <span className="text-6xl mb-4">🛵</span>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="bg-[#FF6B35] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#e55a26] transition-colors">
        Go Home
      </Link>
    </div>
  );
}
