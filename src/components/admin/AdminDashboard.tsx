import { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ShoppingBag, Utensils, BarChart3, LogOut, Send } from 'lucide-react';
import { User } from 'firebase/auth';
import { AdminTab, Language, MenuItem, Order } from '../../types';
import { translations } from '../../translations';
import { logout } from '../../firebase';
import { signInWithGoogle } from '../../firebase';
import { API_BASE_URL } from '../../utils/api';
import OrdersTab from './OrdersTab';
import ProductsTab from './ProductsTab';
import AnalyticsTab from './AnalyticsTab';

interface Props {
  language: Language;
  user: User | null;
  orders: Order[];
  menuItems: MenuItem[];
  onExitAdmin: () => void;
}

export default function AdminDashboard({ language, user, orders, menuItems, onExitAdmin }: Props) {
  const t = translations[language];
  const [adminTab, setAdminTab] = useState<AdminTab>('orders');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [botTestResult, setBotTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testTelegramBot = async () => {
    setIsTestingBot(true);
    setBotTestResult(null);
    try {
      const testOrder = {
        id: 'TEST-' + Math.floor(Math.random() * 1000),
        customerName: 'Admin (Test)',
        phoneNumber: 'N/A',
        location: 'Admin Dashboard',
        itemName: 'Test Notification',
        quantity: 1,
        totalPrice: 0,
        specialInstructions: 'This is a test to verify the Telegram bot is working correctly.',
      };
      const response = await fetch(`${API_BASE_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: testOrder }),
      });
      const data = await response.json();
      setBotTestResult(response.ok
        ? { success: true, message: 'Test message sent successfully! Check your Telegram.' }
        : { success: false, message: data.error === 'Telegram credentials not configured.' ? 'Telegram credentials not configured in Settings.' : `Error: ${data.details || data.error}` }
      );
    } catch {
      setBotTestResult({ success: false, message: 'Failed to connect to the notification server.' });
    } finally {
      setIsTestingBot(false);
      setTimeout(() => setBotTestResult(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gold mb-2 flex items-center gap-3">
              <LayoutDashboard size={36} /> {t.admin.dashboard}
            </h1>
            <p className="text-gray-400">{t.admin.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {/* Test Bot */}
            <button
              onClick={testTelegramBot}
              disabled={isTestingBot}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 border ${
                botTestResult
                  ? botTestResult.success ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-red-500/10 border-red-500 text-red-500'
                  : 'border-gold/30 text-gold hover:bg-gold/10'
              }`}
            >
              <Send size={16} className={isTestingBot ? 'animate-pulse' : ''} />
              {isTestingBot ? t.admin.testing : botTestResult ? botTestResult.message : t.admin.testBot}
            </button>

            {/* Tabs */}
            <div className="bg-white/5 p-1 rounded-full border border-white/10 flex">
              {([['orders', ShoppingBag, t.admin.tabs.orders], ['products', Utensils, t.admin.tabs.products], ['analytics', BarChart3, t.admin.tabs.analytics]] as const).map(([tab, Icon, label]) => (
                <button
                  key={tab}
                  onClick={() => setAdminTab(tab)}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${adminTab === tab ? 'bg-gold text-luxury-black' : 'text-gray-400 hover:text-white'}`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            <button onClick={onExitAdmin} className="px-6 py-2 border border-white/20 rounded-full hover:bg-white/5 transition-all">
              {t.admin.customerView}
            </button>
            {user && (
              <button onClick={logout} className="px-6 py-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                <LogOut size={18} /> {t.admin.logout}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {!user ? (
          /* Login Card */
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md bg-luxury-gray border border-white/10 rounded-3xl p-10 shadow-[0_0_80px_rgba(212,175,55,0.08)] text-center"
            >
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gold/20">
                <LayoutDashboard size={28} className="text-gold" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t.admin.login.title}</h2>
              <p className="text-gray-400 text-sm mb-8">{t.admin.login.subtitle}</p>

              {authError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-left"
                >
                  <p className="text-red-400 font-semibold text-sm mb-1">{t.admin.login.accessDenied}</p>
                  <p className="text-red-300/80 text-xs leading-relaxed">{authError}</p>
                  <button onClick={() => setAuthError(null)} className="mt-3 text-xs text-red-400 hover:text-red-300 underline underline-offset-2">
                    {t.admin.login.tryDifferent}
                  </button>
                </motion.div>
              )}

              <button
                id="admin-google-login-btn"
                onClick={async () => {
                  setAuthLoading(true);
                  setAuthError(null);
                  try {
                    const result = await signInWithGoogle();
                    const email = result.user?.email ?? '';
                    const ALLOWED_EMAILS = (import.meta as any).env.VITE_ADMIN_EMAILS?.split(',') || ['justabrish707@gmail.com'];
                    if (!ALLOWED_EMAILS.includes(email)) {
                      await logout();
                      setAuthError(`The account "${email}" is not authorized as an admin.`);
                    }
                  } catch (err: any) {
                    if (err.code !== 'auth/popup-closed-by-user') {
                      setAuthError(err.code === 'auth/popup-blocked'
                        ? 'Popup was blocked by your browser. Please allow popups for this site.'
                        : `Login failed: ${err.message}`);
                    }
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 px-6 py-4 rounded-full font-semibold text-sm hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-60 shadow-lg"
              >
                {authLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {t.admin.login.signingIn}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t.admin.login.continueWithGoogle}
                  </>
                )}
              </button>
              <p className="text-gray-600 text-xs mt-6">{t.admin.login.authorizedOnly}</p>
            </motion.div>
          </div>
        ) : adminTab === 'orders' ? (
          <OrdersTab language={language} orders={orders} />
        ) : adminTab === 'products' ? (
          <ProductsTab language={language} menuItems={menuItems} />
        ) : (
          <AnalyticsTab language={language} orders={orders} />
        )}
      </div>
    </div>
  );
}
