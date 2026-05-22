export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FBF8' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#7ED957' }}>
          <span className="text-white text-xl font-black">N</span>
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7ED957', borderTopColor: 'transparent' }} />
      </div>
    </div>
  );
}
