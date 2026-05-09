'use client';

import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationBell';
import { Button, Skeleton } from '@/components/ui';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead, markRead, isLoading } = useNotifications();

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/profile" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-lg font-black text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead()} className="ml-auto text-xs text-[#FF6B35] font-semibold hover:underline">
            Mark all read
          </button>
        )}
      </div>

      <div className="max-w-lg mx-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <Bell size={56} className="text-gray-200 mb-4" />
            <p className="text-gray-600 font-semibold">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">Order updates and promotions will appear here</p>
          </div>
        ) : (
          <div className="bg-white divide-y divide-gray-100 mt-2 rounded-2xl mx-4 overflow-hidden shadow-sm border border-gray-100">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={markRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
