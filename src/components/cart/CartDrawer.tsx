'use client'

import { useState } from 'react'
import { useCart } from './CartContext'
import { supabase } from '@/lib/supabase'

export default function CartDrawer() {
  const { items, isOpen, close, remove, setQty, total, clear, count } = useCart()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const orderItems = items.map((i) => ({ title: i.product.name, qty: i.qty, price: i.product.price }))
        const { error: insertError } = await supabase.from('orders').insert({ user_id: user.id, items: orderItems, total, status: 'new' })
        if (insertError) throw insertError
        clear()
      }
      setSent(true)
    } catch (err) {
      setError('Не вдалося зберегти замовлення. Спробуйте ще раз.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-black/10 p-4">
          <h2 className="text-lg font-bold">Кошик ({count})</h2>
          <button onClick={close} aria-label="Закрити" className="rounded-full px-3 py-1 text-2xl leading-none hover:bg-black/5">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="mt-8 text-center text-foreground/60">Кошик порожній</p>
          ) : (
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.product.id} className="flex gap-3 rounded-xl border border-black/10 p-3">
                  <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-brand-soft/30" />
                  <div className="flex-1">
                    <p className="font-semibold">{i.product.name}</p>
                    <p className="text-sm text-foreground/60">{i.product.price} грн</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => setQty(i.product.id, i.qty - 1)} className="h-7 w-7 rounded-full border border-black/15">−</button>
                      <span className="w-6 text-center">{i.qty}</span>
                      <button onClick={() => setQty(i.product.id, i.qty + 1)} className="h-7 w-7 rounded-full border border-black/15">+</button>
                      <button onClick={() => remove(i.product.id)} className="ml-auto text-sm text-brand-dark hover:underline">Видалити</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-black/10 p-4">
            <div className="mb-3 flex justify-between text-lg font-bold"><span>Разом:</span><span>{total} грн</span></div>
            {sent ? (
              <div className="rounded-xl bg-brand-soft/20 p-4 text-center">
                <p className="font-semibold text-brand-dark">Дякуємо, {name || 'друже'}!</p>
                <p className="mt-1 text-sm text-foreground/70">Ваше замовлення прийнято. Ми звʼяжемось з вами найближчим часом.</p>
                <a href={`https://instagram.com/mini.mihandmade`} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 font-semibold text-white">Написати в Instagram</a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2">
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ваше імʼя" className="w-full rounded-lg border border-black/15 px-3 py-2" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="Телефон" className="w-full rounded-lg border border-black/15 px-3 py-2" />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={saving} className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">{saving ? 'Зберігаємо...' : 'Оформити замовлення'}</button>
                <button type="button" onClick={clear} className="w-full text-sm text-foreground/50 hover:underline">Очистити кошик</button>
              </form>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
