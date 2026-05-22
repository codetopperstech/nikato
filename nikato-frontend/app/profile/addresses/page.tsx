'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus, Trash2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/ui';
import { Skeleton } from '@/components/ui';
import type { Address } from '@/types';

export default function AddressesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: 'Home', address_line: '', city: '', pincode: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ['addresses', user?.id],
    queryFn: async () => { const { data } = await supabase.from('addresses').select('*').eq('user_id', user!.id).order('is_default', { ascending: false }); return (data ?? []) as Address[]; },
    enabled: !!user,
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.address_line.trim()) e.address_line = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = '6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addAddress = async () => {
    if (!validate()) return;
    setSaving(true);
    const { error } = await supabase.from('addresses').insert({ user_id: user!.id, label: form.label, address_line: form.address_line.trim(), city: form.city.trim(), pincode: form.pincode.trim(), lat: 0, lng: 0, is_default: addresses.length === 0 });
    if (error) { toast.error('Failed to add address'); }
    else { qc.invalidateQueries({ queryKey: ['addresses', user?.id] }); setAdding(false); setForm({ label: 'Home', address_line: '', city: '', pincode: '' }); toast.success('Address added'); }
    setSaving(false);
  };

  const deleteAddress = async (id: string) => {
    const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', user!.id);
    if (error) toast.error('Failed to delete');
    else { qc.invalidateQueries({ queryKey: ['addresses', user?.id] }); toast.success('Address removed'); }
  };

  const setDefault = async (id: string) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['addresses', user?.id] });
  };

  const inputCls = (err?: string) => `w-full border-[1.5px] rounded-xl px-4 py-3 text-sm outline-none transition-all ${err ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/15'}`;

  return (
    <div className="min-h-screen" style={{ background: '#F9FBF8' }}>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3">
        <Link href="/profile" className="p-2 rounded-xl hover:bg-surface-2 transition-colors"><ArrowLeft size={20} className="text-gray-700" /></Link>
        <h1 className="text-base font-black text-gray-900 flex-1">Saved Addresses</h1>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white transition-all" style={{ background: '#7ED957' }}>
          <Plus size={13} /> Add
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Add form */}
        {adding && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card animate-slide-up space-y-3">
            <h3 className="text-sm font-black text-gray-900">New Address</h3>
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map(l => (
                <button key={l} onClick={() => setForm(f => ({ ...f, label: l }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all ${form.label === l ? 'text-white border-transparent' : 'border-gray-200 text-gray-500'}`}
                  style={form.label === l ? { background: '#7ED957' } : {}}>
                  {l}
                </button>
              ))}
            </div>
            <input value={form.address_line} onChange={e => setForm(f => ({ ...f, address_line: e.target.value }))} placeholder="House/Flat, Street, Area" className={inputCls(errors.address_line)} />
            {errors.address_line && <p className="text-red-500 text-xs -mt-2">{errors.address_line}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className={inputCls(errors.city)} />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="Pincode" maxLength={6} className={inputCls(errors.pincode)} />
                {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
              <button onClick={addAddress} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center" style={{ background: '#7ED957' }}>
                {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : 'Save Address'}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : addresses.length === 0 && !adding ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#edfbdc' }}><MapPin size={24} style={{ color: '#5cb83a' }} /></div>
            <p className="font-bold text-gray-700">No addresses saved</p>
            <p className="text-sm text-gray-400 mt-1">Add your first delivery address</p>
          </div>
        ) : addresses.map(addr => (
          <div key={addr.id} className={`bg-white rounded-2xl border p-4 shadow-card flex items-start gap-3 ${addr.is_default ? 'border-brand/30' : 'border-gray-100'}`}
            style={addr.is_default ? { boxShadow: '0 0 0 2px rgba(126,217,87,0.15)' } : {}}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#edfbdc' }}>
              <MapPin size={16} style={{ color: '#5cb83a' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-gray-900">{addr.label}</p>
                {addr.is_default && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#7ED957' }}>DEFAULT</span>}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{addr.address_line}, {addr.city} - {addr.pincode}</p>
              {!addr.is_default && (
                <button onClick={() => setDefault(addr.id)} className="text-xs font-semibold mt-1.5 flex items-center gap-1" style={{ color: '#5cb83a' }}>
                  <Check size={11} /> Set as default
                </button>
              )}
            </div>
            <button onClick={() => deleteAddress(addr.id)} className="p-2 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
