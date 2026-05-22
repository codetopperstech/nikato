'use client';

import React, { forwardRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// ── Button ────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] select-none';

    const variants: Record<ButtonVariant, string> = {
      primary:   'bg-brand text-white hover:bg-brand-dark focus-visible:ring-brand shadow-brand rounded-xl',
      secondary: 'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-700 rounded-xl',
      ghost:     'bg-transparent text-gray-700 hover:bg-surface-2 focus-visible:ring-gray-300 rounded-xl',
      danger:    'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400 rounded-xl',
      outline:   'border-2 border-brand text-brand-dark hover:bg-brand hover:text-white focus-visible:ring-brand rounded-xl',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'text-sm px-3.5 py-2',
      md: 'text-sm px-5 py-2.5',
      lg: 'text-base px-7 py-3.5',
    };

    return (
      <button ref={ref} disabled={disabled || isLoading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {isLoading ? <Spinner size="sm" className="text-current" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ── Input ─────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">{label}</label>}
        <div className="relative flex items-center">
          {leftAddon && <div className="absolute left-3.5 text-gray-400 pointer-events-none">{leftAddon}</div>}
          <input
            ref={ref} id={inputId}
            className={cn(
              'w-full rounded-xl border-[1.5px] bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand',
              'transition-all duration-150',
              error ? 'border-red-400 bg-red-50/50' : 'border-gray-200 hover:border-gray-300',
              leftAddon && 'pl-10',
              rightAddon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightAddon && <div className="absolute right-3.5 text-gray-400">{rightAddon}</div>}
        </div>
        {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ── Badge ─────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'veg' | 'nonveg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default:  'bg-gray-100 text-gray-600',
    success:  'bg-brand-light text-green-700',
    warning:  'bg-amber-50 text-amber-700',
    danger:   'bg-red-50 text-red-600',
    info:     'bg-accent-light text-blue-700',
    veg:      'bg-brand-light text-green-700 border border-brand/30',
    nonveg:   'bg-red-50 text-red-600 border border-red-200',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', sizes[size], className)} role="status" aria-label="Loading" {...props} />;
}

// ── Card ──────────────────────────────────────────────────────

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl bg-white shadow-card border border-gray-100 overflow-hidden', className)} {...props}>
      {children}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full bg-white rounded-2xl shadow-2xl p-6 animate-slide-up', sizeClasses[size])}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={16} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();
  const icons = {
    success: <CheckCircle2 size={16} className="text-brand-dark flex-shrink-0" />,
    error:   <AlertCircle  size={16} className="text-red-500 flex-shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />,
    info:    <Info size={16} className="text-accent flex-shrink-0" />,
  };
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3 pointer-events-auto animate-slide-up mx-auto w-full max-w-sm">
          {icons[t.variant]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{t.title}</p>
            {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton', className)} {...props} />;
}

// ── EmptyState ────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-6">
      {icon && <div className="text-gray-300 mb-1 text-5xl">{icon}</div>}
      <h3 className="text-base font-bold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
