import Header from '@/components/Header'
import Catalog from '@/components/Catalog'
import CartDrawer from '@/components/cart/CartDrawer'
import { Hero, About, Reviews, Contacts, Footer } from '@/components/Sections'

export default function Home() {
  return (
      <>
            <Header />
                  <main>
                          <Hero />
                                  <About />
                                          <Catalog />
                                                  <Reviews />
                                                          <Contacts />
                                                                </main>
                                                                      <Footer />
                                                                            <CartDrawer />
                                                                                </>
                                                                                  )
                                                                                  }
                                                                                  
