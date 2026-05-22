'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, MapPin, Bell, LogOut, ChevronRight, Edit3, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/ui';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile, reset } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [email, setEmail] = useState((profile?.email as string) ?? '');

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase.from('profiles')
      .update({ full_name: name.trim(), email: email.trim() || null })
      .eq('id', profile!.id).select('*').single();
    if (error) { toast.error('Failed to save'); }
    else { setProfile(data as any); setEditing(false); toast.success('Profile updated'); }
    setSaving(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    reset();
    router.push('/');
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="min-h-screen pb-10" style={{ background: '#F9FBF8' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-surface-2 transition-colors">
          <ChevronRight size={20} className="text-gray-700 rotate-180" />
        </button>
        <h1 className="text-base font-black text-gray-900 flex-1">My Profile</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="p-2 rounded-xl hover:bg-surface-2 transition-colors">
            <Edit3 size={18} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Avatar + name */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 text-center shadow-card">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-black text-white" style={{ background: 'linear-gradient(135deg, #7ED957, #5cb83a)' }}>
            {initials}
          </div>
          {editing ? (
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                className="w-full text-center border-[1.5px] border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" type="email"
                className="w-full text-center border-[1.5px] border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm font-semibold text-gray-600 flex items-center justify-center gap-1">
                  <X size={14} /> Cancel
                </button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1 disabled:opacity-60" style={{ background: '#7ED957' }}>
                  {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Check size={14} /> Save</>}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-black text-gray-900">{profile?.full_name || 'No name set'}</h2>
              <p className="text-sm text-gray-400 mt-1">{profile?.phone}</p>
              {profile?.email && <p className="text-xs text-gray-400">{profile.email as string}</p>}
              <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full capitalize" style={{ background: '#edfbdc', color: '#3a7a1f' }}>{profile?.role ?? 'customer'}</span>
            </>
          )}
        </div>

        {/* Menu links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {[
            { href: '/profile/addresses', icon: MapPin, label: 'Saved Addresses', sub: 'Manage delivery locations' },
            { href: '/notifications', icon: Bell, label: 'Notifications', sub: 'Order updates & alerts' },
            { href: '/orders', icon: ChevronRight, label: 'My Orders', sub: 'Track and reorder' },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href} className="flex items-center gap-3 px-4 py-4 hover:bg-surface-2 transition-colors border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#edfbdc' }}>
                <Icon size={16} style={{ color: '#5cb83a' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button onClick={logout} className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-card hover:bg-red-50 transition-colors">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
            <LogOut size={16} className="text-red-500" />
          </div>
          <span className="text-sm font-semibold text-red-500">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
