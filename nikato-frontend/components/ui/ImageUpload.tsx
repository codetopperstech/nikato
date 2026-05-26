'use client';
import { useState, useRef } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface ImageUploadProps {
  bucket: 'product-images' | 'shop-images';
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ bucket, currentUrl, onUploaded, label, className = '' }: ImageUploadProps) {
  const { profile } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Client-side role guard
  const canUpload = profile?.role === 'shop_owner' || profile?.role === 'admin';
  if (!canUpload) return null;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB.'); return; }

    setUploading(true);
    setError('');

    try {
      // ✅ Upload via server-side API route — no RLS stack depth issues
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      setPreview(data.url);
      onUploaded(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onUploaded('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      {label && <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</p>}

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all cursor-pointer
          ${uploading ? 'pointer-events-none opacity-60' : 'hover:border-brand'}
          ${preview ? 'border-transparent' : 'border-gray-200'}`}
        style={{ minHeight: 120 }}>

        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full">Change photo</span>
            </div>
            <button onClick={clear} className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors">
              <X size={13} className="text-white" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            {uploading ? (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-3" style={{ borderColor: '#7ED957', borderTopColor: 'transparent' }} />
                <p className="text-xs text-gray-400 font-medium">Uploading…</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#edfbdc' }}>
                  <ImageIcon size={22} style={{ color: '#5cb83a' }} />
                </div>
                <p className="text-sm font-semibold text-gray-600">Tap to upload</p>
                <p className="text-xs text-gray-400 mt-1">or drag & drop · Max 5 MB</p>
                <p className="text-xs text-gray-300 mt-0.5">JPG, PNG, WEBP</p>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1.5">⚠ {error}</p>}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
