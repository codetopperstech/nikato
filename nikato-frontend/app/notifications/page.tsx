'use client';
import Link from 'next/link';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationBell';
import { Skeleton } from '@/components/ui';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead, isLoading } = useNotifications();

  return (
    <div className="min-h-screen" style={{ background: '#F9FBF8' }}>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3">
        <Link href="/profile" className="p-2 rounded-xl hover:bg-surface-2 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-base font-black text-gray-900 flex-1">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead()} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors" style={{ color: '#5cb83a', background: '#edfbdc' }}>
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#edfbdc' }}>
              <Bell size={28} style={{ color: '#5cb83a' }} />
            </div>
            <p className="font-bold text-gray-700">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => <NotificationItem key={n.id} notification={n} onRead={() => {}} />)}
          </div>
        )}
      </div>
    </div>
  );
}
