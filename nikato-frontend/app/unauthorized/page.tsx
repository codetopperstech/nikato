import Link from 'next/link';
export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#F9FBF8' }}>
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-400 text-sm mb-6">You don't have permission to view this page.</p>
      <Link href="/" className="px-6 py-3 rounded-xl font-bold text-white text-sm" style={{ background: '#7ED957' }}>Go Home</Link>
    </div>
  );
}
