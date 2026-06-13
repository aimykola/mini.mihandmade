'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) {
      setError('Потрібно погодитися з умовами використання сайту');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin + '/account' : undefined },
    });
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdf8f3] px-4 py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#f0e6da] p-8 text-center">
          <h1 className="text-2xl font-bold text-[#b5552e] mb-4">Майже готово!</h1>
          <p className="text-sm text-[#5a4636] mb-6">Ми надіслали лист для підтвердження на вашу пошту. Перевірте поштову скриньку, щоб завершити реєстрацію.</p>
          <Link href="/login" className="inline-block rounded-xl bg-[#b5552e] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#9d4726] transition">Перейти до входу</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fdf8f3] px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#f0e6da] p-8">
        <Link href="/" className="inline-flex items-center gap-1 mb-4 text-sm font-medium text-[#b5552e] hover:underline">← На головну</Link>
        <h1 className="text-2xl font-bold text-[#b5552e] mb-6 text-center">Реєстрація</h1>
        <button onClick={handleGoogle} className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl border border-[#e3d6c7] py-2.5 text-sm font-medium text-[#5a4636] hover:bg-[#faf4ec] transition">Зареєструватися через Google</button>
        <div className="text-center text-xs text-gray-400 mb-4">або</div>
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" required placeholder="Ім'я та прізвище" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-[#e3d6c7] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]" />
          <input type="tel" placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-[#e3d6c7] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]" />
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-[#e3d6c7] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]" />
          <input type="password" required placeholder="Пароль (мін. 6 символів)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-[#e3d6c7] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a87c]" />
          <label className="flex items-start gap-2 text-sm text-[#5a4636] cursor-pointer select-none">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#b5552e]" />
            <span>Я згоден з <Link href="/terms" className="text-[#b5552e] font-medium hover:underline">умовами використання сайту</Link></span>
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading || !agree} className="w-full rounded-xl bg-[#b5552e] py-2.5 text-sm font-semibold text-white hover:bg-[#9d4726] transition disabled:opacity-60 disabled:cursor-not-allowed">{loading ? 'Зачекайте...' : 'Зареєструватися'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-[#5a4636]">Вже є акаунт? <Link href="/login" className="text-[#b5552e] font-medium hover:underline">Увійти</Link></p>
      </div>
    </main>
  );
}
