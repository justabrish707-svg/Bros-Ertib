import { Order } from '../types';

// Base URL for backend API — set VITE_API_URL in .env for split deployments
let API_BASE_URL = (import.meta as any).env.VITE_API_URL || '';

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

if (window.location.hostname.includes('vercel.app') && !API_BASE_URL) {
  console.warn('⚠️ VITE_API_URL is missing! Backend notifications and payments will NOT work.');
}

export { API_BASE_URL };

export const sendTelegramNotification = async (order: Partial<Order> & { id: string }): Promise<void> => {
  if (!API_BASE_URL && window.location.hostname.includes('vercel.app')) {
    console.error('Cannot send notification: No backend URL configured.');
    return;
  }
  const response = await fetch(`${API_BASE_URL}/api/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || errorData.error || 'Failed to send Telegram notification.');
  }
};
