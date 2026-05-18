import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ products: [] });

  const a = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data } = await a.from('products')
    .select('id, name, description, price, mrp, image_url, is_veg, is_available, stock, shop_id, shops!shop_id(name, is_open, is_approved)')
    .eq('is_available', true).ilike('name', `%${q}%`).limit(30);

  const products = (data ?? []).filter((p: any) => p.shops?.is_approved && p.shops?.is_open);
  return NextResponse.json({ products });
}
