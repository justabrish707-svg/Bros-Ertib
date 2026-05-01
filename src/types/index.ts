import { Timestamp } from 'firebase/firestore';
export type { Language } from '../translations';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable?: boolean;
  createdAt?: Timestamp;
}

export interface Order {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  customerName: string;
  phoneNumber: string;
  location: string;
  specialInstructions?: string;
  status: 'pending' | 'cooking' | 'delivered' | 'canceled';
  createdAt: Timestamp;
  totalPrice: number;
  paymentMethod: 'delivery' | 'chapa' | 'stripe';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

export type AdminTab = 'orders' | 'products' | 'analytics';
