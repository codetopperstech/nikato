'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useDeliveryStore } from '@/store/delivery';
import { toast } from '@/store/ui';
import { Button } from '@/components/ui';
import type { Order } from '@/types';

interface PickupActionProps {
  orderId: string;
  onSuccess?: () => void;
}

export function PickupAction({ orderId, onSuccess }: PickupActionProps) {
  const [loading, setLoading] = useState(false);
  const { setCurrentDelivery } = useDeliveryStore();

  async function handlePickup() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'picked_up' })
      .eq('id', orderId)
      .select('*')
      .single();
    if (error) {
      toast.error('Failed to confirm pickup');
    } else {
      setCurrentDelivery(data as unknown as Order);
      toast.success('Picked up! Head to customer address.');
      onSuccess?.();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      isLoading={loading}
      leftIcon={<Package size={18} />}
      onClick={handlePickup}
    >
      Confirm Pickup
    </Button>
  );
}
