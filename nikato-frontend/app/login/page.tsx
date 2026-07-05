'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // still used for OTP send/verify
import { ArrowRight, Phone, Lock, CheckCircle } from 'lucide-react';

type Step = 'phone' | 'otp' | 'welcome' | 'onboarding';
interface OnboardingForm { full_name: string; email: string; address_line: string; city: string; pincode: string; }

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [welcomeName, setWelcomeName] = useState('');
  const [userId, setUserId] = useState('');
  const [form, setForm] = useState<OnboardingForm>({ full_name: '', email: '', address_line: '', city: '', pincode: '' });
  const [formErrors, setFormErrors] = useState<Partial<OnboardingForm>>({});

  const sendOtp = async () => {
    if (!phone.trim()) { setError('Enter your phone number'); return; }
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
      setUserId(data.user.id);
      const res = await fetch('/api/auth/me');
      const profile = res.ok ? await res.json() : null;
      const role = profile?.role;
      if (role === 'admin') { router.push('/admin'); return; }
      if (role === 'shop_owner') { router.push('/shop'); return; }
      if (role === 'delivery') { router.push('/delivery'); return; }
      if (profile?.full_name?.trim()) { setWelcomeName(profile.full_name); setStep('welcome'); setTimeout(() => router.push('/'), 2000); }
      else setStep('onboarding');
    }
    setIsLoading(false);
  };

  const validateForm = () => {
    const errs: Partial<OnboardingForm> = {};
    if (!form.full_name.trim()) errs.full_name = 'Required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.address_line.trim()) errs.address_line = 'Required';
    if (!form.city.trim()) errs.city = 'Required';
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = '6-digit pincode';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitOnboarding = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    const { error: pe } = await supabase.from('profiles').update({ full_name: form.full_name.trim(), email: form.email.trim() || null }).eq('id', userId);
    if (pe) { setError('Failed to save. Please retry.'); setIsLoading(false); return; }
    await supabase.from('addresses').insert({ user_id: userId, label: 'Home', address_line: form.address_line.trim(), city: form.city.trim(), pincode: form.pincode.trim(), lat: 0, lng: 0, is_default: true });
    router.push('/');
  };

  const field = (key: keyof OnboardingForm, value: string) => { setForm(f => ({ ...f, [key]: value })); if (formErrors[key]) setFormErrors(e => ({ ...e, [key]: undefined })); };

  const inputCls = (err?: string) => `w-full border-[1.5px] rounded-xl px-4 py-3 text-sm outline-none transition-all ${err ? 'border-red-400 bg-red-50/50' : 'border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/15'}`;

  if (step === 'welcome') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(160deg, #f0fce8 0%, #e8f6ff 100%)' }}>
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-sm text-center animate-pop-in">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#7ED957' }}>
          <CheckCircle className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back!</h2>
        <p className="text-gray-500 text-sm">{welcomeName}</p>
        <p className="text-xs text-gray-300 mt-4">Taking you home…</p>
        <div className="mt-3 flex justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7ED957', borderTopColor: 'transparent' }} />
        </div>
      </div>
    </div>
  );

  if (step === 'onboarding') return (
    <div className="min-h-screen px-4 py-8 flex items-start justify-center" style={{ background: '#F9FBF8' }}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-black text-gray-900">Welcome to nikato!</h2>
          <p className="text-gray-400 text-sm mt-1">Quick setup — takes 30 seconds</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Your Name *</label>
            <input value={form.full_name} onChange={e => field('full_name', e.target.value)} placeholder="Arjun Sharma" className={inputCls(formErrors.full_name)} />
            {formErrors.full_name && <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Email <span className="font-normal text-gray-400">(optional)</span></label>
            <input type="email" value={form.email} onChange={e => field('email', e.target.value)} placeholder="you@example.com" className={inputCls(formErrors.email)} />
            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
          </div>
          <div className="pt-2 border-t border-gray-100">
            <label className="text-xs font-semibold text-gray-600 block mb-3">📍 Default Delivery Address *</label>
            <div className="space-y-3">
              <div>
                <input value={form.address_line} onChange={e => field('address_line', e.target.value)} placeholder="House/Flat, Street, Area" className={inputCls(formErrors.address_line)} />
                {formErrors.address_line && <p className="text-red-500 text-xs mt-1">{formErrors.address_line}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input value={form.city} onChange={e => field('city', e.target.value)} placeholder="City" className={inputCls(formErrors.city)} />
                  {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
                </div>
                <div>
                  <input value={form.pincode} onChange={e => field('pincode', e.target.value)} placeholder="Pincode" maxLength={6} className={inputCls(formErrors.pincode)} />
                  {formErrors.pincode && <p className="text-red-500 text-xs mt-1">{formErrors.pincode}</p>}
                </div>
              </div>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl text-center">{error}</p>}
          <button onClick={submitOnboarding} disabled={isLoading} className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.35)' }}>
            {isLoading ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><ArrowRight size={16} /> Start Shopping</>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(160deg, #f0fce8 0%, #e8f6ff 100%)' }}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 animate-pop-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#7ED957' }}>
            <span className="text-white text-2xl font-black">N</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">nikato</h1>
          <p className="text-gray-400 text-sm mt-1">Your neighbourhood, delivered</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" placeholder="+91 XXXXX XXXXX" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendOtp()} className="w-full pl-10 pr-4 py-3.5 border-[1.5px] border-gray-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all" />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl text-center">{error}</p>}
            <button onClick={sendOtp} disabled={isLoading || !phone} className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.35)' }}>
              {isLoading ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-surface-2 p-3 rounded-xl text-sm text-gray-600">
              <CheckCircle size={16} style={{ color: '#7ED957' }} />
              OTP sent to <strong>{phone}</strong>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Enter OTP</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" inputMode="numeric" placeholder="• • • • • •" value={otp} onChange={e => setOtp(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyOtp()} maxLength={6} className="w-full pl-10 pr-4 py-3.5 border-[1.5px] border-gray-200 rounded-xl text-lg tracking-[0.3em] text-center outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all font-bold" />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl text-center">{error}</p>}
            <button onClick={verifyOtp} disabled={isLoading || otp.length < 4} className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.35)' }}>
              {isLoading ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <>Verify & Continue <ArrowRight size={16} /></>}
            </button>
            <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">← Change number</button>
          </div>
        )}
      </div>
    </div>
  );
}
