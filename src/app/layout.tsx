import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart/CartContext'

const nunito = Nunito({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'MINIMI handmade — пледи та кардигани ручної роботи',
    description: 'Пледи та кардигани ручної роботи із гіпоалергенної пряжі. Доставка по всій Україні.',
    }

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
          <html lang="uk" className={nunito.variable}>
                <body>
                        <CartProvider>{children}</CartProvider>
                              </body>
                                  </html>
                                    )
                                    }
                                    
