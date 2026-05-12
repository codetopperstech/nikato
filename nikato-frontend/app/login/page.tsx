'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      setError(error.message);
    } else {
      setStep('otp');
    }
    setIsLoading(false);
  };

  const verifyOtp = async () => {
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms'
    });
    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login to NIKATO</h1>

        {step === 'phone' ? (
          <div className="space-y-4">
            <input
              type="tel"
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={sendOtp}
              disabled={isLoading || !phone}
              className="w-full bg-orange-500 text-white rounded-lg p-3 font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center">OTP sent to {phone}</p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm"
              maxLength={6}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={verifyOtp}
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-orange-500 text-white rounded-lg p-3 font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={() => setStep('phone')}
              className="w-full text-gray-500 text-sm"
            >
              Change number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
