'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/store/ui';
import { Button, Input, Card } from '@/components/ui';

const schema = z.object({
  phone: z.string().min(10, 'Phone required (+91...)'),
  full_name: z.string().min(2, 'Name required'),
});

type FormValues = z.infer<typeof schema>;

export default function AdminCreateDeliveryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    // Find existing profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', values.phone)
      .maybeSingle();

    if (!profile) {
      toast.error('User not found', 'The user must first register via OTP on the app');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'delivery', full_name: values.full_name })
      .eq('id', profile.id);

    if (error) {
      toast.error('Failed to assign delivery role', error.message);
    } else {
      toast.success('Delivery partner created!');
      router.push('/admin/delivery-partners');
    }
    setSaving(false);
  }

  return (
    <div className="p-4 lg:p-6 max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/delivery-partners" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-xl font-black text-gray-900">Create Delivery Partner</h1>
      </div>

      <Card className="p-5">
        <p className="text-sm text-gray-500 mb-4">
          The user must first register on the app via phone OTP. Enter their registered phone number to assign the delivery partner role.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Phone Number (+91...)"
            placeholder="+919876543210"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <Input
            label="Full Name"
            {...register('full_name')}
            error={errors.full_name?.message}
          />
          <Button type="submit" variant="primary" className="w-full" isLoading={saving}>
            Assign Delivery Role
          </Button>
        </form>
      </Card>
    </div>
  );
}
