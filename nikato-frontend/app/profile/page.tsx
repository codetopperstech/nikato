'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { User, MapPin, Bell, LogOut, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validations';
import { Button, Input, Card } from '@/components/ui';
import { toast } from '@/store/ui';
import { getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile, reset } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { full_name: profile?.full_name ?? '', email: profile?.email ?? '' },
  });

  const onSave = async (data: ProfileUpdateFormData) => {
    if (!profile) return;
    setIsSaving(true);
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name, email: data.email || null })
      .eq('id', profile.id)
      .select()
      .single();
    if (error) { toast.error('Failed to update profile'); }
    else { setProfile(updated as typeof profile); toast.success('Profile updated'); setIsEditing(false); }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    reset();
    router.replace('/login');
  };

  const menuItems = [
    { icon: MapPin, label: 'Saved Addresses', href: '/profile/addresses' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-lg font-black text-gray-900">My Profile</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FFB347] flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {profile?.full_name ? getInitials(profile.full_name) : <User size={32} />}
          </div>
          <h2 className="text-xl font-black text-gray-900 mt-3">{profile?.full_name || 'User'}</h2>
          <p className="text-sm text-gray-500">{profile?.phone}</p>
        </div>

        {/* Edit form */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900">Personal Info</h3>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-xs text-[#FF6B35] font-semibold">Edit</button>
            )}
          </div>
          {isEditing ? (
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <Input label="Full Name" error={errors.full_name?.message} {...register('full_name')} />
              <Input label="Email (optional)" type="email" error={errors.email?.message} {...register('email')} />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} type="button" className="flex-1">Cancel</Button>
                <Button variant="primary" size="sm" isLoading={isSaving} type="submit" className="flex-1">Save</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-900">{profile?.full_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900">{profile?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{profile?.email || '—'}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Menu */}
        <Card>
          {menuItems.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${i > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <item.icon size={18} className="text-gray-500" />
              <span className="flex-1 text-sm font-medium text-gray-900">{item.label}</span>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          ))}
        </Card>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-100 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
