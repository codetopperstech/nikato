'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type Step = 'phone' | 'otp' | 'welcome' | 'onboarding';

interface OnboardingForm {
  full_name: string;
  email: string;
  address_line: string;
  city: string;
  pincode: string;
}

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
    if (error) setError(error.message);
    else setStep('otp');
    setIsLoading(false);
  };

  const verifyOtp = async () => {
    setIsLoading(true); setError('');
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    if (error) { setError(error.message); setIsLoading(false); return; }

    if (data.user) {
      const uid = data.user.id;
      setUserId(uid);

      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', uid).single();
      const role = profile?.role;

      // Non-customer roles — redirect directly
      if (role === 'admin') { router.push('/admin'); return; }
      if (role === 'shop_owner') { router.push('/shop'); return; }
      if (role === 'delivery') { router.push('/delivery'); return; }

      // Customer — check if new or existing
      if (profile?.full_name?.trim()) {
        // ✅ Existing customer — Welcome back
        setWelcomeName(profile.full_name);
        setStep('welcome');
        setTimeout(() => router.push('/'), 2000);
      } else {
        // ✅ New customer — collect details
        setStep('onboarding');
      }
    }
    setIsLoading(false);
  };

  const validateForm = (): boolean => {
    const errs: Partial<OnboardingForm> = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.address_line.trim()) errs.address_line = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) errs.pincode = 'Valid 6-digit pincode required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitOnboarding = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    // Save profile
    const { error: profileErr } = await supabase.from('profiles').update({
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
    }).eq('id', userId);

    if (profileErr) { setError('Failed to save profile. Please try again.'); setIsLoading(false); return; }

    // Save address
    await supabase.from('addresses').insert({
      user_id: userId,
      label: 'Home',
      address_line: form.address_line.trim(),
      city: form.city.trim(),
      pincode: form.pincode.trim(),
      lat: 0, lng: 0,
      is_default: true,
    });

    router.push('/');
  };

  const handleChange = (field: keyof OnboardingForm, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (formErrors[field]) setFormErrors(e => ({ ...e, [field]: undefined }));
  };

  // ─── Render ───────────────────────────────────────────────

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-500 text-sm">{welcomeName}</p>
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (step === 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 px-4 py-8 flex items-start justify-center">
        <div className="bg-white p-7 rounded-2xl shadow-xl w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-xl font-black text-gray-900">Welcome to NIKATO!</h2>
            <p className="text-gray-400 text-sm mt-1">Let's set up your account</p>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name *</label>
              <input value={form.full_name} onChange={e => handleChange('full_name', e.target.value)}
                placeholder="Arjun Sharma"
                className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${formErrors.full_name ? 'border-red-400' : 'border-gray-200'}`} />
              {formErrors.full_name && <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                placeholder="arjun@example.com"
                className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${formErrors.email ? 'border-red-400' : 'border-gray-200'}`} />
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-600 mb-3">📍 Delivery Address *</p>

              {/* Address Line */}
              <div className="mb-3">
                <input value={form.address_line} onChange={e => handleChange('address_line', e.target.value)}
                  placeholder="House/Flat No., Street, Area"
                  className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${formErrors.address_line ? 'border-red-400' : 'border-gray-200'}`} />
                {formErrors.address_line && <p className="text-red-500 text-xs mt-1">{formErrors.address_line}</p>}
              </div>

              {/* City + Pincode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input value={form.city} onChange={e => handleChange('city', e.target.value)}
                    placeholder="City"
                    className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${formErrors.city ? 'border-red-400' : 'border-gray-200'}`} />
                  {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
                </div>
                <div>
                  <input value={form.pincode} onChange={e => handleChange('pincode', e.target.value)}
                    placeholder="Pincode" maxLength={6}
                    className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${formErrors.pincode ? 'border-red-400' : 'border-gray-200'}`} />
                  {formErrors.pincode && <p className="text-red-500 text-xs mt-1">{formErrors.pincode}</p>}
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}

            <button onClick={submitOnboarding} disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-3 font-bold disabled:opacity-50 transition">
              {isLoading ? 'Saving...' : 'Start Shopping →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Phone + OTP steps (unchanged) ───────────────────────

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
              <input type="tel" placeholder="+91XXXXXXXXXX" value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
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
            <div className="text-center text-sm text-gray-500 bg-green-50 p-3 rounded-xl">
              ✅ OTP sent to <strong>{phone}</strong>
            </div>
            <input type="text" placeholder="Enter OTP" value={otp}
              onChange={e => setOtp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              maxLength={6}
              className="w-full border border-gray-200 rounded-xl p-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-300" />
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
            <button onClick={verifyOtp} disabled={isLoading || otp.length < 4}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-3 font-semibold disabled:opacity-50 transition">
              {isLoading ? 'Verifying...' : 'Verify & Login →'}
            </button>
            <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full text-gray-400 text-sm hover:text-gray-600">
              ← Change number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
