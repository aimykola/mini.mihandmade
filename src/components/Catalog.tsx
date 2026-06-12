'use client'

  import Image from 'next/image'
import { products } from '@/lib/products'
    import { useCart } from './cart/CartContext'

    export default function Catalog() {
      const { add } = useCart()
  return (
        <section id="catalog" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-extrabold text-brand-dark">Наші вироби</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-foreground/70">Пледи та кардигани ручної роботи із гіпоалергенної пряжі</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {products.map((p) => (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:shadow-md">
                <div className="relative aspect-square w-full bg-brand-soft/20">
                  <Image src={p.image} alt={p.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="mt-1 flex-1 text-sm text-foreground/70">{p.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-extrabold text-brand-dark">{p.price} грн</span>
                    <button onClick={() => add(p)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">В кошик</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )
    }
    
