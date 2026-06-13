import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using the SERVICE ROLE key.
// This bypasses RLS so guest (anonymous) orders can be stored,
// while the browser never gets direct write access to the DB.
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type OrderItem = { id: string; name: string; price: number; qty: number };

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Невірний формат запиту' }, { status: 400 });
  }

  const customerName = String(body.customerName ?? '').trim();
  const customerPhone = String(body.customerPhone ?? '').trim();
  const comment = String(body.comment ?? '').trim();
  const paymentMethod = body.paymentMethod === 'card' ? 'card' : 'cod';
  const npArea = String(body.npArea ?? '').trim();
  const npCity = String(body.npCity ?? '').trim();
  const npCityRef = String(body.npCityRef ?? '').trim();
  const npWarehouse = String(body.npWarehouse ?? '').trim();
  const userId = body.userId ? String(body.userId) : null;
  const items = Array.isArray(body.items) ? (body.items as OrderItem[]) : [];

  // --- Validation ---
  if (customerName.length < 2) {
    return NextResponse.json({ error: 'Вкажіть ПІБ' }, { status: 400 });
  }
  const phoneDigits = customerPhone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 13) {
    return NextResponse.json({ error: 'Невірний номер телефону' }, { status: 400 });
  }
  if (!npCity || !npWarehouse) {
    return NextResponse.json({ error: 'Оберіть місто та відділення Нової Пошти' }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: 'Кошик порожній' }, { status: 400 });
  }
  if (items.length > 50) {
    return NextResponse.json({ error: 'Забагато позицій' }, { status: 400 });
  }

  // Recalculate total on the server (never trust client total)
  let total = 0;
  for (const it of items) {
    const price = Number(it.price) || 0;
    const qty = Math.max(1, Math.min(99, Number(it.qty) || 1));
    if (price < 0 || price > 1000000) {
      return NextResponse.json({ error: 'Невірна ціна товару' }, { status: 400 });
    }
    total += price * qty;
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('orders')
    .insert({
      user_id: userId,
      items,
      total,
      status: 'new',
      customer_name: customerName,
      customer_phone: customerPhone,
      np_area: npArea || null,
      np_city: npCity,
      np_city_ref: npCityRef || null,
      np_warehouse: npWarehouse,
      payment_method: paymentMethod,
      comment: comment || null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orderId: data?.id });
}
