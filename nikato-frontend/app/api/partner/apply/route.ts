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
    const { shop_name, owner_name, phone, city, business_type, message } = await req.json();

    if (!shop_name?.trim())    return NextResponse.json({ error: 'Shop name is required' }, { status: 400 });
    if (!owner_name?.trim())   return NextResponse.json({ error: 'Owner name is required' }, { status: 400 });
    if (!phone?.trim())        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!city?.trim())         return NextResponse.json({ error: 'City is required' }, { status: 400 });
    if (!business_type?.trim()) return NextResponse.json({ error: 'Business type is required' }, { status: 400 });

    const db = adminClient();

    const { data, error } = await db
      .from('partner_requests')
      .insert({
        shop_name: shop_name.trim(),
        owner_name: owner_name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        business_type: business_type.trim(),
        message: message?.trim() || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('partner_requests insert error:', error);
      return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
    }

    // Notify all admins
    const { data: admins } = await db
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins?.length) {
      await db.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          title: 'New Partner Request',
          body: `${owner_name.trim()} wants to list "${shop_name.trim()}" on nikato.`,
          type: 'SYSTEM',
          data: { partner_request_id: data.id },
        }))
      );
    }

    return NextResponse.json({ request_id: data.id }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
