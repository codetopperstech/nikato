// ============================================================
// NIKATO — app/otp/page.tsx
// OTP verification — Step 2: Enter 6-digit code
// Blueprint Section 05
// ============================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { Shield, ArrowLeft } from 'lucide-react';
import { toast } from '@/store/ui';

export default function OTPPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('nikato_otp_email');
    if (!stored) {
      router.replace('/login');
      return;
    }
    setEmail(stored);
    startCountdown();
  }, [router]);

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = Array.from({ length: 6 }, (_, i) => text[i] ?? '');
    setOtp(newOtp);
    if (text.length === 6) handleVerify(text);
  };

  const handleVerify = async (token: string) => {
    if (token.length !== 6) return;
    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        toast.error('Invalid OTP', 'Please check and try again');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      toast.success('Logged in successfully!');
      sessionStorage.removeItem('nikato_otp_email');

      // Redirect based on role
      const role = data.session?.user?.app_metadata?.user_role;
      if (role === 'shop_owner') router.replace('/shop');
      else if (role === 'delivery') router.replace('/delivery');
      else if (role === 'admin') router.replace('/admin');
      else router.replace('/shops');
    } catch {
      toast.error('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      toast.error('Failed to resend OTP');
    } else {
      toast.success('OTP resent!');
      startCountdown();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFF0E8]">
      {/* Back button */}
      <div className="p-4">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Shield size={32} className="text-[#FF6B35]" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 text-center mb-1">
            Enter OTP
          </h2>
          <p className="text-sm text-gray-500 text-center mb-2">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-bold text-gray-900 text-center mb-8">
            {email}
          </p>

          {/* OTP inputs */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 focus:outline-none transition-all bg-white text-gray-900"
              />
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
            onClick={() => handleVerify(otp.join(''))}
            disabled={otp.some((d) => !d)}
          >
            Verify OTP
          </Button>

          {/* Resend */}
          <div className="text-center mt-4">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-sm text-[#FF6B35] font-semibold hover:underline"
              >
                Resend OTP
              </button>
            ) : (
              <p className="text-sm text-gray-400">
                Resend in <span className="font-semibold text-gray-600">{countdown}s</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
