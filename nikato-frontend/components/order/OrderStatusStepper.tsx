// ============================================================
// NIKATO — components/order/OrderStatusStepper.tsx + OrderCard.tsx
// Blueprint Section 07 & 12
// ============================================================

'use client';

import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Package,
  Bike,
  HomeIcon,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import {
  formatPrice,
  formatOrderDate,
  getOrderStatusLabel,
  getOrderStatusStep,
  cn,
} from '@/lib/utils';
import type { Order } from '@/types';

// ── Status Step Config ────────────────────────────────────────

const STATUS_STEPS = [
  { key: 'pending', label: 'Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: Package },
  { key: 'picked_up', label: 'On the way', icon: Bike },
  { key: 'delivered', label: 'Delivered', icon: HomeIcon },
];

// ── OrderStatusStepper ────────────────────────────────────────

interface OrderStatusStepperProps {
  status: string;
}

export function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  const isTerminal = status === 'cancelled' || status === 'rejected';

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2 bg-red-50 rounded-xl p-4">
        <XCircle size={20} className="text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">
            {status === 'cancelled' ? 'Order Cancelled' : 'Order Rejected'}
          </p>
          <p className="text-xs text-red-500">
            {status === 'rejected'
              ? 'The shop rejected your order.'
              : 'This order has been cancelled.'}
          </p>
        </div>
      </div>
    );
  }

  const currentStep = getOrderStatusStep(status);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0">
          <div
            className="h-full bg-[#FF6B35] transition-all duration-500"
            style={{
              width: `${Math.max(0, (currentStep / (STATUS_STEPS.length - 1)) * 100)}%`,
            }}
          />
        </div>

        {STATUS_STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center gap-1.5 z-10 flex-1"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  isDone || isActive
                    ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                    : 'bg-white border-gray-200 text-gray-400'
                )}
              >
                <StepIcon size={16} />
              </div>
              <span
                className={cn(
                  'text-[10px] text-center leading-tight',
                  isActive ? 'text-[#FF6B35] font-bold' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current status label */}
      <p className="text-center text-sm font-semibold text-gray-700 mt-4">
        {getOrderStatusLabel(status)}
      </p>
    </div>
  );
}

// ── OrderCard ─────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  shopName?: string;
}

export function OrderCard({ order, shopName }: OrderCardProps) {
  const isActive = !['delivered', 'cancelled', 'rejected'].includes(order.status);

  const statusBadgeVariant = {
    delivered: 'success',
    cancelled: 'danger',
    rejected: 'danger',
    pending: 'warning',
    confirmed: 'info',
    preparing: 'info',
    ready: 'info',
    picked_up: 'info',
  }[order.status] as 'success' | 'danger' | 'warning' | 'info' | 'default';

  return (
    <Link href={`/orders/${order.id}`} className="block group">
      <Card className="p-4 hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-mono text-gray-500">
              {order.order_number}
            </span>
            {shopName && (
              <p className="text-sm font-bold text-gray-900 mt-0.5">{shopName}</p>
            )}
          </div>
          <Badge variant={statusBadgeVariant}>
            {getOrderStatusLabel(order.status)}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs">
            {formatOrderDate(order.created_at)}
          </span>
          <span className="font-bold text-gray-900">
            {formatPrice(order.total_amount)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 capitalize">
            {order.payment_method === 'COD' ? 'Cash on delivery' : 'Online payment'}
          </span>
          {isActive && (
            <span className="text-xs text-[#FF6B35] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
              Live tracking →
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
