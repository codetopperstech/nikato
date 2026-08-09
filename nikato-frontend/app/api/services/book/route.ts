import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, address, service_type, scheduled_date, scheduled_time, notes } = await req.json();

    if (!name?.trim())          return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!phone?.trim())         return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    if (!address?.trim())       return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    if (!service_type)          return NextResponse.json({ error: 'Service type is required' }, { status: 400 });
    if (!scheduled_date || !scheduled_time) return NextResponse.json({ error: 'Date and time are required' }, { status: 400 });

    const scheduled_at = new Date(`${scheduled_date}T${scheduled_time}:00`).toISOString();

    const { data, error } = await adminClient()
      .from('service_bookings')
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        service_type,
        scheduled_at,
        notes: notes?.trim() || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('service_bookings insert error:', error);
      return NextResponse.json({ error: 'Failed to create booking. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ booking_id: data.id }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
