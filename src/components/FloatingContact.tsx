'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Contacts = { phone: string; viber_url: string; telegram_url: string }

export default function FloatingContact() {
  const [open, setOpen] = useState(false)
  const [c, setC] = useState<Contacts>({ phone: '', viber_url: '', telegram_url: '' })

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('phone, viber_url, telegram_url')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data)
          setC({
            phone: data.phone ?? '',
            viber_url: data.viber_url ?? '',
            telegram_url: data.telegram_url ?? '',
          })
      })
  }, [])

  const digits = c.phone.replace(/[^\d+]/g, '')
  const telHref = digits ? `tel:${digits}` : ''
  const viberHref = c.viber_url || (digits ? `viber://chat?number=${encodeURIComponent(digits)}` : '')
  const telegramHref = c.telegram_url

  const items = [
    {
      label: 'Дзвінок',
      href: telHref,
      external: false,
      icon: (
        <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.58 3.6a1 1 0 0 1-.25 1l-2.23 2.2Z" />
      ),
    },
    {
      label: 'Viber',
      href: viberHref,
      external: false,
      icon: (
        <path d="M12 3c-4.97 0-9 3.36-9 7.5 0 2.3 1.25 4.36 3.2 5.73V20l2.94-1.62c.92.22 1.88.34 2.86.34 4.97 0 9-3.36 9-7.72S16.97 3 12 3Zm0 1.6c4.2 0 7.4 2.74 7.4 6.12 0 3.4-3.2 6.12-7.4 6.12-.9 0-1.78-.12-2.62-.34l-.4-.1-2.18 1.2v-2.4l-.5-.34C5.2 14.5 4.2 12.7 4.2 10.7c0-3.38 3.2-6.1 7.8-6.1Z" />
      ),
    },
    {
      label: 'Telegram',
      href: telegramHref,
      external: true,
      icon: (
        <path d="M21.5 4.3 2.9 11.5c-.9.36-.9 1.6.02 1.9l4.6 1.44 1.77 5.3c.25.6 1.04.7 1.45.2l2.5-2.96 4.7 3.46c.6.44 1.45.1 1.6-.62l3.3-15.1c.18-.82-.62-1.5-1.4-1.18Z" />
      ),
    },
  ].filter((it) => it.href)

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              target={it.external ? '_blank' : undefined}
              rel={it.external ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-brand-dark shadow-lg ring-1 ring-black/5 transition hover:bg-brand-soft/20"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  {it.icon}
                </svg>
              </span>
              {it.label}
            </a>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Закрити меню зв’язку' : 'Зв’язатися з нами'}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl ring-4 ring-brand/20 transition hover:bg-brand-dark active:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
          ) : (
            <path
              d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.58 3.6a1 1 0 0 1-.25 1l-2.23 2.2Z"
              fill="currentColor"
            />
          )}
        </svg>
      </button>
    </div>
  )
}
