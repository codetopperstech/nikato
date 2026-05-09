// ============================================================
// NIKATO — app/login/page.tsx
// Phone + OTP login — Step 1: Enter phone number
// Blueprint Section 05: Supabase Auth Flow
// ============================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase/client';
import { loginSchema, type AddressFormData } from '@/lib/validations';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { Phone, ArrowRight } from 'lucide-react';
import { toast } from '@/store/ui';

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '+91' },
  });

  const phone = watch('phone');

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: data.phone,
      });

      if (error) {
        toast.error('Failed to send OTP', error.message);
        return;
      }

      // Store phone in sessionStorage for OTP page
      sessionStorage.setItem('nikato_otp_phone', data.phone);
      router.push('/otp');
    } catch {
      toast.error('Something went wrong', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFF0E8]">
      {/* Header visual */}
      <div className="relative flex-shrink-0 h-56 bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-3 drop-shadow-lg">🛵</div>
            <h1 className="text-3xl font-black tracking-tight drop-shadow">NIKATO</h1>
            <p className="text-sm font-medium opacity-80 mt-1">
              Hyperlocal Delivery
            </p>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-8 w-48 h-48 rounded-full bg-white/10" />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-black text-gray-900 mb-1">
            Welcome back 👋
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Enter your mobile number to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Mobile number"
              type="tel"
              placeholder="+91XXXXXXXXXX"
              leftAddon={<Phone size={16} />}
              error={errors.phone?.message}
              hint="Format: +91 followed by 10-digit mobile number"
              {...register('phone')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight size={16} />}
            >
              Get OTP
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Standard SMS rates may apply.
          </p>
        </div>
      </div>
    </div>
  );
}
