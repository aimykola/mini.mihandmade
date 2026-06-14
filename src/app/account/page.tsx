'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Profile = {
  full_name: string | null;
  phone: string | null;
  discount: number | null;
  role: string | null;
  np_city: string | null;
  np_city_ref: string | null;
  np_warehouse: string | null;
  np_warehouse_ref: string | null;
};

type Order = {
  id: string;
  items: { title: string; qty: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
};

type Tab = 'data' | 'orders' | 'promo' | 'bonus' | 'reviews';

type City = { ref: string; name: string; present: string; area: string };
type Warehouse = { ref: string; number: string; description: string };

const TABS: { key: Tab; label: string }[] = [
  { key: 'data', label: 'Дані та налаштування' },
  { key: 'orders', label: 'Історія покупок' },
  { key: 'promo', label: 'Мої промокоди' },
  { key: 'bonus', label: 'Історія бонусів' },
  { key: 'reviews', label: 'Історія відгуків' },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  new: { label: 'В обробці', cls: 'bg-[#f0e6da] text-[#9c8a78]' },
  accepted: { label: 'Прийнятий менеджером', cls: 'bg-[#e0ecf5] text-[#3b6b96]' },
  preparing: { label: 'Готується до відправки', cls: 'bg-[#fbeee2] text-[#b5552e]' },
  shipped: { label: 'Відправлено', cls: 'bg-[#e8a87c]/30 text-[#9d4726]' },
  delivered: { label: 'Отримано покупцем', cls: 'bg-green-100 text-green-700' },
  done: { label: 'Отримано покупцем', cls: 'bg-green-100 text-green-700' },
};

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [isOAuth, setIsOAuth] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>('data');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Nova Poshta
  const [cityQuery, setCityQuery] = useState('');
  const [cityRef, setCityRef] = useState('');
  const [cityName, setCityName] = useState('');
  const [cityOptions, setCityOptions] = useState<City[]>([]);
  const [showCityList, setShowCityList] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseRef, setWarehouseRef] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? '');
      const provider = user.app_metadata?.provider;
      setIsOAuth(!!provider && provider !== 'email');
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, phone, discount, role, np_city, np_city_ref, np_warehouse, np_warehouse_ref')
        .eq('id', user.id)
        .single();
      setProfile(prof);
      const metaName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '';
      setFullName(prof?.full_name || metaName || '');
      setPhone(prof?.phone || '');
      setCityRef(prof?.np_city_ref || '');
      setCityName(prof?.np_city || '');
      setCityQuery(prof?.np_city || '');
      setWarehouseRef(prof?.np_warehouse_ref || '');
      setWarehouseName(prof?.np_warehouse || '');
      const { data: ord } = await supabase
        .from('orders')
        .select('id, items, total, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(ord ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  // Load warehouses whenever cityRef changes
  useEffect(() => {
    if (!cityRef) {
      setWarehouses([]);
      return;
    }
    let active = true;
    fetch(`/api/np?action=warehouses&cityRef=${encodeURIComponent(cityRef)}`)
      .then((r) => r.json())
      .then((d) => { if (active) setWarehouses(d.items ?? []); })
      .catch(() => { if (active) setWarehouses([]); });
    return () => { active = false; };
  }, [cityRef]);

  function handleCityInput(value: string) {
    setCityQuery(value);
    setShowCityList(true);
    if (cityDebounce.current) clearTimeout(cityDebounce.current);
    if (value.trim().length < 2) {
      setCityOptions([]);
      return;
    }
    cityDebounce.current = setTimeout(() => {
      fetch(`/api/np?action=cities&q=${encodeURIComponent(value.trim())}`)
        .then((r) => r.json())
        .then((d) => setCityOptions(d.items ?? []))
        .catch(() => setCityOptions([]));
    }, 300);
  }

  function selectCity(c: City) {
    setCityRef(c.ref);
    setCityName(c.present);
    setCityQuery(c.present);
    setShowCityList(false);
    setCityOptions([]);
    setWarehouseRef('');
    setWarehouseName('');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg('');
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        phone,
        np_city: cityName || null,
        np_city_ref: cityRef || null,
        np_warehouse: warehouseName || null,
        np_warehouse_ref: warehouseRef || null,
      }, { onConflict: 'id' });
    setSavingProfile(false);
    if (error) {
      setProfileMsg('Не вдалося зберегти. Спробуйте ще раз.');
    } else {
      setProfile((p) => ({
        ...(p ?? { discount: 0, role: 'user' }),
        full_name: fullName,
        phone,
        np_city: cityName || null,
        np_city_ref: cityRef || null,
        np_warehouse: warehouseName || null,
        np_warehouse_ref: warehouseRef || null,
      } as Profile));
      setProfileMsg('Дані збережено ✓');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg('');
    if (isOAuth) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/login' : undefined,
      });
      setPasswordMsg(error ? 'Помилка. Спробуйте ще раз.' : 'Лист для встановлення пароля надіслано на ' + email);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Пароль має містити щонайменше 6 символів.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Паролі не збігаються.');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordMsg('Не вдалося змінити пароль. Спробуйте ще раз.');
    } else {
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Пароль змінено ✓');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdf8f3]">
        <p className="text-sm text-[#5a4636]">Завантаження...</p>
      </main>
    );
  }

  const isAdmin = profile?.role === 'admin';
  const inputCls = 'w-full border-b border-[#e8dccb] bg-transparent py-2 text-[#5a4636] outline-none focus:border-[#b5552e]';
  const labelCls = 'mb-1 block text-xs font-medium text-gray-400';

  return (
    <main className="min-h-screen bg-[#fdf8f3] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <Link href="/" className="text-sm text-[#b5552e] hover:underline">← На головну</Link>
        </div>
        <h1 className="mb-1 text-center text-3xl font-extrabold tracking-wide text-[#b5552e]">Особистий кабінет</h1>
        <button onClick={handleLogout} className="mx-auto mb-8 block text-sm font-medium text-[#5a4636] underline-offset-4 hover:underline">Вийти з облікового запису</button>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <nav className="flex flex-col gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${tab === t.key ? 'bg-white border border-[#f0e6da] text-[#b5552e] shadow-sm' : 'text-[#5a4636] hover:bg-white/60'}`}
              >
                {t.label}
              </button>
            ))}
            {isAdmin && (
              <Link href="/admin" className="rounded-xl border border-[#b5552e] px-4 py-3 text-left text-sm font-semibold text-[#b5552e] hover:bg-[#fbeee2]">Адмін-панель</Link>
            )}
            <button onClick={handleLogout} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#5a4636] hover:bg-white/60">Вихід</button>
          </nav>

          <section className="rounded-2xl border border-[#f0e6da] bg-white p-6 shadow-sm">
            {tab === 'data' && (
              <div>
                <h2 className="mb-6 text-xl font-bold text-[#b5552e]">Дані та налаштування</h2>
                <form onSubmit={handleSaveProfile} className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Ім&apos;я</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ваше ім&apos;я" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input value={email} disabled className={inputCls + ' text-gray-400'} />
                  </div>
                  <div>
                    <label className={labelCls}>Телефон</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380..." className={inputCls} />
                  </div>
                  <div className="hidden sm:block" />

                  <div className="sm:col-span-2 mt-2 border-t border-[#f0e6da] pt-5">
                    <h3 className="mb-4 text-sm font-bold text-[#b5552e]">Нова Пошта</h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="relative">
                        <label className={labelCls}>Місто</label>
                        <input
                          value={cityQuery}
                          onChange={(e) => handleCityInput(e.target.value)}
                          onFocus={() => setShowCityList(true)}
                          placeholder="Почніть вводити місто"
                          className={inputCls}
                          autoComplete="off"
                        />
                        {showCityList && cityOptions.length > 0 && (
                          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[#f0e6da] bg-white shadow-lg">
                            {cityOptions.map((c) => (
                              <li key={c.ref}>
                                <button
                                  type="button"
                                  onClick={() => selectCity(c)}
                                  className="block w-full px-4 py-2 text-left text-sm text-[#5a4636] hover:bg-[#fbeee2]"
                                >
                                  {c.present}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Відділення</label>
                        <select
                          value={warehouseRef}
                          onChange={(e) => {
                            const w = warehouses.find((x) => x.ref === e.target.value);
                            setWarehouseRef(e.target.value);
                            setWarehouseName(w ? w.description : '');
                          }}
                          disabled={!cityRef}
                          className={inputCls + (cityRef ? '' : ' text-gray-400')}
                        >
                          <option value="">{cityRef ? 'Оберіть відділення' : 'Спочатку оберіть місто'}</option>
                          {warehouses.map((w) => (
                            <option key={w.ref} value={w.ref}>{w.description}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-4">
                    <button type="submit" disabled={savingProfile} className="rounded-xl bg-[#b5552e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9c4727] disabled:opacity-60">
                      {savingProfile ? 'Збереження...' : 'Зберегти дані'}
                    </button>
                    {profileMsg && <span className="text-sm text-[#5a4636]">{profileMsg}</span>}
                  </div>
                </form>

                <div className="mt-10 border-t border-[#f0e6da] pt-6">
                  <h3 className="mb-2 text-lg font-bold text-[#b5552e]">Зміна пароля</h3>
                  {isOAuth ? (
                    <div>
                      <p className="mb-3 text-sm text-[#5a4636]">Ваш акаунт створено через Google. Щоб встановити пароль, ми надішлемо лист із посиланням.</p>
                      <form onSubmit={handleChangePassword}>
                        <button type="submit" className="rounded-xl border border-[#b5552e] px-5 py-2.5 text-sm font-semibold text-[#b5552e] transition hover:bg-[#fbeee2]">Надіслати лист для встановлення пароля</button>
                        {passwordMsg && <p className="mt-3 text-sm text-[#5a4636]">{passwordMsg}</p>}
                      </form>
                    </div>
                  ) : (
                    <form onSubmit={handleChangePassword} className="grid max-w-md gap-4">
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Новий пароль" className={inputCls} />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Підтвердіть пароль" className={inputCls} />
                      <div className="flex items-center gap-4">
                        <button type="submit" disabled={savingPassword} className="rounded-xl bg-[#473529] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a4636] disabled:opacity-60">{savingPassword ? 'Збереження...' : 'Змінити пароль'}</button>
                        {passwordMsg && <span className="text-sm text-[#5a4636]">{passwordMsg}</span>}
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div>
                <h2 className="mb-6 text-xl font-bold text-[#b5552e]">Історія покупок</h2>
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-400">У вас ще немає замовлень.</p>
                ) : (
                  <ul className="space-y-4">
                    {orders.map((o) => (
                      <li key={o.id} className="rounded-xl border border-[#f0e6da] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('uk-UA')}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${(STATUS_MAP[o.status] ?? STATUS_MAP.new).cls}`}>{(STATUS_MAP[o.status] ?? STATUS_MAP.new).label}</span>
                        </div>
                        <ul className="mb-2 space-y-1 text-sm text-[#5a4636]">
                          {o.items?.map((it, i) => (
                            <li key={i} className="flex justify-between">
                              <span>{it.title} × {it.qty}</span>
                              <span>{it.price * it.qty} грн</span>
                            </li>
                          ))}
                        </ul>
                        <div className="text-right text-sm font-bold text-[#b5552e]">Разом: {o.total} грн</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'promo' && (
              <div>
                <h2 className="mb-6 text-xl font-bold text-[#b5552e]">Мої промокоди</h2>
                <p className="text-sm text-gray-400">Тут з&apos;являться ваші промокоди. Незабаром.</p>
              </div>
            )}

            {tab === 'bonus' && (
              <div>
                <h2 className="mb-6 text-xl font-bold text-[#b5552e]">Історія бонусів</h2>
                <p className="text-sm text-gray-400">Тут з&apos;явиться історія нарахування бонусів. Незабаром.</p>
              </div>
            )}

            {tab === 'reviews' && (
              <div>
                <h2 className="mb-6 text-xl font-bold text-[#b5552e]">Історія відгуків</h2>
                <p className="text-sm text-gray-400">Тут з&apos;являться ваші відгуки. Незабаром.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
