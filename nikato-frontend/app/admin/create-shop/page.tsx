'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function CreateShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    owner_phone: '', owner_name: '', shop_name: '', shop_phone: '',
    address_line: '', city: '', pincode: '', lat: '19.0760', lng: '72.8777',
    delivery_radius_km: '5', min_order_amount: '100', commission_rate: '0.1',
  });

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            phone: form.owner_phone,
            role: 'shop_owner',
            full_name: form.owner_name,
            shop: {
              name: form.shop_name,
              phone: form.shop_phone,
              address_line: form.address_line,
              city: form.city,
              pincode: form.pincode,
              lat: parseFloat(form.lat),
              lng: parseFloat(form.lng),
              delivery_radius_km: parseFloat(form.delivery_radius_km),
            },
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error?.message || 'Failed to create shop');
      } else {
        setSuccess(`✅ Shop created! Owner phone: ${form.owner_phone} — they can login with OTP`);
        setForm({ owner_phone: '', owner_name: '', shop_name: '', shop_phone: '',
          address_line: '', city: '', pincode: '', lat: '19.0760', lng: '72.8777',
          delivery_radius_km: '5', min_order_amount: '100', commission_rate: '0.1' });
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const fields = [
    { label: 'Owner Phone (+91...)', name: 'owner_phone', placeholder: '+919XXXXXXXXX' },
    { label: 'Owner Name', name: 'owner_name', placeholder: 'Ravi Kumar' },
    { label: 'Shop Name', name: 'shop_name', placeholder: 'Ravi Kirana Store' },
    { label: 'Shop Phone', name: 'shop_phone', placeholder: '+919XXXXXXXXX' },
    { label: 'Address', name: 'address_line', placeholder: '14 MG Road' },
    { label: 'City', name: 'city', placeholder: 'Mumbai' },
    { label: 'Pincode', name: 'pincode', placeholder: '400001' },
    { label: 'Latitude', name: 'lat', placeholder: '19.0760' },
    { label: 'Longitude', name: 'lng', placeholder: '72.8777' },
    { label: 'Delivery Radius (km)', name: 'delivery_radius_km', placeholder: '5' },
    { label: 'Min Order (₹)', name: 'min_order_amount', placeholder: '100' },
    { label: 'Commission (0-1)', name: 'commission_rate', placeholder: '0.1' },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Create Shop</h1>
      <p className="text-gray-400 text-sm mb-6">Creates shop owner account + shop in one step</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-4 text-sm">{success}</div>}

      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.name}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{f.label}</label>
              <input name={f.name} value={(form as any)[f.name]} onChange={handle}
                placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          ))}
        </div>
        <button onClick={submit} disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition mt-2">
          {loading ? 'Creating...' : 'Create Shop & Owner Account'}
        </button>
      </div>
    </div>
  );
}
