'use client'

import { useEffect, useRef } from 'react'

type Ball = {
  el: HTMLSpanElement
  x: number
  y: number
  ease: number
  ox: number
  oy: number
  speed: number
  radius: number
  phase: number
}

const BALLS = [
  { size: 150, color: 'rgba(200, 100, 60, 0.55)', ease: 0.085, speed: 0.0006, radius: 34, phase: 0 },
  { size: 110, color: 'rgba(232, 168, 124, 0.65)', ease: 0.06, speed: 0.0009, radius: 48, phase: 1.6 },
  { size: 75, color: 'rgba(233, 184, 176, 0.7)', ease: 0.11, speed: 0.0013, radius: 26, phase: 3.1 },
  { size: 190, color: 'rgba(232, 168, 124, 0.4)', ease: 0.035, speed: 0.0004, radius: 60, phase: 4.7 },
]

export default function YarnCursor() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const rect0 = container.getBoundingClientRect()
    let targetX = rect0.width / 2
    let targetY = rect0.height / 2

    const children = Array.from(container.children) as HTMLSpanElement[]
    const balls: Ball[] = children.map((el, i) => ({
      el,
      x: targetX,
      y: targetY,
      ease: BALLS[i].ease,
      ox: 0,
      oy: 0,
      speed: BALLS[i].speed,
      radius: BALLS[i].radius,
      phase: BALLS[i].phase,
    }))

    balls.forEach((b) => {
      b.el.style.transform =
        'translate3d(' + b.x + 'px, ' + b.y + 'px, 0) translate(-50%, -50%)'
    })

    function onMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect()
      targetX = e.clientX - rect.left
      targetY = e.clientY - rect.top
    }

    let raf = 0
    const start = performance.now()
    function tick(now: number) {
      const t = now - start
      balls.forEach((b) => {
        b.ox = Math.cos(t * b.speed + b.phase) * b.radius
        b.oy = Math.sin(t * b.speed * 1.3 + b.phase) * b.radius
        b.x += (targetX - b.x) * b.ease
        b.y += (targetY - b.y) * b.ease
        b.el.style.transform =
          'translate3d(' +
          (b.x + b.ox) +
          'px, ' +
          (b.y + b.oy) +
          'px, 0) translate(-50%, -50%)'
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
          className="absolute left-0 top-0 rounded-full blur-xl will-change-transform"
          style={{ width: b.size, height: b.size, background: b.color }}
        />
      ))}
    </div>
  )
}
