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

// Send an email notification to the shop admin about a new order.
// Uses Resend's HTTP API directly (no extra dependency). Failure to
// send the email must NEVER break order creation — it is best-effort.
async function notifyAdmin(order: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  total: number;
  items: OrderItem[];
  npArea: string;
  npCity: string;
  npWarehouse: string;
  paymentMethod: string;
  comment: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // not configured yet — skip silently
  const from = process.env.ORDER_EMAIL_FROM || 'MINIMI handmade <onboarding@resend.dev>';
  const to = process.env.ORDER_EMAIL_TO || 'aimykola15@gmail.com';

  const payment = order.paymentMethod === 'card' ? 'Картка Visa/MasterCard' : 'Оплата при отриманні';
  const itemsRows = order.items
    .map(
      (it) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #f0e6da">${it.name}</td><td style="padding:6px 10px;border-bottom:1px solid #f0e6da;text-align:center">${it.qty}</td><td style="padding:6px 10px;border-bottom:1px solid #f0e6da;text-align:right">${it.price} грн</td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#5a4636">
      <h2 style="color:#b5552e">🛍️ Нове замовлення №${order.orderId.slice(0, 8)}</h2>
      <p><b>Покупець:</b> ${order.customerName}<br/>
         <b>Телефон:</b> ${order.customerPhone}</p>
      <table style="border-collapse:collapse;width:100%;margin:12px 0">
        <thead><tr style="background:#fbeee2">
          <th style="padding:6px 10px;text-align:left">Товар</th>
          <th style="padding:6px 10px">К-сть</th>
          <th style="padding:6px 10px;text-align:right">Ціна</th>
        </tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <p style="font-size:18px"><b>Разом: ${order.total} грн</b></p>
      <p><b>Доставка:</b> Нова Пошта, ${order.npArea ? order.npArea + ', ' : ''}${order.npCity}, ${order.npWarehouse}<br/>
         <b>Оплата:</b> ${payment}</p>
      ${order.comment ? `<p><b>Коментар:</b> ${order.comment}</p>` : ''}
    </div>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Нове замовлення на ${order.total} грн — ${order.customerName}`,
        html,
      }),
    });
  } catch {
    // best-effort — ignore email errors
  }
}

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

  // Best-effort admin email notification (does not block the response).
  await notifyAdmin({
    orderId: String(data?.id ?? ''),
    customerName,
    customerPhone,
    total,
    items,
    npArea,
    npCity,
    npWarehouse,
    paymentMethod,
    comment,
  });

  return NextResponse.json({ ok: true, orderId: data?.id });
}
