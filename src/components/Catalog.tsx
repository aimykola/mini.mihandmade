'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { products as fallbackProducts, type Product } from '@/lib/products'
import { supabase } from '@/lib/supabase'
import { useCart } from './cart/CartContext'

type DbProduct = {
  slug: string | null
  name: string
  description: string | null
  price: number
  category: string
  image: string | null
  images: string[] | null
  in_stock: boolean | null
  discount: number | null
  sizes: string[] | null
}

function ProductCard({ p, onAdd }: { p: Product; onAdd: (p: Product) => void }) {
  const gallery = p.images && p.images.length > 0 ? p.images : [p.image]
  const [index, setIndex] = useState(0)
  const [full, setFull] = useState(false)
  const total = gallery.length
  const current = gallery[Math.min(index, total - 1)]
  const discount = p.discount ?? 0

  function prev() {
    setIndex((i) => (i - 1 + total) % total)
  }
  function next() {
    setIndex((i) => (i + 1) % total)
  }

  return (
    <article className="group/card flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-brand-soft/60 hover:shadow-xl">
      <div className="group relative aspect-square w-full bg-brand-soft/20">
        <Image src={current} alt={p.name} fill className="cursor-zoom-in object-cover transition-transform duration-500 ease-out group-hover/card:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
        <button type="button" onClick={() => setFull(true)} aria-label="Збільшити фото" className="absolute inset-0 z-[5] cursor-zoom-in" />
        {discount > 0 && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-brand px-3 py-1 text-sm font-semibold text-white shadow-md">−{discount}%</span>
        )}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Попереднє фото"
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-brand-dark shadow-md backdrop-blur transition hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Наступне фото"
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-brand-dark shadow-md backdrop-blur transition hover:bg-white"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Фото ${i + 1}`}
                  className={`h-2 w-2 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {full && createPortal(<div onClick={() => setFull(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"><button type="button" onClick={(e) => { e.stopPropagation(); setFull(false) }} aria-label="Закрити" className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white transition hover:bg-white/30">×</button><Image src={current} alt={p.name} width={1200} height={1200} className="max-h-[88vh] w-auto cursor-default object-contain" />{total > 1 && (<><button type="button" onClick={(e) => { e.stopPropagation(); prev() }} aria-label="Попереднє фото" className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white transition hover:bg-white/30">‹</button><button type="button" onClick={(e) => { e.stopPropagation(); next() }} aria-label="Наступне фото" className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white transition hover:bg-white/30">›</button></>)}</div>, document.body)}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold">{p.name}</h3>
        <span className={`mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${p.in_stock === false ? 'bg-[#fbeee2] text-[#b5552e]' : 'bg-[#f0e6da] text-[#9c8a78]'}`}>{p.in_stock === false ? 'В наявності' : 'Під замовлення'}</span>
        <p className="mt-1 flex-1 text-sm text-foreground/70">{p.description}</p>
        {p.sizes && p.sizes.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-foreground/50">Розміри:</span>
            {p.sizes.map((s) => (
              <span key={s} className="rounded-full bg-[#f0e6da] px-2 py-0.5 text-xs font-medium text-[#9c8a78]">{s}</span>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          {discount > 0 ? (
            <span className="flex items-baseline gap-2"><span className="text-sm text-foreground/40 line-through">{p.price} грн</span><span className="text-xl font-extrabold text-[#b5552e]">{Math.round(p.price * (1 - discount / 100))} грн</span></span>
          ) : (
            <span className="text-xl font-extrabold text-brand-dark">{p.price} грн</span>
          )}
          <button onClick={() => onAdd(p)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">В кошик</button>
        </div>
      </div>
    </article>
  )
}

type CategoryFilter = 'all' | 'pled' | 'cardigan'
type SortOption = 'default' | 'price-asc' | 'price-desc'
type Availability = 'all' | 'instock' | 'order'

function getParam(key: string): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get(key) ?? ''
}

export default function Catalog() {
  const { add } = useCart()
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState<CategoryFilter>(() => {
    const c = getParam('cat')
    return c === 'pled' || c === 'cardigan' ? c : 'all'
  })
  const [onlySale, setOnlySale] = useState(() => getParam('sale') === '1')
  const [availability, setAvailability] = useState<Availability>(() => {
    const a = getParam('av')
    return a === 'instock' || a === 'order' ? a : 'all'
  })
  const [sort, setSort] = useState<SortOption>(() => {
    const s = getParam('sort')
    return s === 'price-asc' || s === 'price-desc' ? s : 'default'
  })
  const [query, setQuery] = useState(() => getParam('q'))
  const [minPrice, setMinPrice] = useState(() => getParam('min'))
  const [maxPrice, setMaxPrice] = useState(() => getParam('max'))

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('slug, name, description, price, category, image, images, sizes, in_stock, discount')
        .eq('active', true)
        .order('created_at', { ascending: true })
      if (!error && data && data.length > 0) {
        const mapped: Product[] = (data as DbProduct[]).map((p) => ({
          id: p.slug ?? p.name,
          name: p.name,
          description: p.description ?? '',
          price: p.price,
          discount: p.discount ?? 0,
          category: (p.category === 'cardigan' ? 'cardigan' : 'pled'),
          image: p.image ?? '/products/pled-1.jpg',
          images: (p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : [])),
          in_stock: p.in_stock ?? true,
          sizes: p.sizes ?? [],
        }))
        setProducts(mapped)
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams()
    if (category !== 'all') params.set('cat', category)
    if (onlySale) params.set('sale', '1')
    if (availability !== 'all') params.set('av', availability)
    if (sort !== 'default') params.set('sort', sort)
    if (query.trim()) params.set('q', query.trim())
    if (minPrice.trim()) params.set('min', minPrice.trim())
    if (maxPrice.trim()) params.set('max', maxPrice.trim())
    const qs = params.toString()
    const url = window.location.pathname + (qs ? `?${qs}` : '') + '#catalog'
    window.history.replaceState(null, '', url)
  }, [category, onlySale, availability, sort, query, minPrice, maxPrice])

  const visible = useMemo(() => {
    const min = minPrice.trim() ? Number(minPrice) : null
    const max = maxPrice.trim() ? Number(maxPrice) : null
    let list = products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (onlySale && (p.discount ?? 0) <= 0) return false
      const inStock = p.in_stock === false
      if (availability === 'instock' && !inStock) return false
      if (availability === 'order' && inStock) return false
      const eff = Math.round(p.price * (1 - (p.discount ?? 0) / 100))
      if (min !== null && !Number.isNaN(min) && eff < min) return false
      if (max !== null && !Number.isNaN(max) && eff > max) return false
      if (query.trim() && !p.name.toLowerCase().includes(query.trim().toLowerCase())) return false
      return true
    })
    const eff = (p: Product) => Math.round(p.price * (1 - (p.discount ?? 0) / 100))
    if (sort === 'price-asc') list = [...list].sort((a, b) => eff(a) - eff(b))
    if (sort === 'price-desc') list = [...list].sort((a, b) => eff(b) - eff(a))
    return list
  }, [products, category, onlySale, availability, sort, query, minPrice, maxPrice])

  const saleCount = useMemo(() => products.filter((p) => (p.discount ?? 0) > 0).length, [products])

  function resetFilters() {
    setCategory('all')
    setOnlySale(false)
    setAvailability('all')
    setSort('default')
    setQuery('')
    setMinPrice('')
    setMaxPrice('')
  }

  const filtersActive = category !== 'all' || onlySale || availability !== 'all' || sort !== 'default' || query.trim() !== '' || minPrice.trim() !== '' || maxPrice.trim() !== ''

  const tabs: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'Всі' },
    { key: 'pled', label: 'Пледи' },
    { key: 'cardigan', label: 'Кардигани' },
  ]

  const availTabs: { key: Availability; label: string }[] = [
    { key: 'all', label: 'Будь-яка' },
    { key: 'instock', label: 'В наявності' },
    { key: 'order', label: 'Під замовлення' },
  ]

  return (
    <section id="catalog" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-3xl font-extrabold text-brand-dark">Наші вироби</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-foreground/70">Пледи та кардигани ручної роботи із гіпоалергенної пряжі</p>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground/60">Категорія:</span>
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setCategory(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${category === t.key ? 'bg-brand text-white shadow' : 'bg-brand-soft/20 text-brand-dark hover:bg-brand-soft/40'}`}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOnlySale((v) => !v)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${onlySale ? 'bg-brand text-white shadow' : 'bg-brand-soft/20 text-brand-dark hover:bg-brand-soft/40'}`}
            >
              Зі знижкою{saleCount > 0 ? ` (${saleCount})` : ''}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук за назвою..."
              className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none transition focus:border-brand sm:w-48"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-brand-dark outline-none transition focus:border-brand"
            >
              <option value="default">За замовчуванням</option>
              <option value="price-asc">Дешевші спершу</option>
              <option value="price-desc">Дорожчі спершу</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-black/5 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground/60">Наявність:</span>
            {availTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setAvailability(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${availability === t.key ? 'bg-brand text-white shadow' : 'bg-brand-soft/20 text-brand-dark hover:bg-brand-soft/40'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground/60">Ціна, грн:</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="від"
              className="w-24 rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none transition focus:border-brand"
            />
            <span className="text-foreground/40">—</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="до"
              className="w-24 rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none transition focus:border-brand"
            />
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full px-4 py-2 text-sm font-semibold text-brand-dark underline-offset-2 transition hover:underline sm:ml-auto"
            >
              Скинути фільтри
            </button>
          )}
        </div>
      </div>

      {!loading && (
        <p className="mt-4 text-sm text-foreground/60">Знайдено: {visible.length}</p>
      )}

      {loading && products.length === 0 ? (
        <p className="mt-10 text-center text-foreground/50">Завантаження...</p>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-center text-foreground/50">Нічого не знайдено</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p.id} p={p} onAdd={add} />
          ))}
        </div>
      )}
    </section>
  )
}
