// ============================================================
// NIKATO — lib/utils.ts
// Shared utility functions
// ============================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price in INR */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format distance in human-readable form */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** Format relative time */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/** Format order date */
export function formatOrderDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));
}

/** Get delivery ETA string */
export function formatETA(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Get order status label */
export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Awaiting Confirmation',
    confirmed: 'Order Confirmed',
    preparing: 'Preparing Your Order',
    ready: 'Ready for Pickup',
    picked_up: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    rejected: 'Rejected by Shop',
  };
  return labels[status] ?? status;
}

/** Get order status step index (0-based, for stepper UI) */
export function getOrderStatusStep(status: string): number {
  const steps = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];
  return steps.indexOf(status);
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '…';
}

/** Calculate discount percentage */
export function discountPercent(price: number, mrp: number): number {
  if (mrp <= 0 || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/** Validate E.164 phone format */
export function isValidPhone(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

/** Sleep utility for dev/testing */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate initials from name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}
