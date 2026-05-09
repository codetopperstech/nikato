'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useDeliveryStore } from '@/store/delivery';
import { toast } from '@/store/ui';
import { Button } from '@/components/ui';

interface DeliverActionProps {
  orderId: string;
  onSuccess?: () => void;
}

export function DeliverAction({ orderId, onSuccess }: DeliverActionProps) {
  const [loading, setLoading] = useState(false);
  const { setCurrentDelivery } = useDeliveryStore();

  async function handleDeliver() {
    setLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId);
    if (error) {
      toast.error('Failed to mark as delivered');
    } else {
      setCurrentDelivery(null);
      toast.success('Delivery complete! Great work.');
      onSuccess?.();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full bg-green-500 hover:bg-green-600"
      isLoading={loading}
      leftIcon={<CheckCircle size={18} />}
      onClick={handleDeliver}
    >
      Mark as Delivered
    </Button>
  );
}
