import { useState, FormEvent } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
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
      createdAt: Timestamp.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      const savedOrder = { ...orderData, id: docRef.id };
      setLastOrder(savedOrder);
      setOrderSuccess(true);
      form.reset();
      setSelectedItemId('');

      // Fire-and-forget Telegram notification
      sendTelegramNotification(savedOrder).catch((err) =>
        console.warn('Telegram notify failed (non-blocking):', err)
      );

      // Auto-close after 4s
      setTimeout(() => closeOrderModal(), 4000);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please check your connection and try again.');
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
    </div>
  );
}
