'use client'

import { useEffect, useRef } from 'react'

type Ball = {
  el: HTMLSpanElement
  x: number
  y: number
  ease: number
}

const BALLS = [
  { size: 120, color: 'rgba(232, 168, 124, 0.45)', ease: 0.08 },
  { size: 90, color: 'rgba(233, 184, 176, 0.40)', ease: 0.055 },
  { size: 60, color: 'rgba(200, 100, 60, 0.30)', ease: 0.10 },
  { size: 150, color: 'rgba(232, 168, 124, 0.25)', ease: 0.035 },
]

export default function YarnCursor() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reduce = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const rect0 = container.getBoundingClientRect()
    let targetX = rect0.width / 2
    let targetY = rect0.height / 2

    const balls: Ball[] = Array.from(container.children).map((child, i) => ({
      el: child as HTMLSpanElement,
      x: targetX,
      y: targetY,
      ease: BALLS[i].ease,
    }))

    function onMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect()
      targetX = e.clientX - rect.left
      targetY = e.clientY - rect.top
    }

    let raf = 0
    function tick() {
      balls.forEach((b) => {
        b.x += (targetX - b.x) * b.ease
        b.y += (targetY - b.y) * b.ease
        b.el.style.transform = 'translate3d(' + (b.x) + 'px, ' + (b.y) + 'px, 0) translate(-50%, -50%)'
      })
      raf = requestAnimationFrame(tick)
    }

    const parent = container.parentElement ?? container
    parent.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)

    return () => {
      parent.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {BALLS.map((b, i) => (
        <span
          key={i}
          className="absolute left-0 top-0 rounded-full blur-2xl will-change-transform"
          style={{ width: b.size, height: b.size, background: b.color }}
        />
      ))}
    </div>
  )
}
