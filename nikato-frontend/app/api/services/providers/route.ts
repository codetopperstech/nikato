import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

// GET /api/services/providers?service=plumber&city=Pune
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get('service');
  const city = searchParams.get('city') || '';

  if (!service) return NextResponse.json({ error: 'service is required' }, { status: 400 });

  const db = adminClient();

  let q = db.from('service_providers').select('*').eq('service_type', service).eq('is_available', true);
  if (city) q = q.ilike('city', `%${city}%`);
  const { data: providers } = await q.order('rating', { ascending: false });

  const { data: priceRow } = await db.from('service_prices').select('base_price, unit').eq('service_type', service).single();

  return NextResponse.json({
    providers: providers ?? [],
    price: priceRow?.base_price ?? null,
    unit: priceRow?.unit ?? 'visit',
  });
}
