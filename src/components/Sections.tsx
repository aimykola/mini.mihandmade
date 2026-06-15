import Image from 'next/image'
import Reveal from './Reveal'
import KnitText from './KnitText'

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
        <Reveal>
          <p className="font-semibold uppercase tracking-wider text-brand">MINIMI handmade</p>
          <KnitText as="h1" text="Пледи та кардигани ручної роботи з любовʼю" className="mt-3 block text-4xl font-extrabold leading-tight text-brand-dark md:text-5xl" />
          <p className="mt-4 max-w-md text-lg text-foreground/70">Ідеальне рішення для вашого комфорту. Гіпоалергенна пряжа, тепло та затишок у кожній петельці.</p>
          <div className="mt-6 flex gap-3">
            <a href="#catalog" className="rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark">Переглянути вироби</a>
            <a href="#contacts" className="rounded-lg border border-brand px-6 py-3 font-semibold text-brand-dark transition hover:bg-brand-soft/20">Звʼязатись</a>
          </div>
        </Reveal>
        <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-gradient-to-br from-brand-soft/40 to-accent-pink/40 p-6">
          <Image src="/logo.png" alt="MINIMI Handmade" width={420} height={420} className="knit-in logo-breathe h-auto w-5/6 max-w-md object-contain" priority />
        </div>
      </div>
    </section>
  )
}

const advantages = [
  { t: 'Гіпоалергенна пряжа', d: 'Безпечно для дітей та чутливої шкіри' },
  { t: 'Ручна робота', d: 'Кожен виріб створюється вручну з любовʼю' },
  { t: 'Доставка по Україні', d: 'Нова Пошта та інші служби' },
  { t: 'Виготовлення 3-8 днів', d: 'Швидко зберемо ваше замовлення' },
]

export function About() {
  return (
    <section id="about" className="bg-brand-soft/10 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal as="h2" className="text-center text-3xl font-extrabold text-brand-dark">Чому обирають нас</Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((a, i) => (
            <Reveal key={a.t} delay={i * 120} className="rounded-2xl bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <h3 className="font-bold text-brand-dark">{a.t}</h3>
              <p className="mt-2 text-sm text-foreground/70">{a.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

const reviews = [
  { n: 'Олена', t: 'Плед просто мрія! Дуже мʼякий і теплий, дитина в захваті.' },
  { n: 'Марія', t: 'Кардиган неймовірної якості. Дякую за роботу!' },
  { n: 'Ірина', t: 'Швидко зробили та відправили. Рекомендую!' },
]

export function Reviews() {
  return (
    <section id="reviews" className="mx-auto max-w-6xl px-4 py-16">
      <Reveal as="h2" className="text-center text-3xl font-extrabold text-brand-dark">Відгуки</Reveal>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={r.n} as="figure" delay={i * 120} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <blockquote className="text-foreground/80">{r.t}</blockquote>
            <figcaption className="mt-3 font-semibold text-brand-dark">{r.n}</figcaption>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Contacts() {
  return (
    <section id="contacts" className="bg-brand-soft/10 py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-extrabold text-brand-dark">Звʼяжіться з нами</h2>
        <p className="mt-3 text-foreground/70">Напишіть нам у Instagram, щоб замовити виріб або поставити запитання.</p>
        <a href="https://instagram.com/mini.mihandmade" target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-lg bg-brand px-8 py-3 font-semibold text-white transition hover:bg-brand-dark">@mini.mihandmade</a>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-black/10 py-8 text-center text-sm text-foreground/60">
      <p>© 2025 MINIMI handmade · Ручна робота з любовʼю</p>
    </footer>
  )
}
