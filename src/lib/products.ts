export type Product = {
  id: string
    name: string
      description: string
        price: number
          category: 'pled' | 'cardigan'
            image: string
            }

            export const products: Product[] = [
              {
                  id: 'pled-cloud',
                      name: 'Плед «Хмаринка»',
                          description: 'Обʼємний плед із гіпоалергенної плюшевої пряжі. Ніжний та теплий.',
                              price: 1450,
                                  category: 'pled',
                                      image: '/products/pled-1.jpg',
                                        },
                                          {
                                              id: 'pled-terracotta',
                                                  name: 'Плед «Теракота»',
                                                      description: 'Великий вʼязаний плед у теплих теракотових тонах для затишних вечорів.',
                                                          price: 1650,
                                                              category: 'pled',
                                                                  image: '/products/pled-2.jpg',
                                                                    },
                                                                      {
                                                                          id: 'pled-mini',
                                                                              name: 'Плед «Міні» для малечі',
                                                                                  description: 'Компактний дитячий плед, мʼякий і безпечний для чутливої шкіри.',
                                                                                      price: 950,
                                                                                          category: 'pled',
                                                                                              image: '/products/pled-3.jpg',
                                                                                                },
                                                                                                  {
                                                                                                      id: 'cardigan-orange',
                                                                                                          name: 'Кардиган «Осінь»',
                                                                                                              description: 'Теплий вʼязаний кардиган ручної роботи. Обʼємне плетіння, вільний крій.',
                                                                                                                  price: 2100,
                                                                                                                      category: 'cardigan',
                                                                                                                          image: '/products/cardigan-1.jpg',
                                                                                                                            },
                                                                                                                              {
                                                                                                                                  id: 'cardigan-beige',
                                                                                                                                      name: 'Кардиган «Шишка»',
                                                                                                                                          description: 'Затишний кардиган із фактурним візерунком «шишка». Гіпоалергенна пряжа.',
                                                                                                                                              price: 2300,
                                                                                                                                                  category: 'cardigan',
                                                                                                                                                      image: '/products/cardigan-2.jpg',
                                                                                                                                                        },
                                                                                                                                                          {
                                                                                                                                                              id: 'cardigan-pink',
                                                                                                                                                                  name: 'Кардиган «Ніжність»',
                                                                                                                                                                      description: 'Ніжний рожевий кардиган для прохолодних днів. Мʼякий та легкий.',
                                                                                                                                                                          price: 2200,
                                                                                                                                                                              category: 'cardigan',
                                                                                                                                                                                  image: '/products/cardigan-3.jpg',
                                                                                                                                                                                    },
                                                                                                                                                                                    ]
                                                                                                                                                                                    
