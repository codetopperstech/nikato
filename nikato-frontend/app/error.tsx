'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] px-6 text-center">
      <span className="text-6xl mb-4">⚠️</span>
      <h1 className="text-xl font-black text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">{error.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={reset}
        className="bg-[#FF6B35] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#e55a26] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
