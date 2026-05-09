'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import type { Category, Product } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
  price: z.coerce.number().min(1, 'Price must be > 0'),
  mrp: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  unit: z.string().min(1, 'Unit required'),
  category_id: z.string().optional(),
  is_available: z.boolean(),
  is_veg: z.boolean(),
});

export type ProductFormValues = z.infer<typeof schema>;

interface ProductFormProps {
  defaultValues?: Partial<Product>;
  categories: Category[];
  onSubmit: (values: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({ defaultValues, categories, onSubmit, isLoading }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      price: defaultValues?.price ?? 0,
      mrp: defaultValues?.mrp ?? undefined,
      stock: defaultValues?.stock ?? 0,
      unit: defaultValues?.unit ?? 'piece',
      category_id: defaultValues?.category_id ?? '',
      is_available: defaultValues?.is_available ?? true,
      is_veg: defaultValues?.is_veg ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Product Name" {...register('name')} error={errors.name?.message} />
      <Input label="Description" {...register('description')} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Price (₹)" type="number" step="0.01" {...register('price')} error={errors.price?.message} />
        <Input label="MRP (₹)" type="number" step="0.01" {...register('mrp')} hint="Leave blank if no MRP" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Stock Qty" type="number" {...register('stock')} error={errors.stock?.message} />
        <Input label="Unit" placeholder="kg / piece / 500ml" {...register('unit')} error={errors.unit?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Category</label>
        <select
          {...register('category_id')}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
        >
          <option value="">— No Category —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input type="checkbox" {...register('is_veg')} className="w-4 h-4 rounded accent-green-500" />
          Vegetarian
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input type="checkbox" {...register('is_available')} className="w-4 h-4 rounded accent-[#FF6B35]" />
          Available
        </label>
      </div>

      <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
        {defaultValues?.id ? 'Save Changes' : 'Add Product'}
      </Button>
    </form>
  );
}
