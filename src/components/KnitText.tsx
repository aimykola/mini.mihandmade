'use client'

import { type ElementType } from 'react'

type KnitTextProps = {
  text: string
  as?: ElementType
  className?: string
  stagger?: number
  startDelay?: number
}

export default function KnitText({
  text,
  as,
  className = '',
  stagger = 45,
  startDelay = 200,
}: KnitTextProps) {
  const Tag = (as ?? 'span') as ElementType
  const chars = Array.from(text)

  return (
    <Tag className={className} aria-label={text}>
      {chars.map((char, i) => {
        if (char === ' ') {
          return (
            <span key={i} aria-hidden>
              {'\u00A0'}
            </span>
          )
        }
        return (
          <span
            key={i}
            aria-hidden
            className="knit-letter inline-block"
            style={{ animationDelay: startDelay + i * stagger + 'ms' }}
          >
            {char}
          </span>
        )
      })}
    </Tag>
  )
}
