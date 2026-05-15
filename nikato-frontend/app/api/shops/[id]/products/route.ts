import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = getAdminClient();

  const [{ data: shop }, { data: products }, { data: categories }] = await Promise.all([
    admin.from('shops').select('*').eq('id', id).single(),
    admin.from('products').select('*').eq('shop_id', id).eq('is_available', true).order('sort_order').order('name'),
    admin.from('categories').select('*').eq('shop_id', id).eq('is_active', true).order('sort_order'),
  ]);

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  return NextResponse.json({ shop, products: products ?? [], categories: categories ?? [] });
}
