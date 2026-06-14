import Header from '@/components/Header'
import Catalog from '@/components/Catalog'
import CartDrawer from '@/components/cart/CartDrawer'
import { Hero, About, Reviews, Footer } from '@/components/Sections'
import Contacts from '@/components/ContactsSection'

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
                                                                                  
