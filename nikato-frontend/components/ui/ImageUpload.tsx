'use client';
import { useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';

interface ImageUploadProps {
  bucket: 'product-images' | 'shop-images';
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ bucket, currentUrl, onUploaded, label = 'Upload Image', className = '' }: ImageUploadProps) {
  const { profile } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only shop_owner and admin can upload
  const canUpload = profile?.role === 'shop_owner' || profile?.role === 'admin';

  const handleFile = async (file: File) => {
    if (!canUpload) { setError('Only shop owners and admins can upload images.'); return; }
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB.'); return; }

    setUploading(true);
    setError('');

    try {
      // Unique filename: role/userId/timestamp.ext
      const ext = file.name.split('.').pop() ?? 'jpg';
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user!.id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      setPreview(publicUrl);
      onUploaded(publicUrl);
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

  const clear = () => { setPreview(null); onUploaded(''); if (inputRef.current) inputRef.current.value = ''; };

  if (!canUpload) return null;

  return (
    <div className={className}>
      {label && <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</p>}

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all cursor-pointer
          ${uploading ? 'pointer-events-none opacity-70' : 'hover:border-brand'}
          ${preview ? 'border-transparent' : 'border-gray-200 hover:bg-surface-2'}`}
        style={{ minHeight: 120 }}>

        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full">Change photo</span>
            </div>
            <button onClick={e => { e.stopPropagation(); clear(); }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors">
              <X size={13} className="text-white" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            {uploading ? (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-3" style={{ borderColor: '#7ED957', borderTopColor: 'transparent' }} />
                <p className="text-xs text-gray-400">Uploading…</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#edfbdc' }}>
                  <ImageIcon size={22} style={{ color: '#5cb83a' }} />
                </div>
                <p className="text-sm font-semibold text-gray-600">Tap to upload</p>
                <p className="text-xs text-gray-400 mt-1">or drag & drop · Max 5 MB</p>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">⚠ {error}</p>}

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
