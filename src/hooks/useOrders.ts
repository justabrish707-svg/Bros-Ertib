import { useState, useEffect } from 'react';
import { Order } from '../types';
import { User } from 'firebase/auth';
import { db, collection, onSnapshot, query, orderBy } from '../firebase';

export const useOrders = (isAdminView: boolean, user: User | null) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!isAdminView || !user) return;

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Order, 'id'>),
      }));
      setOrders(ordersData);
    }, (error) => {
      console.error('Firestore Error fetching orders:', error);
    });

    return () => unsubscribe();
  }, [isAdminView, user]);

  return { orders };
};
