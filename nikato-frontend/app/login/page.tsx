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
    setIsLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) setError(error.message); else setStep('otp');
    setIsLoading(false);
  };

  const verifyOtp = async () => {
    setIsLoading(true); setError('');
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    if (error) { setError(error.message); setIsLoading(false); return; }

    if (data.user) {
      // Fetch role and redirect
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      const role = profile?.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'shop_owner') router.push('/shop');
      else if (role === 'delivery') router.push('/delivery');
      else router.push('/');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-500">NIKATO</h1>
          <p className="text-gray-500 text-sm mt-1">Your neighbourhood, delivered</p>
        </div>
        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Phone Number</label>
              <input type="tel" placeholder="+91XXXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
            <button onClick={sendOtp} disabled={isLoading || !phone}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-3 font-semibold disabled:opacity-50 transition">
              {isLoading ? 'Sending...' : 'Send OTP →'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-500 bg-green-50 p-3 rounded-xl">✅ OTP sent to <strong>{phone}</strong></div>
            <input type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
              className="w-full border border-gray-200 rounded-xl p-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-300" />
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
            <button onClick={verifyOtp} disabled={isLoading || otp.length < 4}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-3 font-semibold disabled:opacity-50 transition">
              {isLoading ? 'Verifying...' : 'Verify & Login →'}
            </button>
            <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full text-gray-400 text-sm hover:text-gray-600">← Change number</button>
          </div>
        )}
      </div>
    </div>
  );
}
