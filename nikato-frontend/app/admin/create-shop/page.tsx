'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/store/ui';
import { Button, Input, Card } from '@/components/ui';

const schema = z.object({
  owner_phone: z.string().min(10, 'Phone required'),
  owner_name: z.string().min(2, 'Name required'),
  shop_name: z.string().min(2, 'Shop name required'),
  shop_phone: z.string().min(10, 'Shop phone required'),
  address_line: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().length(6),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  delivery_radius_km: z.coerce.number().min(0.5).max(50),
  min_order_amount: z.coerce.number().min(0),
  commission_rate: z.coerce.number().min(0).max(1),
});

type FormValues = z.infer<typeof schema>;

export default function AdminCreateShopPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { delivery_radius_km: 5, min_order_amount: 100, commission_rate: 0.10, lat: 0, lng: 0 },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      // 1. Find or create owner profile by phone
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', values.owner_phone)
        .maybeSingle();

      let ownerId: string;
      if (existingProfile) {
        ownerId = existingProfile.id;
        // Update role if needed
        await supabase.from('profiles').update({ role: 'shop_owner', full_name: values.owner_name }).eq('id', ownerId);
      } else {
        toast.error('Owner phone not found', 'User must register first via OTP');
        setSaving(false);
        return;
      }

      // 2. Create shop
      const { error } = await supabase.from('shops').insert({
        owner_id: ownerId,
        name: values.shop_name,
        phone: values.shop_phone,
        address_line: values.address_line,
        city: values.city,
        pincode: values.pincode,
        lat: values.lat,
        lng: values.lng,
        delivery_radius_km: values.delivery_radius_km,
        min_order_amount: values.min_order_amount,
        commission_rate: values.commission_rate,
        is_approved: true,
      });

      if (error) throw error;
      toast.success('Shop created and approved!');
      router.push('/admin/shops');
    } catch (err) {
      toast.error('Failed to create shop', String(err));
    }
    setSaving(false);
  }

  return (
    <div className="p-4 lg:p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/shops" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-xl font-black text-gray-900">Create Shop</h1>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="text-sm font-bold text-gray-700">Owner Details</h2>
          <Input label="Owner Phone (+91...)" {...register('owner_phone')} error={errors.owner_phone?.message} />
          <Input label="Owner Name" {...register('owner_name')} error={errors.owner_name?.message} />

          <h2 className="text-sm font-bold text-gray-700 pt-2">Shop Details</h2>
          <Input label="Shop Name" {...register('shop_name')} error={errors.shop_name?.message} />
          <Input label="Shop Phone" {...register('shop_phone')} error={errors.shop_phone?.message} />
          <Input label="Address" {...register('address_line')} error={errors.address_line?.message} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" {...register('city')} error={errors.city?.message} />
            <Input label="Pincode" {...register('pincode')} error={errors.pincode?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" type="number" step="any" {...register('lat')} />
            <Input label="Longitude" type="number" step="any" {...register('lng')} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Radius (km)" type="number" step="0.5" {...register('delivery_radius_km')} />
            <Input label="Min Order (₹)" type="number" {...register('min_order_amount')} />
            <Input label="Commission (0-1)" type="number" step="0.01" {...register('commission_rate')} />
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={saving}>
            Create Shop
          </Button>
        </form>
      </Card>
    </div>
  );
}
