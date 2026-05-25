import { useState, FormEvent, useEffect } from 'react';
import { addDoc, collection, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './firebase';
import { Language } from './translations';
import { Order } from './types';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useOrders } from './hooks/useOrders';

// Utils
import { sendTelegramNotification } from './utils/api';

// Components
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import StorySection from './components/StorySection';
import ReviewsSection from './components/ReviewsSection';
import MenuSection from './components/MenuSection';
import GallerySection from './components/GallerySection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import OrderModal from './components/OrderModal';
import AdminDashboard from './components/admin/AdminDashboard';

export default function App() {
  // --- Global UI State ---
  const [language, setLanguage] = useState<Language>('en');
  const [isAdminView, setIsAdminView] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; success: boolean; message: string } | null>(null);

  // --- Order Modal State ---
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<(Partial<Order> & { id: string }) | null>(null);

  // --- Data Hooks ---
  const { user } = useAuth();
  const { menuItems } = useProducts();
  const { orders } = useOrders(isAdminView, user);

  // --- Redirect Callback Listener & Toast auto-clear ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success') === 'true';
    const canceled = params.get('canceled') === 'true';
    const orderId = params.get('orderId');
    const method = params.get('method');

    if (success && orderId) {
      const fetchRedirectedOrder = async () => {
        try {
          const orderDoc = await getDoc(doc(db, 'orders', orderId));
          if (orderDoc.exists()) {
            const data = orderDoc.data();
            const fetchedOrder = { ...data, id: orderDoc.id } as Order;
            setLastOrder(fetchedOrder);
            setOrderSuccess(true);
            setIsOrderModalOpen(true);

            setToast({
              show: true,
              success: true,
              message: method === 'chapa'
                ? 'Telebirr/CBE payment completed! Bro is cooking!'
                : 'Stripe payment completed! Bro is cooking!',
            });
          }
        } catch (err: any) {
          console.error('Failed to fetch redirected order:', err);
        }
      };
      fetchRedirectedOrder();

      // Clean query params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (canceled) {
      setToast({
        show: true,
        success: false,
        message: 'Payment was canceled. Choose pay on delivery or try again!',
      });
      // Clean query params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, show: false } : null));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Handlers ---
  const openOrderModal = (itemId?: string) => {
    setSelectedItemId(itemId || '');
    setOrderSuccess(false);
    setLastOrder(null);
    setIsOrderModalOpen(true);
  };

  const closeOrderModal = () => {
    setIsOrderModalOpen(false);
    setSelectedItemId('');
    setOrderSuccess(false);
    setLastOrder(null);
  };

  const handleOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    const itemId = selectedItemId || (data.get('itemId') as string);
    const item = menuItems.find((m) => m.id === itemId);
    if (!item) {
      alert('Please select a valid menu item.');
      setIsSubmitting(false);
      return;
    }

    const quantity = Number(data.get('quantity')) || 1;
    const totalPrice = item.price * quantity;

    // Include telegramNotificationStatus as 'pending' in the initial write.
    // This avoids a second updateDoc (which would need admin perms).
    // Status is updated to 'sent' or left 'failed' via the admin retry UI.
    const orderData = {
      itemId: item.id,
      itemName: item.name,
      quantity,
      customerName: data.get('customerName') as string,
      phoneNumber: data.get('phoneNumber') as string,
      location: data.get('location') as string,
      specialInstructions: (data.get('specialInstructions') as string) || '',
      totalPrice,
      status: 'pending' as const,
      paymentMethod: (data.get('paymentMethod') as Order['paymentMethod']) || 'delivery',
      paymentStatus: 'pending' as const,
      telegramNotificationStatus: 'pending' as const,
      createdAt: Timestamp.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      const savedOrder = { ...orderData, id: docRef.id };

      // Fire Telegram notification silently — admin retry handles failures.
      sendTelegramNotification(savedOrder).catch((err) => {
        console.error('Telegram notification failed (admin can retry from dashboard):', err);
      });

      // Handle payment redirection if selected method is stripe or chapa
      if (orderData.paymentMethod === 'stripe' || orderData.paymentMethod === 'chapa') {
        const isChapa = orderData.paymentMethod === 'chapa';
        const endpoint = isChapa ? '/api/create-chapa-session' : '/api/create-checkout-session';

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: savedOrder }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || errData.error || `HTTP ${response.status}`);
          }

          const data = await response.json();
          const redirectUrl = isChapa ? data.checkout_url : data.url;

          if (redirectUrl) {
            // Clean modal states and redirect
            form.reset();
            setSelectedItemId('');
            setIsOrderModalOpen(false);
            window.location.href = redirectUrl;
            return; // redirecting browser
          } else {
            throw new Error('No checkout redirect URL was provided by the payment gateway.');
          }
        } catch (paymentError: any) {
          console.error('Online checkout creation failed:', paymentError);
          // Set payment status as failed in firestore
          await updateDoc(doc(db, 'orders', docRef.id), {
            paymentStatus: 'failed',
          });
          alert(`Order was saved, but we couldn't initiate your online payment session: ${paymentError.message || paymentError}. Please contact administration or try another method.`);
        }
      }

      // If method is delivery (or payment session creation failed), show the local success modal
      setLastOrder(savedOrder);
      setOrderSuccess(true);
      form.reset();
      setSelectedItemId('');

      // Auto-close after 4s
      setTimeout(() => closeOrderModal(), 4000);
    } catch (error: any) {
      console.error('Error submitting order:', error);
      alert(`Failed to submit order to database: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render ---
  if (isAdminView) {
    return (
      <AdminDashboard
        language={language}
        user={user}
        orders={orders}
        menuItems={menuItems}
        onExitAdmin={() => setIsAdminView(false)}
      />
    );
  }

  return (
    <div className="bg-luxury-black text-white min-h-screen font-sans">
      <Header
        language={language}
        onLanguageToggle={() => setLanguage((l) => (l === 'en' ? 'am' : 'en'))}
        onAdminOpen={() => setIsAdminView(true)}
        onOrderOpen={() => openOrderModal()}
      />

      <main>
        <HeroSection language={language} onOrderOpen={() => openOrderModal()} />
        <StorySection language={language} />
        <ReviewsSection />
        <MenuSection
          language={language}
          menuItems={menuItems}
          onOrderItem={(itemId) => openOrderModal(itemId)}
        />
        <GallerySection language={language} />
        <ContactSection language={language} />
      </main>

      <Footer language={language} />

      <OrderModal
        language={language}
        isOpen={isOrderModalOpen}
        onClose={closeOrderModal}
        menuItems={menuItems}
        selectedItemId={selectedItemId}
        onItemChange={setSelectedItemId}
        orderSuccess={orderSuccess}
        lastOrder={lastOrder}
        isSubmitting={isSubmitting}
        onSubmit={handleOrderSubmit}
      />

      {/* Premium Toast Notification Overlay */}
      <AnimatePresence>
        {toast && toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 100 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed bottom-6 right-6 z-100 flex items-center gap-4 p-5 rounded-2xl border backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] max-w-sm ${
              toast.success
                ? 'bg-luxury-gray/90 border-gold/30 text-white'
                : 'bg-luxury-gray/90 border-red-500/30 text-white'
            }`}
          >
            <div className={`p-2 rounded-xl ${toast.success ? 'bg-gold/10 text-gold' : 'bg-red-500/10 text-red-500'}`}>
              {toast.success ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            </div>
            <div className="flex-1 col-span-3">
              <h4 className="font-bold text-xs uppercase tracking-widest mb-0.5 text-gold">
                {toast.success ? 'Payment Verified' : 'Payment Status'}
              </h4>
              <p className="text-gray-300 text-xs leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast((prev) => prev ? { ...prev, show: false } : null)}
              className="p-1 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors cursor-pointer self-start"
            >
              <XCircle size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
