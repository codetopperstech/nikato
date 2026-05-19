import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ products: [] });
  // Public search — anon key is fine, RLS allows public product reads for approved shops
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await sb.from('products').select('id,name,price,image_url,is_veg,shop_id,shops!shop_id(name,is_open,is_approved)').eq('is_available', true).ilike('name', `%${q}%`).limit(30);
  const products = (data ?? []).filter((p: any) => p.shops?.is_approved);
  return NextResponse.json({ products });
}
