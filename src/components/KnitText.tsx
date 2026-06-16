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
// Split into words so a word is never broken across lines.
  // Each word is an inline-block (no internal break); words are separated
  // by a normal breakable space, so wrapping only happens between words.
  const words = text.split(' ')
  let charIndex = 0

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, wi) => {
        const letters = Array.from(word).map((char) => {
          const delay = startDelay + charIndex * stagger
          charIndex += 1
          return (
            <span
              key={charIndex}
              aria-hidden
              className="knit-letter inline-block"
              style={{ animationDelay: delay + 'ms' }}
            >
              {char}
            </span>
          )
        })
        charIndex += 1 // account for the space between words
        return (
          <span key={wi}>
            <span className="inline-block whitespace-nowrap">{letters}</span>
            {wi < words.length - 1 ? ' ' : null}
          </span>
        )
      })}
    </Tag>
  )
}
