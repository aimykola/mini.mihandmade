'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Невірний email або пароль');
      return;
    }
    router.push('/account');
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin + '/account' : undefined },
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fdf8f3] px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#f0e6da] p-8">
        <h1 className="text-2xl font-bold text-[#b5552e] mb-6 text-center">Вхід</h1>
        <button onClick={handleGoogle} className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl border border-[#e3d6c7] py-2.5 text-sm font-medium text-[#5a4636] hover:bg-[#faf4ec] transition">Увійти через Google</button>
        <div className="text-center text-xs text-gray-400 mb-4">або</div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-[#e3d6c7] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]" />
          <input type="password" required placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-[#e3d6c7] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#b5552e] py-2.5 text-sm font-semibold text-white hover:bg-[#9d4726] transition disabled:opacity-60">{loading ? 'Зачекайте...' : 'Увійти'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-[#5a4636]">Немає акаунту? <Link href="/register" className="text-[#b5552e] font-medium hover:underline">Зареєструватися</Link></p>
      </div>
    </main>
  );
}
