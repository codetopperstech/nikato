import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Public endpoint — anon key with RLS (approved shops + available products)
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [{ data: shop }, { data: products }, { data: categories }] = await Promise.all([
    sb.from('shops').select('*').eq('id', id).eq('is_approved', true).single(),
    sb.from('products').select('*').eq('shop_id', id).eq('is_available', true).order('name'),
    sb.from('categories').select('*').eq('shop_id', id).eq('is_active', true).order('sort_order'),
  ]);
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  return NextResponse.json({ shop, products: products ?? [], categories: categories ?? [] });
}
