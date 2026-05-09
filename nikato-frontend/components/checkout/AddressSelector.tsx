// ============================================================
// NIKATO — components/checkout/AddressSelector.tsx
// + PaymentMethodSelector.tsx
// Blueprint Section 07
// ============================================================

'use client';

import { useState } from 'react';
import { MapPin, Plus, CheckCircle2, Banknote, CreditCard } from 'lucide-react';
import { Button, Modal, Input, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Address, PaymentMethod } from '@/types';

// ── AddressSelector ───────────────────────────────────────────

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address) => void;
  onAddNew?: () => void;
  isLoading?: boolean;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  isLoading = false,
}: AddressSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" className="text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {addresses.map((address) => (
        <button
          key={address.id}
          onClick={() => onSelect(address)}
          className={cn(
            'w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
            selectedId === address.id
              ? 'border-[#FF6B35] bg-orange-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <MapPin
            size={18}
            className={cn(
              'mt-0.5 flex-shrink-0',
              selectedId === address.id ? 'text-[#FF6B35]' : 'text-gray-400'
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{address.label}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {address.address_line}, {address.city} - {address.pincode}
            </p>
          </div>
          {selectedId === address.id && (
            <CheckCircle2 size={18} className="text-[#FF6B35] flex-shrink-0 mt-0.5" />
          )}
        </button>
      ))}

      {onAddNew && (
        <button
          onClick={onAddNew}
          className="w-full flex items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
        >
          <Plus size={16} />
          <span className="text-sm font-medium">Add new address</span>
        </button>
      )}

      {addresses.length === 0 && !onAddNew && (
        <p className="text-sm text-gray-500 text-center py-4">
          No saved addresses. Add one to continue.
        </p>
      )}
    </div>
  );
}

// ── PaymentMethodSelector ─────────────────────────────────────

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  selected,
  onChange,
}: PaymentMethodSelectorProps) {
  const options: Array<{
    value: PaymentMethod;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      value: 'ONLINE',
      label: 'Pay Online',
      description: 'UPI, Card, Net Banking via Razorpay',
      icon: <CreditCard size={20} className="text-blue-500" />,
    },
    {
      value: 'COD',
      label: 'Cash on Delivery',
      description: 'Pay when your order arrives',
      icon: <Banknote size={20} className="text-green-500" />,
    },
  ];

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
            selected === opt.value
              ? 'border-[#FF6B35] bg-orange-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            {opt.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
            <p className="text-xs text-gray-500">{opt.description}</p>
          </div>
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all',
              selected === opt.value
                ? 'border-[#FF6B35] bg-[#FF6B35]'
                : 'border-gray-300'
            )}
          >
            {selected === opt.value && (
              <div className="w-full h-full rounded-full bg-white scale-50" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
