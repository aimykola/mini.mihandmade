'use client'

import { useEffect, useRef } from 'react'

// Cloudflare Turnstile widget. Privacy-friendly, no user tracking.
// If NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set, the widget renders nothing
// and the form works without a captcha (soft mode).

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit'

type Props = {
  onVerify: (token: string) => void
  onExpire?: () => void
}

export default function Turnstile({ onVerify, onExpire }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY) return // soft mode: no captcha configured
    const el = ref.current
    if (!el) return

    function renderWidget() {
      if (!window.turnstile || !el || widgetId.current) return
      widgetId.current = window.turnstile.render(el, {
        sitekey: SITE_KEY,
        callback: (token: string) => onVerify(token),
        'expired-callback': () => {
          onExpire?.()
        },
        'error-callback': () => {
          onExpire?.()
        },
        theme: 'light',
        appearance: 'always',
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      window.onTurnstileLoad = renderWidget
      if (!document.querySelector('script[data-turnstile]')) {
        const s = document.createElement('script')
        s.src = SCRIPT_SRC
        s.async = true
        s.defer = true
        s.setAttribute('data-turnstile', '1')
        document.head.appendChild(s)
      }
    }

    return () => {
      try {
        if (window.turnstile && widgetId.current) {
          window.turnstile.remove(widgetId.current)
        }
      } catch {}
      widgetId.current = null
    }
  }, [onVerify, onExpire])

  if (!SITE_KEY) return null
  return <div ref={ref} className="my-2 flex justify-center" />
}
