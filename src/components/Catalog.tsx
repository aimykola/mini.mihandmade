'use client'

import { useEffect, useState } from 'react'
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
  in_stock: boolean | null
  discount: number | null
}

export default function Catalog() {
  const { add } = useCart()
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('slug, name, description, price, category, image, in_stock, discount')
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
        in_stock: p.in_stock ?? true,
        }))
        setProducts(mapped)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <section id="catalog" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-3xl font-extrabold text-brand-dark">Наші вироби</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-foreground/70">Пледи та кардигани ручної роботи із гіпоалергенної пряжі</p>
      {loading && products.length === 0 ? (
        <p className="mt-10 text-center text-foreground/50">Завантаження...</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:shadow-md">
              <div className="relative aspect-square w-full bg-brand-soft/20">
                <Image src={p.image} alt={p.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                {p.discount > 0 && (<span className="absolute right-2 top-2 z-10 rounded-full bg-[#b5552e] px-2.5 py-1 text-sm font-bold text-white shadow-md">−{p.discount}%</span>)}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-lg font-bold">{p.name}</h3>
                <span className={`mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${p.in_stock !== false ? 'bg-[#fbeee2] text-[#b5552e]' : 'bg-[#f0e6da] text-[#9c8a78]'}`}>{p.in_stock !== false ? 'В наявності' : 'Під замовлення'}</span>
                <p className="mt-1 flex-1 text-sm text-foreground/70">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  {p.discount > 0 ? (<span className="flex items-baseline gap-2"><span className="text-sm text-foreground/40 line-through">{p.price} грн</span><span className="text-xl font-extrabold text-[#b5552e]">{Math.round(p.price * (1 - p.discount / 100))} грн</span></span>) : (<span className="text-xl font-extrabold text-brand-dark">{p.price} грн</span>)}
                  <button onClick={() => add(p)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">В кошик</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
