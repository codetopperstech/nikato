import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, radius_km = 5 } = await req.json();
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Try PostGIS RPC first
    const { data: shops, error } = await admin.rpc('nearby_shops', {
      p_lat: lat, p_lng: lng, p_radius_m: Math.min(radius_km, 50) * 1000,
    });

    if (error) {
      // PostGIS not available — fallback to all approved shops
      const { data: fallback } = await admin
        .from('shops')
        .select('*')
        .eq('is_approved', true)
        .order('name');
      return NextResponse.json({ shops: fallback ?? [] });
    }

    return NextResponse.json({ shops: shops ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
