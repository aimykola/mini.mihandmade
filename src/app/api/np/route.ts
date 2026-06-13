import { NextRequest, NextResponse } from 'next/server';

const NP_API = 'https://api.novaposhta.ua/v2.0/json/';

async function npCall(modelName: string, calledMethod: string, methodProperties: Record<string, unknown>) {
  const apiKey = process.env.NOVA_POSHTA_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'NOVA_POSHTA_API_KEY is not configured' };
  }
  const res = await fetch(NP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
  });
  const json = await res.json();
  return { ok: true, data: json };
}

// Static list of Ukrainian regions (oblasts) for the cascade selector.
const AREAS = [
  'Вінницька', 'Волинська', 'Дніпропетровська', 'Донецька', 'Житомирська',
  'Закарпатська', 'Запорізька', 'Івано-Франківська', 'Київська', 'м. Київ',
  'Кіровоградська', 'Луганська', 'Львівська', 'Миколаївська', 'Одеська',
  'Полтавська', 'Рівненська', 'Сумська', 'Тернопільська', 'Харківська',
  'Херсонська', 'Хмельницька', 'Черкаська', 'Чернівецька', 'Чернігівська',
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'areas') {
    return NextResponse.json({ items: AREAS.map((name) => ({ name })) });
  }

  if (action === 'cities') {
    const q = (searchParams.get('q') || '').trim();
    const area = (searchParams.get('area') || '').trim();
    if (q.length < 2) return NextResponse.json({ items: [] });
    const result = await npCall('Address', 'searchSettlements', {
      CityName: q,
      Limit: 30,
      Page: 1,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    const addresses = result.data?.data?.[0]?.Addresses ?? [];
    let items = addresses.map((a: { Present: string; DeliveryCity: string; MainDescription: string; Area: string }) => ({
      ref: a.DeliveryCity,
      name: a.MainDescription,
      present: a.Present,
      area: a.Area,
    }));
    // Optional filter by chosen region
    if (area) {
      const needle = area.replace(/\s+/g, '').toLowerCase();
      items = items.filter((i: { area: string; present: string }) =>
        (i.area || '').replace(/\s+/g, '').toLowerCase().includes(needle) ||
        (i.present || '').replace(/\s+/g, '').toLowerCase().includes(needle)
      );
    }
    return NextResponse.json({ items });
  }

  if (action === 'warehouses') {
    const cityRef = searchParams.get('cityRef') || '';
    const q = (searchParams.get('q') || '').trim();
    if (!cityRef) return NextResponse.json({ items: [] });
    const result = await npCall('AddressGeneral', 'getWarehouses', {
      CityRef: cityRef,
      FindByString: q,
      Limit: 50,
      Page: 1,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    const warehouses = result.data?.data ?? [];
    const items = warehouses.map((w: { Ref: string; Description: string; Number: string }) => ({
      ref: w.Ref,
      number: w.Number,
      description: w.Description,
    }));
    return NextResponse.json({ items });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
