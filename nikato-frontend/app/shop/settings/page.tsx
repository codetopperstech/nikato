'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Settings, Save } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import type { Shop } from '@/types';

type FormValues = {
  name: string;
  logo_url: string;
  phone: string;
  address_line: string;
  city: string;
  pincode: string;
  delivery_radius_km: number;
  min_order_amount: number;
  avg_delivery_minutes: number;
};

export default function ShopSettingsPage() {
  const { shopData, setShop } = useShopStore();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: shopData?.name ?? '',
      phone: shopData?.phone ?? '',
      address_line: shopData?.address_line ?? '',
      city: shopData?.city ?? '',
      pincode: shopData?.pincode ?? '',
      delivery_radius_km: shopData?.delivery_radius_km ?? 3,
      min_order_amount: shopData?.min_order_amount ?? 0,
      avg_delivery_minutes: shopData?.avg_delivery_minutes ?? 30,
      logo_url: shopData?.logo_url ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const res = await fetch('/api/shop/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    const data = await res.json();
    if (!res.ok) toast.error('Failed to save', data.error ?? '');
    else { setShop(data.shop as Shop); toast.success('Settings saved!'); }
    setSaving(false);
  };

  const inputCls = (err?: boolean) =>
    `w-full border-[1.5px] rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white ${err ? 'border-red-400' : 'border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/15'}`;

  return (
    <div className="p-4 lg:p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#edfbdc' }}>
          <Settings size={20} style={{ color: '#5cb83a' }} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Settings</h1>
          <p className="text-xs text-gray-400">Update your shop details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Shop Name *</label>
          <input {...register('name', { required: true })} className={inputCls(!!errors.name)} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Phone</label>
          <input {...register('phone')} className={inputCls()} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Address</label>
          <input {...register('address_line')} className={inputCls()} placeholder="Street, Area" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">City</label>
            <input {...register('city')} className={inputCls()} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Pincode</label>
            <input {...register('pincode')} className={inputCls()} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Radius (km)</label>
            <input type="number" step="0.1" {...register('delivery_radius_km')} className={inputCls()} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Min Order (₹)</label>
            <input type="number" {...register('min_order_amount')} className={inputCls()} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">ETA (mins)</label>
            <input type="number" {...register('avg_delivery_minutes')} className={inputCls()} />
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <ImageUpload
            bucket="shop-images"
            currentUrl={shopData?.logo_url}
            onUploaded={(url) => setValue('logo_url', url)}
            label="Shop Logo / Banner"
          />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.3)' }}>
          {saving ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Save size={15} /> Save Settings</>}
        </button>
      </form>
    </div>
  );
}
