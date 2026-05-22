'use client';
import { useEffect } from 'react';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#F9FBF8' }}>
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-black text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-400 text-sm mb-6">We're sorry for the inconvenience.</p>
      <button onClick={reset} className="px-6 py-3 rounded-xl font-bold text-white text-sm" style={{ background: '#7ED957' }}>Try again</button>
    </div>
  );
}
