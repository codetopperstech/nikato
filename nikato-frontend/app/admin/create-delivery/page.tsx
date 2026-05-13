'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function CreateDeliveryPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ phone: '', full_name: '' });

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
          body: JSON.stringify({ phone: form.phone, role: 'delivery', full_name: form.full_name }),
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error?.message || 'Failed to create delivery partner');
      } else {
        setSuccess(`✅ Delivery partner created! Phone: ${form.phone} — they can login with OTP`);
        setForm({ phone: '', full_name: '' });
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-2">Add Delivery Partner</h1>
      <p className="text-gray-400 text-sm mb-6">Creates delivery partner account instantly</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-4 text-sm">{success}</div>}

      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone (+91...)</label>
          <input name="phone" value={form.phone} onChange={handle} placeholder="+919XXXXXXXXX"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Full Name</label>
          <input name="full_name" value={form.full_name} onChange={handle} placeholder="Arjun Singh"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <button onClick={submit} disabled={loading || !form.phone || !form.full_name}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition">
          {loading ? 'Creating...' : '+ Add Delivery Partner'}
        </button>
      </div>
    </div>
  );
}
