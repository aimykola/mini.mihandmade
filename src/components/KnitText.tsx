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
  const words = text.split(' ')
  let index = 0

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap" aria-hidden>
          {Array.from(word).map((char, ci) => {
            const delay = startDelay + index * stagger
            index += 1
            return (
              <span
                key={ci}
                className="knit-letter inline-block"
                style={{ animationDelay: delay + 'ms' }}
              >
                {char}
              </span>
            )
          })}
          {wi < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </Tag>
  )
}
