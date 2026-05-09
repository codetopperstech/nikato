'use client';

import { useAuthStore } from '@/store/auth';
import { useDeliveryStore } from '@/store/delivery';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/store/ui';
import { Card, Badge, Button } from '@/components/ui';
import { getInitials, formatPrice } from '@/lib/utils';
import { LogOut } from 'lucide-react';

export default function DeliveryProfilePage() {
  const { profile, reset: resetAuth } = useAuthStore();
  const { earnings, isOnline } = useDeliveryStore();

  async function handleSignOut() {
    await supabase.auth.signOut();
    resetAuth();
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Profile</h1>

      {/* Avatar + name */}
      <Card className="p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl font-black">
            {profile ? getInitials(profile.full_name) : '?'}
          </span>
        </div>
        <div>
          <p className="text-lg font-black text-gray-900">{profile?.full_name ?? 'Delivery Partner'}</p>
          <p className="text-sm text-gray-500">{profile?.phone}</p>
          <Badge variant={isOnline ? 'success' : 'default'} className="mt-1">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </Card>

      {/* Stats */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-bold text-gray-700">Earnings Summary</h2>
        {[
          { label: 'Today', value: formatPrice(earnings.today) },
          { label: 'This Week', value: formatPrice(earnings.week) },
          { label: 'This Month', value: formatPrice(earnings.month) },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-gray-500">{row.label}</span>
            <span className="font-bold text-gray-900">{row.value}</span>
          </div>
        ))}
      </Card>

      <Button
        variant="ghost"
        className="w-full border border-gray-200"
        leftIcon={<LogOut size={16} />}
        onClick={handleSignOut}
      >
        Sign Out
      </Button>
    </div>
  );
}
