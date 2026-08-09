import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, address, service_type, scheduled_date, scheduled_time, notes, provider_id } = await req.json();

    if (!name?.trim())          return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!phone?.trim())         return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    if (!address?.trim())       return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    if (!service_type)          return NextResponse.json({ error: 'Service type is required' }, { status: 400 });
    if (!scheduled_date || !scheduled_time) return NextResponse.json({ error: 'Date and time are required' }, { status: 400 });

    const db = adminClient();
    const scheduled_at = new Date(`${scheduled_date}T${scheduled_time}:00`).toISOString();

    // Fetch current price for this service
    const { data: priceRow } = await db.from('service_prices').select('base_price').eq('service_type', service_type).single();

    const { data, error } = await db.from('service_bookings').insert({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      service_type,
      scheduled_at,
      notes: notes?.trim() || null,
      provider_id: provider_id || null,
      price: priceRow?.base_price ?? null,
    }).select('id').single();

    if (error) {
      console.error('service_bookings insert error:', error);
      return NextResponse.json({ error: 'Failed to create booking. Please try again.' }, { status: 500 });
    }

    // Notify all admins
    const { data: admins } = await db.from('profiles').select('id').eq('role', 'admin');
    if (admins?.length) {
      const serviceLabel = service_type.charAt(0).toUpperCase() + service_type.slice(1);
      await db.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          title: `New ${serviceLabel} Booking`,
          body: `${name.trim()} booked a ${serviceLabel} for ${new Date(scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.`,
          type: 'SYSTEM',
          data: { booking_id: data.id, service_type },
        }))
      );
    }

    return NextResponse.json({ booking_id: data.id }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
