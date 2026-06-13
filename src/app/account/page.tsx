'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Profile = {
  full_name: string | null;
  phone: string | null;
  discount: number | null;
};

type Order = {
  id: string;
  items: { title: string; qty: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
};

type Tab = 'data' | 'orders' | 'promo' | 'bonus' | 'reviews';

const TABS: { key: Tab; label: string }[] = [
  { key: 'data', label: 'Дані та налаштування' },
  { key: 'orders', label: 'Історія покупок' },
  { key: 'promo', label: 'Мої промокоди' },
  { key: 'bonus', label: 'Історія бонусів' },
  { key: 'reviews', label: 'Історія відгуків' },
];

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [isOAuth, setIsOAuth] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>('data');

  // editable fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // password change
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
        .select('full_name, phone, discount')
        .eq('id', user.id)
        .single();
      setProfile(prof);
      const metaName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '';
      setFullName(prof?.full_name || metaName || '');
      setPhone(prof?.phone || '');
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
      .upsert({ id: userId, full_name: fullName, phone }, { onConflict: 'id' });
    setSavingProfile(false);
    if (error) {
      setProfileMsg('Не вдалося зберегти. Спробуйте ще раз.');
    } else {
      setProfile((p) => ({ ...(p ?? { discount: 0 }), full_name: fullName, phone }));
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

  return (
    <main className="min-h-screen bg-[#fdf8f3] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <Link href="/" className="text-sm text-[#b5552e] hover:underline">← На головну</Link>
        </div>
        <h1 className="mb-1 text-center text-3xl font-extrabold tracking-wide text-[#b5552e]">Особистий кабінет</h1>
        <button onClick={handleLogout} className="mx-auto mb-8 block text-sm font-medium text-[#5a4636] underline-offset-4 hover:underline">Вийти з облікового запису</button>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          {/* Sidebar */}
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
            <button onClick={handleLogout} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#5a4636] hover:bg-white/60">Вихід</button>
          </nav>

          {/* Content */}
          <section className="rounded-2xl border border-[#f0e6da] bg-white p-6 shadow-sm">
            {tab === 'data' && (
              <div>
                <h2 className="mb-6 text-xl font-bold text-[#b5552e]">Дані та налаштування</h2>
                <form onSubmit={handleSaveProfile} className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400">Ім&apos;я</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ваше ім&apos;я" className="w-full border-b border-[#e8dccb] bg-transparent py-2 text-[#5a4636] outline-none focus:border-[#b5552e]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400">Email</label>
                    <input value={email} disabled className="w-full border-b border-[#e8dccb] bg-transparent py-2 text-gray-400 outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400">Телефон</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380..." className="w-full border-b border-[#e8dccb] bg-transparent py-2 text-[#5a4636] outline-none focus:border-[#b5552e]" />
                  </div>
                  <div className="flex items-end">
                    {profile?.discount ? (
                      <span className="inline-block rounded-full bg-[#fbeee2] px-4 py-1.5 text-sm font-semibold text-[#b5552e]">Ваша знижка: {profile.discount}%</span>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-4">
                    <button type="submit" disabled={savingProfile} className="rounded-lg bg-[#b5552e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9c4727] disabled:opacity-60">{savingProfile ? 'Зберігаємо...' : 'Зберегти дані'}</button>
                    {profileMsg && <span className="text-sm text-[#5a4636]">{profileMsg}</span>}
                  </div>
                </form>

                <div className="mt-10 border-t border-[#f0e6da] pt-6">
                  <h3 className="mb-4 text-lg font-bold text-[#5a4636]">Зміна пароля</h3>
                  {isOAuth ? (
                    <div>
                      <p className="mb-3 text-sm text-gray-500">Ваш акаунт створено через Google. Щоб встановити пароль, ми надішлемо лист із посиланням.</p>
                      <button onClick={handleChangePassword} className="rounded-lg border border-[#b5552e] px-6 py-2.5 text-sm font-semibold text-[#b5552e] transition hover:bg-[#fbeee2]">Надіслати лист для встановлення пароля</button>
                      {passwordMsg && <p className="mt-3 text-sm text-[#5a4636]">{passwordMsg}</p>}
                    </div>
                  ) : (
                    <form onSubmit={handleChangePassword} className="grid max-w-md gap-4">
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Новий пароль" className="w-full rounded-lg border border-[#e8dccb] bg-transparent px-3 py-2 text-[#5a4636] outline-none focus:border-[#b5552e]" />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторіть пароль" className="w-full rounded-lg border border-[#e8dccb] bg-transparent px-3 py-2 text-[#5a4636] outline-none focus:border-[#b5552e]" />
                      <div className="flex items-center gap-4">
                        <button type="submit" disabled={savingPassword} className="rounded-lg bg-[#5a4636] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#473529] disabled:opacity-60">{savingPassword ? 'Зберігаємо...' : 'Змінити пароль'}</button>
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
                          <span className="text-xs font-medium text-[#b5552e]">{o.status}</span>
                        </div>
                        <ul className="space-y-1 text-sm text-[#5a4636]">
                          {o.items?.map((it, i) => (
                            <li key={i} className="flex justify-between">
                              <span>{it.title} × {it.qty}</span>
                              <span>{it.price * it.qty} грн</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 flex justify-between border-t border-[#f0e6da] pt-2 text-sm font-semibold text-[#5a4636]">
                          <span>Разом</span>
                          <span>{o.total} грн</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'promo' && (
              <div>
                <h2 className="mb-6 text-xl font-bold text-[#b5552e]">Мої промокоди</h2>
                <p className="text-sm text-gray-400">Тут зʼявляться ваші промокоди. Незабаром!</p>
              </div>
            )}

            {tab === 'bonus' && (
              <div>
                <h2 className="mb-6 text-xl font-bold text-[#b5552e]">Історія бонусів</h2>
                <p className="text-sm text-gray-400">Тут зʼявиться історія нарахування бонусів. Незабаром!</p>
              </div>
            )}

            {tab === 'reviews' && (
              <div>
                <h2 className="mb-6 text-xl font-bold text-[#b5552e]">Історія відгуків</h2>
                <p className="text-sm text-gray-400">Тут зʼявляться ваші відгуки. Незабаром!</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
