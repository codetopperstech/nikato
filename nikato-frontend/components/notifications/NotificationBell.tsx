// ============================================================
// NIKATO — components/notifications/NotificationBell.tsx
// In-app notification badge + dropdown
// Blueprint Section 16
// ============================================================

'use client';

import { useState } from 'react';
import { Bell, Package, Tag, Settings, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime, cn } from '@/lib/utils';
import type { Notification } from '@/types';

// ── NotificationItem ──────────────────────────────────────────

export function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const icons = {
    ORDER_UPDATE: <Package size={14} className="text-[#FF6B35]" />,
    PROMO: <Tag size={14} className="text-purple-500" />,
    SYSTEM: <Settings size={14} className="text-gray-500" />,
  };

  return (
    <button
      onClick={() => onRead(notification.id)}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left',
        !notification.is_read && 'bg-orange-50'
      )}
    >
      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 line-clamp-1">
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-[10px] text-gray-400 mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-1.5" />
      )}
    </button>
  );
}

// ── NotificationBell ──────────────────────────────────────────

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#FF6B35] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-[10px] text-[#FF6B35] font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={markRead}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
