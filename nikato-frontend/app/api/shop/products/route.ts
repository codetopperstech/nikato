import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getClient() {
  const c = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => c.getAll(), setAll: () => {} } });
}
async function getShopId(sb: Awaited<ReturnType<typeof getClient>>) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('shops').select('id').eq('owner_id', user.id).single();
  return data?.id ?? null;
}

export async function GET() {
  const sb = await getClient();
  const shopId = await getShopId(sb);
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await sb.from('products').select('*, category:categories(*)').eq('shop_id', shopId).order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(req: NextRequest) {
  const sb = await getClient();
  const shopId = await getShopId(sb);
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { data, error } = await sb.from('products').insert({ ...body, shop_id: shopId }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sb = await getClient();
  const shopId = await getShopId(sb);
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...updates } = await req.json();
  const { data, error } = await sb.from('products').update(updates).eq('id', id).eq('shop_id', shopId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ product: data });
}

export async function DELETE(req: NextRequest) {
  const sb = await getClient();
  const shopId = await getShopId(sb);
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const { error } = await sb.from('products').delete().eq('id', id).eq('shop_id', shopId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
