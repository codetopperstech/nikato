'use client';

import { Card } from '@/components/ui';
import { Info } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="p-4 lg:p-6 max-w-xl space-y-6">
      <h1 className="text-2xl font-black text-gray-900">Settings</h1>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Info size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">App Configuration</h2>
            <p className="text-sm text-gray-500">
              Platform-level settings (default commission rate, min order amount, delivery fee structure) are currently
              managed via Supabase database. Use the Supabase Studio at{' '}
              <a href="http://localhost:54323" target="_blank" rel="noreferrer" className="text-[#FF6B35] font-medium">
                localhost:54323
              </a>{' '}
              to modify these values.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-bold text-gray-700">Environment</h2>
        {[
          { label: 'Supabase URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '—' },
          { label: 'App URL', value: process.env.NEXT_PUBLIC_APP_URL ?? '—' },
          { label: 'Razorpay Key', value: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? '••••••' : 'Not set' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-gray-500">{row.label}</span>
            <span className="font-mono text-xs text-gray-700 truncate max-w-xs">{row.value}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
