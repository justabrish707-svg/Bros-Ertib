import { Order } from '../types';

// Base URL for backend API
// - On Vercel: leave VITE_API_URL empty — /api/notify is a serverless function on the same domain
// - On split deployments (e.g. Railway backend): set VITE_API_URL to your backend URL
let API_BASE_URL = (import.meta as any).env.VITE_API_URL || '';

// If empty, default to current origin (works seamlessly on localhost and Vercel)
if (!API_BASE_URL && typeof window !== 'undefined') {
  API_BASE_URL = window.location.origin;
}

// Sanitize: Remove trailing slash
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

// Sanitize: Add https:// if missing and not a relative path
if (API_BASE_URL && !API_BASE_URL.startsWith('http')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}

if (API_BASE_URL.includes('.internal')) {
  console.warn('⚠️ You are using a .internal address! This will NOT work from Vercel.');
}

export { API_BASE_URL };

export const sendTelegramNotification = async (order: Partial<Order> & { id: string }): Promise<void> => {
  // On Vercel, /api/notify is a same-domain serverless function — relative URL works fine
  // On split deployments, API_BASE_URL points to the external backend
  const endpoint = `${API_BASE_URL}/api/notify`;

  // Create a clean, perfectly serializable payload (strips complex Firestore Timestamp instances)
  const cleanOrder = {
    id: order.id,
    customerName: order.customerName || '',
    phoneNumber: order.phoneNumber || '',
    location: order.location || '',
    itemName: order.itemName || '',
    quantity: order.quantity || 1,
    totalPrice: order.totalPrice || 0,
    specialInstructions: order.specialInstructions || '',
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ order: cleanOrder }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || errorData.error || 'Failed to send Telegram notification.');
  }
};
