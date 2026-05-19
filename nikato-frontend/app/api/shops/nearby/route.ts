import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, radius_km = 3 } = await req.json();
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    // Try PostGIS RPC, fallback to all approved shops
    const { data: shops, error } = await sb.rpc('nearby_shops', { p_lat: lat, p_lng: lng, p_radius_m: Math.min(radius_km, 50) * 1000 });
    if (error) {
      const { data: fallback } = await sb.from('shops').select('*').eq('is_approved', true).order('name');
      return NextResponse.json({ shops: fallback ?? [] });
    }
    return NextResponse.json({ shops: shops ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
