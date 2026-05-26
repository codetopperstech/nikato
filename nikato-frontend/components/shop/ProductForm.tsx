'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { Category, Product } from '@/types';

const schema = z.object({
  name:        z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  price:       z.coerce.number().min(1, 'Price must be > 0'),
  mrp:         z.coerce.number().min(0).optional(),
  stock:       z.coerce.number().int().min(0, 'Stock cannot be negative'),
  unit:        z.string().min(1, 'Unit required'),
  category_id: z.string().optional(),
  is_available:z.boolean(),
  is_veg:      z.boolean(),
  image_url:   z.string().optional(),
});

export type ProductFormValues = z.infer<typeof schema>;

interface ProductFormProps {
  defaultValues?: Partial<Product>;
  categories: Category[];
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({ defaultValues, categories, onSubmit, isLoading }: ProductFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         defaultValues?.name ?? '',
      description:  defaultValues?.description ?? '',
      price:        defaultValues?.price ?? undefined,
      mrp:          defaultValues?.mrp ?? undefined,
      stock:        defaultValues?.stock ?? 0,
      unit:         defaultValues?.unit ?? 'piece',
      category_id:  defaultValues?.category_id ?? '',
      is_available: defaultValues?.is_available ?? true,
      is_veg:       defaultValues?.is_veg ?? true,
      image_url:    defaultValues?.image_url ?? '',
    },
  });

  const inp = (err: boolean) =>
    `w-full border-[1.5px] rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white
    ${err ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/15'}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* ── Image first — visual anchor ── */}
      <ImageUpload
        bucket="product-images"
        currentUrl={watch('image_url') || null}
        onUploaded={url => setValue('image_url', url)}
        label="Product Photo"
      />

      {/* ── Name ── */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Product Name *</label>
        <input {...register('name')} placeholder="e.g. Fresh Tomatoes" className={inp(!!errors.name)} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* ── Description ── */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Description</label>
        <textarea {...register('description')} rows={2} placeholder="Short description…" className={`${inp(false)} resize-none`} />
      </div>

      {/* ── Price + MRP ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Selling Price (₹) *</label>
          <input type="number" step="0.01" min="0" {...register('price')} placeholder="0" className={inp(!!errors.price)} />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">MRP (₹)</label>
          <input type="number" step="0.01" min="0" {...register('mrp')} placeholder="0" className={inp(false)} />
        </div>
      </div>

      {/* ── Stock + Unit ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Stock *</label>
          <input type="number" min="0" {...register('stock')} placeholder="0" className={inp(!!errors.stock)} />
          {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Unit *</label>
          <select {...register('unit')} className={inp(false)}>
            {['piece','kg','g','l','ml','dozen','pack','box','bundle'].map(u =>
              <option key={u} value={u}>{u}</option>
            )}
          </select>
        </div>
      </div>

      {/* ── Category ── */}
      {categories.length > 0 && (
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Category</label>
          <select {...register('category_id')} className={inp(false)}>
            <option value="">No category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* ── Toggles ── */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { field: 'is_veg'       as const, label: '🟢 Veg' },
          { field: 'is_available' as const, label: '✅ Available' },
        ]).map(({ field, label }) => (
          <label key={field} className="flex items-center justify-between bg-white border-[1.5px] border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-gray-300 transition-colors">
            <span className="text-sm font-semibold text-gray-700">{label}</span>
            <div className="relative flex-shrink-0">
              <input type="checkbox" {...register(field)} className="sr-only peer" />
              <div className="w-10 h-5 rounded-full bg-gray-200 peer-checked:bg-brand transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        ))}
      </div>

      {/* ── Submit ── */}
      <button type="submit" disabled={isLoading}
        className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.3)' }}>
        {isLoading
          ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          : defaultValues?.name ? 'Save Changes' : 'Add Product'}
      </button>
    </form>
  );
}
