'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, MapPin, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { addressSchema, type AddressFormData } from '@/lib/validations';
import { Button, Input, Card, Modal, Skeleton } from '@/components/ui';
import { toast } from '@/store/ui';
import { cn } from '@/lib/utils';
import type { Address } from '@/types';

async function fetchAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Address[];
}

export default function AddressesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: () => fetchAddresses(user!.id),
    enabled: !!user,
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: 'Home', city: '', pincode: '', address_line: '', lat: 0, lng: 0, is_default: false },
  });

  const addMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const { error } = await supabase.from('addresses').insert({ ...data, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
      toast.success('Address added');
      setIsAdding(false);
      reset();
    },
    onError: () => toast.error('Failed to add address'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
      toast.success('Address removed');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
      await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] }),
  });

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/profile" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-lg font-black text-gray-900">Saved Addresses</h1>
        <button onClick={() => setIsAdding(true)} className="ml-auto p-2 rounded-xl bg-[#FF6B35] text-white">
          <Plus size={18} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : addresses.length === 0 ? (
          <div className="text-center py-16">
            <MapPin size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-600 font-semibold">No addresses saved</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Add your home or work address for faster checkout</p>
            <Button variant="primary" onClick={() => setIsAdding(true)}>Add Address</Button>
          </div>
        ) : (
          addresses.map((addr) => (
            <Card key={addr.id} className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={16} className="text-[#FF6B35]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{addr.label}</span>
                  {addr.is_default && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{addr.address_line}, {addr.city} - {addr.pincode}</p>
              </div>
              <div className="flex items-center gap-1">
                {!addr.is_default && (
                  <button onClick={() => setDefaultMutation.mutate(addr.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" title="Set as default">
                    <Star size={14} />
                  </button>
                )}
                <button onClick={() => deleteMutation.mutate(addr.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add address modal */}
      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Add Address">
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {['Home', 'Work', 'Other'].map((l) => (
              <button key={l} type="button" onClick={() => setValue('label', l)}
                className={cn('py-2 rounded-xl text-sm font-semibold border-2 transition-all', 'Home' === l ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]' : 'border-gray-200 text-gray-600')}>
                {l}
              </button>
            ))}
          </div>
          <Input label="Address Line" placeholder="House / Flat / Street" error={errors.address_line?.message} {...register('address_line')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" placeholder="City" error={errors.city?.message} {...register('city')} />
            <Input label="Pincode" placeholder="6-digit pincode" error={errors.pincode?.message} {...register('pincode')} />
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            📍 Lat/lng will be auto-detected from pincode in production via geocoding API.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="md" onClick={() => setIsAdding(false)} type="button" className="flex-1">Cancel</Button>
            <Button variant="primary" size="md" isLoading={addMutation.isPending} type="submit" className="flex-1">Save Address</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
