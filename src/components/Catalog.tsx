'use client'

import { useEffect, useMemo, useState } from 'react'
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
}

function ProductCard({ p, onAdd }: { p: Product; onAdd: (p: Product) => void }) {
  const gallery = p.images && p.images.length > 0 ? p.images : [p.image]
  const [index, setIndex] = useState(0)
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
    <article className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:shadow-md">
      <div className="group relative aspect-square w-full bg-brand-soft/20">
        <Image src={current} alt={p.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
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
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold">{p.name}</h3>
        <span className={`mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${p.in_stock === false ? 'bg-[#fbeee2] text-[#b5552e]' : 'bg-[#f0e6da] text-[#9c8a78]'}`}>{p.in_stock === false ? 'В наявності' : 'Під замовлення'}</span>
        <p className="mt-1 flex-1 text-sm text-foreground/70">{p.description}</p>
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

export default function Catalog() {
  const { add } = useCart()
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState<CategoryFilter>('all')
  const [onlySale, setOnlySale] = useState(false)
  const [sort, setSort] = useState<SortOption>('default')
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('slug, name, description, price, category, image, images, in_stock, discount')
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
        }))
        setProducts(mapped)
      }
      setLoading(false)
    }
    load()
  }, [])

  const visible = useMemo(() => {
    let list = products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (onlySale && (p.discount ?? 0) <= 0) return false
      if (query.trim() && !p.name.toLowerCase().includes(query.trim().toLowerCase())) return false
      return true
    })
    const eff = (p: Product) => Math.round(p.price * (1 - (p.discount ?? 0) / 100))
    if (sort === 'price-asc') list = [...list].sort((a, b) => eff(a) - eff(b))
    if (sort === 'price-desc') list = [...list].sort((a, b) => eff(b) - eff(a))
    return list
  }, [products, category, onlySale, sort, query])

  const saleCount = useMemo(() => products.filter((p) => (p.discount ?? 0) > 0).length, [products])

  const tabs: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'Всі' },
    { key: 'pled', label: 'Пледи' },
    { key: 'cardigan', label: 'Кардигани' },
  ]

  return (
    <section id="catalog" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-3xl font-extrabold text-brand-dark">Наші вироби</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-foreground/70">Пледи та кардигани ручної роботи із гіпоалергенної пряжі</p>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
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
            <option value="price-asc">Спочатку дешевші</option>
            <option value="price-desc">Спочатку дорожчі</option>
          </select>
        </div>
      </div>

      {loading && products.length === 0 ? (
        <p className="mt-10 text-center text-foreground/50">Завантаження...</p>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-center text-foreground/50">Нічого не знайдено</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p.id} p={p} onAdd={add} />
          ))}
        </div>
      )}
    </section>
  )
}
