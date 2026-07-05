'use client';
import { useState } from 'react';
import { CheckCircle, KeyRound, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useDeliveryStore } from '@/store/delivery';
import { toast } from '@/store/ui';
import { Button } from '@/components/ui';
import { getDeliveryOtp } from '@/lib/utils';

interface DeliverActionProps {
  orderId: string;
  onSuccess?: () => void;
}

export function DeliverAction({ orderId, onSuccess }: DeliverActionProps) {
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const { setCurrentDelivery } = useDeliveryStore();

  const expectedOtp = getDeliveryOtp(orderId);

  function openOtpModal() {
    setShowOtp(true);
    setOtpInput('');
    setOtpError('');
  }

  async function handleDeliver() {
    if (otpInput.trim() !== expectedOtp) {
      setOtpError('Incorrect OTP — ask the customer for the code shown in their order');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
    if (error) {
      toast.error('Failed to mark as delivered');
    } else {
      setCurrentDelivery(null);
      setShowOtp(false);
      toast.success('Delivery complete! Great work. 🎉');
      onSuccess?.();
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        leftIcon={<CheckCircle size={18} />}
        onClick={openOtpModal}
      >
        Mark as Delivered
      </Button>

      {/* OTP verification sheet */}
      {showOtp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 sheet-up">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#edfbdc' }}>
                  <KeyRound size={18} style={{ color: '#5cb83a' }} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Enter Delivery OTP</h3>
                  <p className="text-xs text-gray-400">Ask the customer for their 4-digit code</p>
                </div>
              </div>
              <button onClick={() => setShowOtp(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="• • • •"
              value={otpInput}
              onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
              className="w-full border-[1.5px] border-gray-200 rounded-xl px-4 py-4 text-2xl font-black tracking-[0.4em] text-center outline-none focus:border-[#7ED957] focus:ring-2 focus:ring-[#7ED957]/15 transition-all"
              autoFocus
            />

            {otpError && (
              <p className="text-red-500 text-xs mt-2 text-center bg-red-50 p-2 rounded-lg">{otpError}</p>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-4"
              isLoading={loading}
              disabled={otpInput.length < 4}
              leftIcon={<CheckCircle size={16} />}
              onClick={handleDeliver}
            >
              Confirm Delivery
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
