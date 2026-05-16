'use client';
import { useState } from 'react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { cn } from '@/lib/utils';

export function OpenCloseToggle() {
  const { shopData, isOpen, setIsOpen } = useShopStore();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!shopData || loading) return;
    const next = !isOpen;
    setLoading(true);
    setIsOpen(next); // ✅ Optimistic update

    try {
      const res = await fetch('/api/shop/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsOpen(!next); // ✅ Rollback on failure
        toast.error(data.error ?? 'Failed to update shop status');
      } else {
        setIsOpen(data.is_open);
        toast.success(data.is_open ? '✅ Shop is now Open' : '🔴 Shop is now Closed');
      }
    } catch {
      setIsOpen(!next); // ✅ Rollback on network error
      toast.error('Network error. Please retry.');
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all',
        isOpen ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200',
        loading && 'opacity-60 pointer-events-none'
      )}
    >
      <span className={cn('relative w-10 h-5 rounded-full transition-colors', isOpen ? 'bg-green-500' : 'bg-gray-300')}>
        <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', isOpen ? 'translate-x-5' : 'translate-x-0.5')} />
      </span>
      {loading ? 'Updating…' : isOpen ? 'Open — accepting orders' : 'Closed — not accepting orders'}
    </button>
  );
}
