'use client'

  import { useCart } from './cart/CartContext'

    const links = [
{ href: '#catalog', label: 'Каталог' },
{ href: '#about', label: 'Про нас' },
{ href: '#reviews', label: 'Відгуки' },
{ href: '#contacts', label: 'Контакти' },
]

export default function Header() {
    const { count, open } = useCart()
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#top" className="text-xl font-extrabold tracking-tight text-brand-dark">MINIMI <span className="font-light text-foreground">handmade</span></a>
              <nav className="hidden gap-6 md:flex">
      {links.map((l) => (
                  <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/80 transition hover:text-brand">{l.label}</a>
                ))}
        </nav>
              <button onClick={open} className="relative rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">
                Кошик
      {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark text-xs">{count}</span>
                )}
        </button>
            </div>
          </header>
        )
      }
      
