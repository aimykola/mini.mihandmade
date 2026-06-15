'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Product = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image: string | null;
  images: string[];
  active: boolean;
  in_stock: boolean;
  discount: number;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  discount: number | null;
  role: string | null;
};

const empty = { name: '', description: '', price: 0, category: 'pled', slug: '', image: '', images: [] as string[], discount: 0 };

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  new: { label: 'В обробці', cls: 'bg-[#f0e6da] text-[#9c8a78]' },
  accepted: { label: 'Прийнятий менеджером', cls: 'bg-[#e0ecf5] text-[#3b6b96]' },
  preparing: { label: 'Готується до відправки', cls: 'bg-[#fbeee2] text-[#b5552e]' },
  shipped: { label: 'Відправлено', cls: 'bg-[#e8a87c]/30 text-[#9d4726]' },
  delivered: { label: 'Отримано покупцем', cls: 'bg-green-100 text-green-700' },
  done: { label: 'Отримано покупцем', cls: 'bg-green-100 text-green-700' },
};

const STATUS_FLOW: { value: string; label: string }[] = [
  { value: 'new', label: 'В обробці' },
  { value: 'accepted', label: 'Прийнятий менеджером' },
  { value: 'preparing', label: 'Готується до відправки' },
  { value: 'shipped', label: 'Відправлено' },
  { value: 'delivered', label: 'Отримано покупцем' },
];

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<'products' | 'users' | 'orders' | 'contacts'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState<typeof empty>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [contacts, setContacts] = useState({ contacts_heading: '', contacts_text: '', instagram_url: '', instagram_label: '', phone: '', email: '' });

  const loadProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('id, slug, name, description, price, category, image, images, active, in_stock, discount')
      .order('created_at', { ascending: true });
    setProducts((data as Product[]) ?? []);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, discount, role')
      .order('created_at', { ascending: true });
    setUsers((data as UserRow[]) ?? []);
  }, []);

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders((data as Record<string, unknown>[]) ?? []);
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders((prev) => prev.map((o) => (String(o.id) === id ? { ...o, status } : o)));
  }, []);

  const loadContacts = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('contacts_heading, contacts_text, instagram_url, instagram_label, phone, email').eq('id', 1).single();
    if (data) setContacts({ contacts_heading: data.contacts_heading ?? '', contacts_text: data.contacts_text ?? '', instagram_url: data.instagram_url ?? '', instagram_label: data.instagram_label ?? '', phone: data.phone ?? '', email: data.email ?? '' });
  }, []);

  async function handleSaveContacts(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const { error } = await supabase.from('site_settings').update({ ...contacts, updated_at: new Date().toISOString() }).eq('id', 1);
    setMsg(error ? ('\u041f\u043e\u043c\u0438\u043b\u043a\u0430: ' + error.message) : '\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e \u2713');
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (prof?.role !== 'admin') { setAllowed(false); setChecking(false); return; }
      setAllowed(true);
      setChecking(false);
      await loadProducts();
      await loadUsers();
      await loadOrders();
      await loadContacts();
    }
    init();
  }, [router, loadProducts, loadUsers, loadOrders, loadContacts]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setMsg('');
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
      if (error) {
        setMsg('Помилка завантаження зображення: ' + error.message);
        setUploading(false);
        return;
      }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    setForm((f) => ({ ...f, images: [...f.images, ...uploaded], image: f.image || uploaded[0] }));
    setUploading(false);
    setMsg('');
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      discount: Number(form.discount),
      category: form.category,
      slug: form.slug || null,
      image: form.image || null,
      images: form.images,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from('products').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }
    if (error) { setMsg('Помилка: ' + error.message); return; }
    setForm(empty);
    setEditingId(null);
    setMsg('Товар збережено ✓');
    await loadProducts();
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description ?? '', price: p.price, category: p.category, slug: p.slug ?? '', image: p.image ?? '', images: p.images ?? [], discount: p.discount });
    setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggleActive(p: Product) {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id);
    await loadProducts();
  }

  async function toggleInStock(p: Product) {
    await supabase.from('products').update({ in_stock: !p.in_stock }).eq('id', p.id);
    await loadProducts();
  }

  async function deleteProduct(p: Product) {
    if (!confirm(`\u0412\u0438\u0434\u0430\u043b\u0438\u0442\u0438 \u0442\u043e\u0432\u0430\u0440 \u00ab${p.name}\u00bb?`)) return;
    setMsg('');
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) { setMsg('\u041f\u043e\u043c\u0438\u043b\u043a\u0430: ' + error.message); return; }
    setMsg('\u0422\u043e\u0432\u0430\u0440 \u0432\u0438\u0434\u0430\u043b\u0435\u043d\u043e \u2713');
    await loadProducts();
  }

  async function saveDiscount(u: UserRow, value: number) {
    await supabase.from('profiles').update({ discount: value }).eq('id', u.id);
    await loadUsers();
    setMsg('Знижку оновлено ✓');
  }

  async function makeAdmin(u: UserRow) {
    if (!confirm(`Надати права адміністратора користувачу ${u.email}?`)) return;
    const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', u.id);
    if (error) { setMsg('Помилка: ' + error.message); return; }
    await loadUsers();
    setMsg('Права адміністратора надано ✓');
  }

  async function revokeAdmin(u: UserRow) {
    if (!confirm(`Зняти права адміністратора з ${u.email}?`)) return;
    const { error } = await supabase.from('profiles').update({ role: 'user' }).eq('id', u.id);
    if (error) { setMsg('Помилка: ' + error.message); return; }
    await loadUsers();
    setMsg('Права адміністратора знято ✓');
  }

  if (checking) {
    return <main className="min-h-screen flex items-center justify-center bg-[#fdf8f3]"><p className="text-sm text-[#5a4636]">Завантаження...</p></main>;
  }
  if (!allowed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fdf8f3]">
        <p className="text-lg font-semibold text-[#5a4636]">Доступ лише для адміністраторів.</p>
        <Link href="/account" className="text-sm text-[#b5552e] hover:underline">← До кабінету</Link>
      </main>
    );
  }

  const newOrdersCount = orders.filter((o) => String(o.status ?? 'new') === 'new').length;
  return (
    <main className="min-h-screen bg-[#fdf8f3] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/account" className="text-sm text-[#b5552e] hover:underline">← До кабінету</Link>
          <Link href="/" className="text-sm text-[#5a4636] hover:underline">На головну</Link>
        </div>
        <h1 className="mb-6 text-center text-3xl font-extrabold tracking-wide text-[#b5552e]">Адмін-панель</h1>

        <div className="mb-6 flex justify-center gap-2">
          <button onClick={() => setTab('products')} className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${tab === 'products' ? 'bg-[#b5552e] text-white' : 'bg-white border border-[#f0e6da] text-[#5a4636]'}`}>Товари</button>
          <button onClick={() => setTab('users')} className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${tab === 'users' ? 'bg-[#b5552e] text-white' : 'bg-white border border-[#f0e6da] text-[#5a4636]'}`}>Користувачі</button>
          <button onClick={() => setTab('orders')} className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${tab === 'orders' ? 'bg-[#b5552e] text-white' : 'bg-white border border-[#f0e6da] text-[#5a4636]'}`}>Замовлення{newOrdersCount > 0 && (<span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{newOrdersCount}</span>)}</button>
          <button onClick={() => setTab('contacts')} className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${tab === 'contacts' ? 'bg-[#b5552e] text-white' : 'bg-white border border-[#f0e6da] text-[#5a4636]'}`}>Контакти</button>
        </div>

        {msg && <p className="mb-4 text-center text-sm text-[#5a4636]">{msg}</p>}

        {tab === 'products' && (
          <div className="space-y-8">
            <form onSubmit={handleSaveProduct} className="rounded-2xl border border-[#f0e6da] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-[#b5552e]">{editingId ? 'Редагувати товар' : 'Додати товар'}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Назва" className="rounded-lg border border-[#e8dccb] px-3 py-2 text-[#5a4636] outline-none focus:border-[#b5552e]" />
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug (необовʼязково)" className="rounded-lg border border-[#e8dccb] px-3 py-2 text-[#5a4636] outline-none focus:border-[#b5552e]" />
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required placeholder="Ціна" className="rounded-lg border border-[#e8dccb] px-3 py-2 text-[#5a4636] outline-none focus:border-[#b5552e]" />
                <input type="number" min={0} max={100} value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} placeholder="Знижка %" className="rounded-lg border border-[#e8dccb] px-3 py-2 text-[#5a4636] outline-none focus:border-[#b5552e]" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-[#e8dccb] px-3 py-2 text-[#5a4636] outline-none focus:border-[#b5552e]">
                  <option value="pled">Плед</option>
                  <option value="cardigan">Кардиган</option>
                </select>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Опис" className="sm:col-span-2 rounded-lg border border-[#e8dccb] px-3 py-2 text-[#5a4636] outline-none focus:border-[#b5552e]" rows={3} />
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-400">Зображення (можна декілька)</label>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="text-sm text-[#5a4636]" />
                  {uploading && <span className="ml-2 text-xs text-gray-400">Завантаження...</span>}
                  {form.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.images.map((img, i) => (
                        <div key={i} className="relative">
                          <img src={img} alt="" className="h-20 w-20 rounded-lg object-cover" />
                          <button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i), image: f.image === img ? (f.images.filter((_, j) => j !== i)[0] || '') : f.image }))} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#e23b2e] text-xs font-bold text-white">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button type="submit" className="rounded-lg bg-[#b5552e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9c4727]">{editingId ? 'Зберегти зміни' : 'Додати товар'}</button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(empty); }} className="text-sm text-gray-500 hover:underline">Скасувати</button>}
              </div>
            </form>

            <div className="rounded-2xl border border-[#f0e6da] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-[#5a4636]">Список товарів ({products.length})</h2>
              <ul className="divide-y divide-[#f0e6da]">
                {products.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 py-3">
                    {p.image ? <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-[#fbeee2]" />}
                    <div className="flex-1">
                      <p className="font-semibold text-[#5a4636]">{p.name} {!p.active && <span className="text-xs text-gray-400">(приховано)</span>} <span className={`text-xs ${p.in_stock ? 'text-green-700' : 'text-[#b5552e]'}`}>{p.in_stock ? '• в наявності' : '• під замовлення'}</span></p>
                      <p className="text-sm text-gray-400">{p.price} грн · {p.category}{p.discount > 0 && <span className="ml-2 font-semibold text-[#b5552e]">−{p.discount}%</span>}</p>
                    </div>
                    <button onClick={() => startEdit(p)} className="text-sm text-[#b5552e] hover:underline">Редагувати</button>
                    <button onClick={() => toggleActive(p)} className="text-sm text-[#5a4636] hover:underline">{p.active ? 'Приховати' : 'Показати'}</button>
                  <button onClick={() => toggleInStock(p)} className="text-sm text-[#b5552e] hover:underline">{p.in_stock ? '→ Під замовлення' : '→ В наявності'}</button>
                  <button onClick={() => deleteProduct(p)} className="text-sm text-red-600 hover:underline">Видалити</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="rounded-2xl border border-[#f0e6da] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#5a4636]">Користувачі ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="py-2 pr-4">Імʼя</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Телефон</th>
                    <th className="py-2 pr-4">Знижка %</th>
                    <th className="py-2 pr-4">Роль</th>
                    <th className="py-2">Дії</th>
                  </tr>
                </thead>
                <tbody className="text-[#5a4636]">
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-[#f0e6da]">
                      <td className="py-2 pr-4">{u.full_name || '—'}</td>
                      <td className="py-2 pr-4">{u.email || '—'}</td>
                      <td className="py-2 pr-4">{u.phone || '—'}</td>
                      <td className="py-2 pr-4">
                        <input type="number" defaultValue={u.discount ?? 0} onBlur={(e) => saveDiscount(u, Number(e.target.value))} className="w-16 rounded border border-[#e8dccb] px-2 py-1 outline-none focus:border-[#b5552e]" />
                      </td>
                      <td className="py-2 pr-4">{u.role === 'admin' ? <span className="font-semibold text-[#b5552e]">admin</span> : 'user'}</td>
                      <td className="py-2">
                        {u.role === 'admin'
                          ? <button onClick={() => revokeAdmin(u)} className="text-xs text-gray-500 hover:underline">Зняти адміна</button>
                          : <button onClick={() => makeAdmin(u)} className="text-xs text-[#b5552e] hover:underline">Зробити адміном</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-gray-400">Знижка зберігається при втраті фокуса поля.</p>
          </div>
        )}
        {tab === 'orders' && (
          <div className="overflow-x-auto rounded-2xl border border-[#f0e6da] bg-white">
            {orders.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#5a4636]">Замовлень поки немає</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#f0e6da] text-[#b5552e]">
                  <tr>
                    <th className="p-3">Дата</th>
                    <th className="p-3">Покупець</th>
                    <th className="p-3">Доставка</th>
                    <th className="p-3">Оплата</th>
                    <th className="p-3">Сума</th>
                    <th className="p-3">Статус</th>
                    <th className="p-3">Дія</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={String(o.id)} className="border-b border-[#f0e6da] align-top">
                      <td className="p-3 whitespace-nowrap text-[#5a4636]">{o.created_at ? new Date(String(o.created_at)).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                      <td className="p-3">
                        <div className="font-semibold text-[#5a4636]">{String(o.customer_name ?? '—')}</div>
                        <div className="text-[#5a4636]/70">{String(o.customer_phone ?? '')}</div>
                        {o.comment ? <div className="mt-1 text-xs text-[#5a4636]/60">💬 {String(o.comment)}</div> : null}
                        {!o.user_id ? <span className="mt-1 inline-block rounded bg-[#fbeee2] px-1.5 py-0.5 text-xs text-[#9c4727]">Гість</span> : null}
                      </td>
                      <td className="p-3 text-[#5a4636]">
                        <div>{String(o.np_city ?? '—')}</div>
                        <div className="text-xs text-[#5a4636]/70">{String(o.np_warehouse ?? '')}</div>
                      </td>
                      <td className="p-3 text-[#5a4636]">{o.payment_method === 'card' ? 'Картка' : 'При отриманні'}</td>
                      <td className="p-3 whitespace-nowrap font-semibold text-[#5a4636]">{String(o.total ?? 0)} грн</td>
                      <td className="p-3"><span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${(STATUS_MAP[String(o.status ?? 'new')] ?? STATUS_MAP.new).cls}`}>{(STATUS_MAP[String(o.status ?? 'new')] ?? STATUS_MAP.new).label}</span></td>
                      <td className="p-3"><select value={String(o.status ?? 'new')} onChange={(e) => updateOrderStatus(String(o.id), e.target.value)} className="rounded-lg border border-[#e3d6c7] bg-white px-2 py-1 text-xs font-semibold text-[#5a4636] focus:border-[#e8a87c] focus:outline-none">{STATUS_FLOW.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}</select></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'contacts' && (
          <form onSubmit={handleSaveContacts} className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-[#f0e6da] bg-white p-6 shadow-sm">
            <div>
              <label className="block text-sm font-semibold text-[#5a4636] mb-1">Заголовок</label>
              <input value={contacts.contacts_heading} onChange={(e) => setContacts({ ...contacts, contacts_heading: e.target.value })} className="w-full rounded-lg border border-[#e3d6c7] bg-white px-3 py-2 text-[#473529] outline-none focus:border-[#e8a87c]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#5a4636] mb-1">Опис</label>
              <textarea rows={3} value={contacts.contacts_text} onChange={(e) => setContacts({ ...contacts, contacts_text: e.target.value })} className="w-full rounded-lg border border-[#e3d6c7] bg-white px-3 py-2 text-[#473529] outline-none focus:border-[#e8a87c]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#5a4636] mb-1">Посилання Instagram</label>
              <input value={contacts.instagram_url} onChange={(e) => setContacts({ ...contacts, instagram_url: e.target.value })} className="w-full rounded-lg border border-[#e3d6c7] bg-white px-3 py-2 text-[#473529] outline-none focus:border-[#e8a87c]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#5a4636] mb-1">Підпис кнопки Instagram</label>
              <input value={contacts.instagram_label} onChange={(e) => setContacts({ ...contacts, instagram_label: e.target.value })} className="w-full rounded-lg border border-[#e3d6c7] bg-white px-3 py-2 text-[#473529] outline-none focus:border-[#e8a87c]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#5a4636] mb-1">Телефон</label>
              <input value={contacts.phone} onChange={(e) => setContacts({ ...contacts, phone: e.target.value })} className="w-full rounded-lg border border-[#e3d6c7] bg-white px-3 py-2 text-[#473529] outline-none focus:border-[#e8a87c]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#5a4636] mb-1">Email</label>
              <input value={contacts.email} onChange={(e) => setContacts({ ...contacts, email: e.target.value })} className="w-full rounded-lg border border-[#e3d6c7] bg-white px-3 py-2 text-[#473529] outline-none focus:border-[#e8a87c]" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-[#b5552e] px-5 py-2.5 font-semibold text-white transition hover:bg-[#9d4726]">Зберегти</button>
          </form>
        )}
      </div>
    </main>
  );
}
