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

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setEmail(user.email ?? '');
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, phone, discount')
        .eq('id', user.id)
        .single();
      setProfile(prof);
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdf8f3]">
        <p className="text-sm text-[#5a4636]">Завантаження...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf8f3] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm text-[#b5552e] hover:underline">← На головну</Link>
          <button onClick={handleLogout} className="text-sm font-medium text-[#5a4636] hover:text-[#b5552e]">Вийти</button>
        </div>

        <div className="rounded-2xl bg-white border border-[#f0e6da] p-6 mb-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#b5552e] mb-4">Мій кабінет</h1>
          <div className="space-y-1 text-sm text-[#5a4636]">
            <p><span className="text-gray-400">Ім'я:</span> {profile?.full_name || '—'}</p>
            <p><span className="text-gray-400">Email:</span> {email}</p>
            <p><span className="text-gray-400">Телефон:</span> {profile?.phone || '—'}</p>
          </div>
          {profile?.discount ? (
            <div className="mt-4 inline-block rounded-full bg-[#fbeee2] px-4 py-1.5 text-sm font-semibold text-[#b5552e]">Ваша знижка: {profile.discount}%</div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-white border border-[#f0e6da] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#5a4636] mb-4">Історія замовлень</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400">У вас ще немає замовлень.</p>
          ) : (
            <ul className="space-y-4">
              {orders.map((o) => (
                <li key={o.id} className="rounded-xl border border-[#f0e6da] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('uk-UA')}</span>
                    <span className="text-xs font-medium text-[#b5552e]">{o.status}</span>
                  </div>
                  <ul className="text-sm text-[#5a4636] space-y-1">
                    {o.items?.map((it, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{it.title} × {it.qty}</span>
                        <span>{it.price * it.qty} грн</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-[#f0e6da] flex justify-between text-sm font-semibold text-[#5a4636]">
                    <span>Разом</span>
                    <span>{o.total} грн</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
