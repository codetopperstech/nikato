'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { Button, Input, Card } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  phone: z.string().min(10),
  address_line: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  delivery_radius_km: z.coerce.number().min(0.5).max(50),
  min_order_amount: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function ShopSettingsPage() {
  const { shopData, setShop } = useShopStore();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (shopData) {
      reset({
        name: shopData.name,
        description: shopData.description ?? '',
        phone: shopData.phone,
        address_line: shopData.address_line,
        city: shopData.city,
        pincode: shopData.pincode,
        delivery_radius_km: shopData.delivery_radius_km,
        min_order_amount: shopData.min_order_amount,
      });
    }
  }, [shopData, reset]);

  async function onSubmit(values: FormValues) {
    if (!shopData) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('shops')
      .update(values)
      .eq('id', shopData.id)
      .select('*')
      .single();
    if (error) {
      toast.error('Failed to save settings', error.message);
    } else {
      setShop(data);
      toast.success('Settings saved!');
    }
    setSaving(false);
  }

  return (
    <div className="p-4 lg:p-6 max-w-xl space-y-6">
      <h1 className="text-2xl font-black text-gray-900">Shop Settings</h1>

      <Card className="p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Shop Name" {...register('name')} error={errors.name?.message} />
          <Input label="Description" {...register('description')} />
          <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
          <Input label="Address" {...register('address_line')} error={errors.address_line?.message} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" {...register('city')} error={errors.city?.message} />
            <Input label="Pincode" {...register('pincode')} error={errors.pincode?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Delivery Radius (km)"
              type="number"
              step="0.5"
              {...register('delivery_radius_km')}
              error={errors.delivery_radius_km?.message}
            />
            <Input
              label="Min Order (₹)"
              type="number"
              {...register('min_order_amount')}
              error={errors.min_order_amount?.message}
            />
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={saving} disabled={!isDirty}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Read-only info */}
      {shopData && (
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-gray-700">Platform Info</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Commission Rate</span>
            <span className="font-semibold text-gray-900">{(shopData.commission_rate * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Approval Status</span>
            <span className={`font-semibold ${shopData.is_approved ? 'text-green-600' : 'text-yellow-600'}`}>
              {shopData.is_approved ? 'Approved' : 'Pending Approval'}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
