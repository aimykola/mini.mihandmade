'use client'

import { useState, useEffect, useRef } from 'react'
import { useCart } from './CartContext'
import { supabase } from '@/lib/supabase'
import Turnstile from '@/components/Turnstile'

type Area = { name: string }
type City = { ref: string; name: string; present: string; area: string }
type Warehouse = { ref: string; number: string; description: string }

export default function CartDrawer() {
  const { items, isOpen, close, remove, setQty, total, clear, count } = useCart()

  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+380')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [payment, setPayment] = useState<'cod' | 'card'>('cod')
  const [wantRegister, setWantRegister] = useState(false)

  // Оплата при отриманні доступна лише коли ВСІ товари в наявності.
  // Якщо хоч один товар під замовлення — лише повна передплата карткою.
  const allInStock = items.every((i) => i.product.in_stock !== false)
  useEffect(() => {
    if (!allInStock) setPayment('card')
  }, [allInStock])

  // Nova Poshta cascade
  const [areas, setAreas] = useState<Area[]>([])
  const [area, setArea] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [cities, setCities] = useState<City[]>([])
  const [city, setCity] = useState<City | null>(null)
  const [showCities, setShowCities] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehouse, setWarehouse] = useState('')

  const [sent, setSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const cityBoxRef = useRef<HTMLDivElement>(null)

  // Load regions list once on checkout
  useEffect(() => {
    if (step !== 'checkout' || areas.length) return
    fetch('/api/np?action=areas')
      .then((r) => r.json())
      .then((d) => setAreas(d.items || []))
      .catch(() => {})
  }, [step, areas.length])

  // City autocomplete
  useEffect(() => {
    if (cityQuery.trim().length < 2) { setCities([]); return }
    const t = setTimeout(() => {
      const params = new URLSearchParams({ action: 'cities', q: cityQuery.trim() })
      if (area) params.set('area', area)
      fetch('/api/np?' + params.toString())
        .then((r) => r.json())
        .then((d) => setCities(d.items || []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [cityQuery, area])

  // Warehouses when a city is chosen
  useEffect(() => {
    if (!city) { setWarehouses([]); return }
    fetch('/api/np?action=warehouses&cityRef=' + encodeURIComponent(city.ref))
      .then((r) => r.json())
      .then((d) => setWarehouses(d.items || []))
      .catch(() => {})
  }, [city])

  // Close city dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (cityBoxRef.current && !cityBoxRef.current.contains(e.target as Node)) setShowCities(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!isOpen) return null

  const pickCity = (c: City) => {
    setCity(c)
    setCityQuery(c.name)
    setShowCities(false)
    setWarehouse('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (name.trim().length < 2) { setError('Вкажіть ПІБ'); return }
    if (phone.replace(/\D/g, '').length < 10) { setError('Вкажіть коректний номер телефону'); return }
    if (!city) { setError('Оберіть місто'); return }
    if (!warehouse) { setError('Оберіть відділення Нової Пошти'); return }
    if (payment === 'card' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Вкажіть email — на нього надішлемо реквізити для оплати'); return }
    // Soft captcha: do not block order if token is missing (widget may be unavailable). Server verifies in soft mode.

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const orderItems = items.map((i) => ({ id: i.product.id, name: i.product.name, price: i.product.price, qty: i.qty, size: i.size, color: i.color }))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id ?? null,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          comment: comment.trim(),
          paymentMethod: payment,
          customerEmail: email.trim(),
          npArea: area,
          npCity: city.name,
          npCityRef: city.ref,
          npWarehouse: warehouse,
          items: orderItems,
        captchaToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'error')

      // If logged in, keep their profile contact info fresh
      if (user) {
        await supabase.from('profiles').upsert({ id: user.id, full_name: name.trim(), phone: phone.trim() }, { onConflict: 'id' })
      }

      clear()
      setSent(true)
    } catch (err) {
      setError(err instanceof Error && err.message !== 'error' ? err.message : 'Не вдалося оформити замовлення. Спробуйте ще раз.')
    } finally {
      setSaving(false)
    }
  }

  const fieldCls = 'w-full border-0 border-b border-brand-soft bg-transparent px-0 py-2 text-foreground placeholder:text-foreground/40 focus:border-brand focus:outline-none focus:ring-0'

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-brand-soft p-4">
          <h2 className="text-lg font-bold text-foreground">
                        {step === 'cart' ? `Кошик (${count})` : 'Оформлення замовлення'}
          </h2>
          <button onClick={close} aria-label="Закрити" className="rounded-full px-3 py-1 text-2xl leading-none hover:bg-brand-soft/30">×</button>
        </div>

        {/* ---------- CART STEP ---------- */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <p className="mt-8 text-center text-foreground/60">Кошик порожній</p>
              ) : (
                <ul className="space-y-4">
                  {items.map((i) => (
                    <li key={i.product.id + (i.size ? '__' + i.size : '') + (i.color ? '__' + i.color : '')} className="flex gap-3 rounded-xl border border-brand-soft p-3">
                      <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-brand-soft/30" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{i.product.name}</p>
                        {i.size && <p className="text-xs font-medium text-brand-dark">Розмір: {i.size}</p>}
                        {i.color && <p className="text-xs font-medium text-brand-dark">Колір: {i.color}</p>}
                        <p className="text-sm text-foreground/60">{i.product.price} грн</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button onClick={() => setQty(i.product.id, i.qty - 1, i.size, i.color)} className="h-7 w-7 rounded-full border border-brand-soft">−</button>
                          <span className="w-6 text-center">{i.qty}</span>
                          <button onClick={() => setQty(i.product.id, i.qty + 1, i.size, i.color)} className="h-7 w-7 rounded-full border border-brand-soft">+</button>
                          <button onClick={() => remove(i.product.id, i.size, i.color)} className="ml-auto text-sm text-brand-dark hover:underline">Видалити</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-brand-soft p-4">
                <div className="mb-3 flex justify-between text-lg font-bold"><span>Разом:</span><span>{total} грн</span></div>
                <button onClick={() => setStep('checkout')} className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark">Перейти до оформлення</button>
                <button type="button" onClick={clear} className="mt-2 w-full text-sm text-foreground/50 hover:underline">Очистити кошик</button>
              </div>
            )}
          </>
        )}

        {/* ---------- CHECKOUT STEP ---------- */}
        {step === 'checkout' && (
          <div className="flex-1 overflow-y-auto p-4">
            {sent ? (
              <div className="mt-6 rounded-xl bg-brand-soft/20 p-5 text-center">
                <p className="text-lg font-semibold text-brand-dark">Дякуємо, {name || 'друже'}!</p>
                <p className="mt-1 text-sm text-foreground/70">{payment === 'card' ? 'Замовлення прийнято! Реквізити для оплати надіслано на ваш email — оплатіть за ними, щоб підтвердити замовлення.' : 'Ваше замовлення прийнято. Ми звʼяжемось з вами найближчим часом для підтвердження.'}</p>
                <a href="https://instagram.com/mini.mihandmade" target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 font-semibold text-white">Написати в Instagram</a>
                <button type="button" onClick={() => { setSent(false); setStep('cart'); close(); }} className="mt-4 ml-2 inline-block rounded-lg border border-brand px-4 py-2 font-semibold text-brand hover:bg-brand-soft/30">Продовжити покупки</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Дані покупця */}
                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground/70">Дані покупця</h3>
                  <div className="space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Введіть ПІБ" className={fieldCls} />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+380" className={fieldCls} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required={payment === 'card'} placeholder={payment === 'card' ? 'Email (надішлемо реквізити для оплати)' : 'Email (необов’язково)'} className={fieldCls} />
                  <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Коментар до замовлення" className={fieldCls} />
                  </div>
                </section>

                {/* Доставка */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground/70">Доставка · Нова Пошта</h3>
                  <div className="space-y-3">
                    <select value={area} onChange={(e) => { setArea(e.target.value); setCity(null); setCityQuery(''); setWarehouse('') }} className={fieldCls}>
                      <option value="">Оберіть область</option>
                      {areas.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
                    </select>

                    <div ref={cityBoxRef} className="relative">
                      <input
                        value={cityQuery}
                        onChange={(e) => { setCityQuery(e.target.value); setCity(null); setShowCities(true) }}
                        onFocus={() => setShowCities(true)}
                        placeholder="Місто (введіть назву)"
                        className={fieldCls}
                      />
                      {showCities && cities.length > 0 && (
                        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-brand-soft bg-background shadow-lg">
                          {cities.map((c) => (
                            <li key={c.ref}>
                              <button type="button" onClick={() => pickCity(c)} className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-soft/30">{c.present || c.name}</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} disabled={!city} className={fieldCls}>
                      <option value="">{city ? 'Оберіть відділення' : 'Спочатку виберіть місто'}</option>
                      {warehouses.map((w) => <option key={w.ref} value={w.description}>{w.description}</option>)}
                    </select>
                  </div>
                </section>

                {/* Оплата */}
                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground/70">Оплата</h3>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm ${!allInStock ? 'opacity-40' : ''}`}>
                      <input type="radio" name="pay" checked={payment === 'cod'} onChange={() => setPayment('cod')} disabled={!allInStock} className="accent-brand" />
                      Оплата при отриманні
                    </label>
                    {!allInStock && (
                      <p className="text-xs text-brand">У кошику є товари під замовлення — доступна лише повна передплата карткою.</p>
                    )}
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="pay" checked={payment === 'card'} onChange={() => setPayment('card')} className="accent-brand" />
                      Оплатити карткою Visa/MasterCard
                    </label>
                  </div>
                </section>

                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input type="checkbox" checked={wantRegister} onChange={(e) => setWantRegister(e.target.checked)} className="accent-brand" />
                  Хочу зареєструватися
                </label>

                <div className="border-t border-brand-soft pt-3">
                  <div className="mb-3 flex justify-between text-lg font-bold"><span>Разом:</span><span>{total} грн</span></div>
                  {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
                  <button type="submit" disabled={saving} className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">{saving ? 'Оформлюємо...' : 'Оформити замовлення'}</button>
                  <button type="button" onClick={() => setStep('cart')} className="mt-2 w-full text-sm text-foreground/50 hover:underline">← Повернутися до кошика</button>
                  {wantRegister && (
                    <p className="mt-2 text-center text-xs text-foreground/50">Після оформлення ви зможете створити акаунт на сторінці реєстрації.</p>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
