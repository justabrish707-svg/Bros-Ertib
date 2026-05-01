import { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { db, collection, addDoc, onSnapshot, query, orderBy, Timestamp } from '../firebase';

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'default-1',
    name: "Bro's Special እርጥብ",
    description: "Double-stacked, secret Bro's sauce, and artisanal eggs.",
    price: 80,
    image: '/images/bros-special.jpg',
    category: 'Foods',
  },
  {
    id: 'default-2',
    name: "Bro's እርጥብ",
    description: 'The wet, spicy heart of Arba Minch. A local masterpiece.',
    price: 50,
    image: '/images/bros-ertib.jpg',
    category: 'Foods',
  },
  {
    id: 'default-3',
    name: 'Ayinet / አይነት',
    description: 'Traditional Ethiopian fasting food with a variety of delicious stews.',
    price: 70,
    image: '/images/Ayinet.jpg',
    category: 'Foods',
  },
  {
    id: 'default-4',
    name: 'Coca Cola (500ml)',
    description: 'Ice cold Coca Cola to refresh your soul.',
    price: 25,
    image: '/images/500ml Coca Cola Soft Drink.jpg',
    category: 'Soft Drinks',
  },
  {
    id: 'default-5',
    name: 'Fanta Orange (330ml)',
    description: 'Sweet, bubbly, and full of orange flavor.',
    price: 25,
    image: '/images/Fanta-Orange-Glass-330ml-.png',
    category: 'Soft Drinks',
  },
  {
    id: 'default-6',
    name: 'Sprite (540ml)',
    description: 'Crisp, refreshing, and clean tasting Sprite.',
    price: 25,
    image: '/images/sprite-540x600.jpg',
    category: 'Soft Drinks',
  },
  {
    id: 'default-7',
    name: 'Mirinda (300ml)',
    description: 'Fruity and fun orange Mirinda.',
    price: 25,
    image: '/images/mirinda 300ml.avif',
    category: 'Soft Drinks',
  },
];

export const useProducts = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed database with defaults if empty
        DEFAULT_MENU_ITEMS.forEach(async (item) => {
          try {
            await addDoc(collection(db, 'products'), {
              name: item.name,
              description: item.description,
              price: item.price,
              image: item.image,
              category: item.category,
              createdAt: Timestamp.now(),
            });
          } catch (e) {
            console.error('Error seeding default product:', e);
          }
        });
      } else {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<MenuItem, 'id'>),
        }));
        setMenuItems(productsData);
      }
    }, (error) => {
      console.error('Firestore Error fetching products:', error);
    });

    return () => unsubscribe();
  }, []);

  return { menuItems };
};
