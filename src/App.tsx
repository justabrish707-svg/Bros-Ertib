import { motion, AnimatePresence } from "motion/react";
import { Phone, MapPin, Clock, Star, Utensils, ChevronRight, Instagram, Facebook, Twitter, X, ShoppingBag, LayoutDashboard, LogOut, CheckCircle2, Timer, Trash2, Send, ArrowUp, BarChart3, PieChart as PieChartIcon, TrendingUp, Map as MapIcon, CreditCard } from "lucide-react";
import { useState, FormEvent, useEffect, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { db, auth, signInWithGoogle, logout, collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, Timestamp, onAuthStateChanged, User } from "./firebase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const MENU_ITEMS = [
  {
    id: 1,
    name: "Bro's Special እርጥብ",
    description: "Double-stacked, secret Bro's sauce, and artisanal eggs.",
    price: 80,
    image: "/images/bros-special.jpg",
  },
  {
    id: 2,
    name: "Bro's እርጥብ",
    description: "The wet, spicy heart of Arba Minch. A local masterpiece.",
    price: 50,
    image: "/images/bros-ertib.jpg",
  },
  {
    id: 3,
    name: "Fries / Chips",
    description: "Crispy. Hot. Addictive. One bite and your hands won't stop reaching.",
    price: 20,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 4,
    name: "Sambusa / ሳንቡሳ",
    description: "Hot. Crispy. Dangerous. One sambusa is never enough.",
    price: 25,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800",
  },
];

const REVIEWS = [
  {
    id: 1,
    text: "Yeah, this right here… this is Bro's እርጥብ star material. Gordon Ramsay might cry if he tasted this.",
    author: "Hizkias Kassahun",
    stars: 5,
  },
  {
    id: 2,
    text: "Best እርጥብ in Arba Minch. Hands down. The service is as good as the food.",
    author: "Usaama Mahdi Ali",
    stars: 5,
  },
];

// Base URL for backend API — set VITE_API_URL in .env for split deployments
// During development on localhost, we use the same origin.
let API_BASE_URL = (import.meta as any).env.VITE_API_URL || "";

// Sanitize: Remove trailing slash if user added it in Vercel settings
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

// Sanitize: Add https:// if missing and not a relative path
if (API_BASE_URL && !API_BASE_URL.startsWith('http')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}

if (API_BASE_URL.includes('.internal')) {
  console.warn("⚠️ You are using a .internal address! This will NOT work from Vercel. Please use your public .up.railway.app domain.");
}

if (window.location.hostname.includes('vercel.app') && !API_BASE_URL) {
  console.warn("⚠️ VITE_API_URL is missing! Backend notifications and payments will NOT work until you add your Railway/Render URL to Vercel Environment Variables.");
}

// Telegram Notification Helper
const sendTelegramNotification = async (order: any) => {
  if (!API_BASE_URL && window.location.hostname.includes('vercel.app')) {
     console.error("Cannot send notification: No backend URL configured.");
     return;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Telegram notification error:", errorData);
      throw new Error(errorData.details || errorData.error || "Failed to send Telegram notification.");
    }
  } catch (error: any) {
    console.error("Failed to send Telegram notification:", error);
    throw error;
  }
};

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminTab, setAdminTab] = useState<'orders' | 'analytics'>('orders');
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Scroll Listener
  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.pageYOffset > 400) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 400) {
        setShowScroll(false);
      }
    };
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [showScroll]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle Stripe/Chapa Success/Cancel
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("success")) {
      // Order status is securely verified and updated via server webhooks.
      setOrderSuccess(true);
      setIsModalOpen(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (queryParams.get("canceled")) {
      alert("Payment canceled. You can still pay on delivery!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Orders Listener (Admin Only)
  useEffect(() => {
    if (isAdminView && user) {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
      }, (error) => {
        console.error("Firestore Error:", error);
      });
      return () => unsubscribe();
    }
  }, [isAdminView, user]);

  const closeOrderModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setOrderSuccess(false);
      setSelectedItemId('');
    }, 300);
  };

  const [lastOrder, setLastOrder] = useState<any>(null);
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [botTestResult, setBotTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testTelegramBot = async () => {
    setIsTestingBot(true);
    setBotTestResult(null);
    try {
      const testOrder = {
        id: "TEST-" + Math.floor(Math.random() * 1000),
        customerName: "Admin (Test)",
        phoneNumber: "N/A",
        location: "Admin Dashboard",
        itemName: "Test Notification",
        quantity: 1,
        totalPrice: 0,
        specialInstructions: "This is a test to verify the Telegram bot is working correctly."
      };

      const response = await fetch(`${API_BASE_URL}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: testOrder }),
      });

      const data = await response.json();
      if (response.ok) {
        setBotTestResult({ success: true, message: "Test message sent successfully! Check your Telegram." });
      } else {
        setBotTestResult({
          success: false,
          message: data.error === "Telegram credentials not configured."
            ? "Telegram credentials not configured in Settings."
            : `Error: ${data.details || data.error}`
        });
      }
    } catch (error) {
      setBotTestResult({ success: false, message: "Failed to connect to the notification server." });
    } finally {
      setIsTestingBot(false);
      // Clear result after 5 seconds
      setTimeout(() => setBotTestResult(null), 5000);
    }
  };

  const handleOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const itemId = parseInt(formData.get("itemId") as string);
    const item = MENU_ITEMS.find(i => i.id === itemId);
    const quantity = parseInt(formData.get("quantity") as string);

    if (!item) {
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      itemId,
      itemName: item.name,
      quantity,
      customerName: formData.get("customerName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      location: formData.get("location") as string,
      specialInstructions: formData.get("specialInstructions") as string,
      status: "pending",
      createdAt: Timestamp.now(),
      totalPrice: item.price * quantity,
      paymentMethod: formData.get("paymentMethod") as string,
      paymentStatus: "pending"
    };

    try {
      const docRef = await addDoc(collection(db, "orders"), orderData);
      const orderWithId = { ...orderData, id: docRef.id };

      if (orderData.paymentMethod === "stripe") {
        const stripe = await loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY);
        if (!stripe) throw new Error("Stripe failed to load");

        const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderWithId }),
        });

        const session = await response.json();
        if (session.error) throw new Error(session.error);

        const result = await (stripe as any).redirectToCheckout({
          sessionId: session.id,
        });

        if (result.error) throw new Error(result.error.message);
        return; // Redirecting, so we don't need to do anything else here
      }

      if (orderData.paymentMethod === "chapa") {
        const response = await fetch(`${API_BASE_URL}/api/create-chapa-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderWithId }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (data.checkout_url) {
          window.location.href = data.checkout_url;
          return;
        }
      }

      setLastOrder(orderWithId);
      setOrderSuccess(true);
      setIsSubmitting(false);

      // Send telegram notification immediately
      try {
        await sendTelegramNotification(orderWithId);
        setNotificationError(null);
      } catch (tgError: any) {
        console.error("Telegram notification failed:", tgError);
        setNotificationError(`Bot Error: ${tgError.message || "Connection failed"}. Make sure VITE_API_URL is set in Vercel.`);
      }

      // Keep it open longer so they can read the confirmation
      setTimeout(() => {
        closeOrderModal();
      }, 6000);
    } catch (error: any) {
      console.error("Order failed:", error);
      alert(`Order failed: ${error.message || "Please try again."}`);
      setIsSubmitting(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  // Analytics Calculations
  const analyticsData = useMemo(() => {
    if (orders.length === 0) return null;

    // Daily Sales
    const salesByDate: { [key: string]: number } = {};
    const itemsCount: { [key: string]: number } = {};
    const locationsCount: { [key: string]: number } = {};
    let totalRevenue = 0;

    orders.forEach(order => {
      if (order.status === 'delivered') {
        const date = order.createdAt?.toDate().toLocaleDateString();
        if (date) {
          salesByDate[date] = (salesByDate[date] || 0) + (order.totalPrice || 0);
        }
        totalRevenue += (order.totalPrice || 0);
      }

      itemsCount[order.itemName] = (itemsCount[order.itemName] || 0) + (order.quantity || 1);

      // Simple location grouping (e.g. by Block if specified)
      const loc = order.location?.split(',')[0]?.trim() || 'Unknown';
      locationsCount[loc] = (locationsCount[loc] || 0) + 1;
    });

    const salesChartData = Object.entries(salesByDate).map(([date, amount]) => ({ date, amount })).reverse();
    const itemsChartData = Object.entries(itemsCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const locationsChartData = Object.entries(locationsCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return {
      salesChartData,
      itemsChartData,
      locationsChartData,
      totalRevenue,
      totalOrders: orders.length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length
    };
  }, [orders]);

  const COLORS = ['#D4AF37', '#8E9299', '#FFFFFF', '#4A4A4A', '#151619'];

  if (isAdminView) {
    return (
      <div className="min-h-screen bg-luxury-black text-white p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gold mb-2 flex items-center gap-3">
                <LayoutDashboard size={36} /> Admin Dashboard
              </h1>
              <p className="text-gray-400">Manage incoming orders and view business performance.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={testTelegramBot}
                disabled={isTestingBot}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 border ${botTestResult
                    ? botTestResult.success
                      ? "bg-green-500/10 border-green-500 text-green-500"
                      : "bg-red-500/10 border-red-500 text-red-500"
                    : "border-gold/30 text-gold hover:bg-gold/10"
                  }`}
              >
                <Send size={16} className={isTestingBot ? "animate-pulse" : ""} />
                {isTestingBot ? "Testing..." : botTestResult ? botTestResult.message : "Test Bot"}
              </button>
              <div className="bg-white/5 p-1 rounded-full border border-white/10 flex">
                <button
                  onClick={() => setAdminTab('orders')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${adminTab === 'orders' ? 'bg-gold text-luxury-black' : 'text-gray-400 hover:text-white'}`}
                >
                  <ShoppingBag size={16} /> Orders
                </button>
                <button
                  onClick={() => setAdminTab('analytics')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${adminTab === 'analytics' ? 'bg-gold text-luxury-black' : 'text-gray-400 hover:text-white'}`}
                >
                  <BarChart3 size={16} /> Analytics
                </button>
              </div>
              <button
                onClick={() => setIsAdminView(false)}
                className="px-6 py-2 border border-white/20 rounded-full hover:bg-white/5 transition-all"
              >
                Customer View
              </button>
              {user && (
                <button
                  onClick={logout}
                  className="px-6 py-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                >
                  <LogOut size={18} /> Logout
                </button>
              )}
            </div>
          </div>

          {!user ? (
            <div className="flex flex-col items-center justify-center py-20">
              {/* Login Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-luxury-gray border border-white/10 rounded-3xl p-10 shadow-[0_0_80px_rgba(212,175,55,0.08)] text-center"
              >
                {/* Icon */}
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gold/20">
                  <LayoutDashboard size={28} className="text-gold" />
                </div>

                <h2 className="text-2xl font-bold mb-2">Admin Portal</h2>
                <p className="text-gray-400 text-sm mb-8">
                  Sign in with your authorized Google account to access the dashboard.
                </p>

                {/* Error State — Unauthorized account */}
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-left"
                  >
                    <p className="text-red-400 font-semibold text-sm mb-1">⛔ Access Denied</p>
                    <p className="text-red-300/80 text-xs leading-relaxed">{authError}</p>
                    <button
                      onClick={() => setAuthError(null)}
                      className="mt-3 text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
                    >
                      Try a different account
                    </button>
                  </motion.div>
                )}

                {/* Google Sign-In Button */}
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
                        setAuthError(
                          `The account "${email}" is not authorized as an admin. Please sign in with your admin Google account.`
                        );
                      }
                    } catch (err: any) {
                      if (err.code !== 'auth/popup-closed-by-user') {
                        setAuthError(
                          err.code === 'auth/popup-blocked'
                            ? 'Popup was blocked by your browser. Please allow popups for this site.'
                            : `Login failed: ${err.message}`
                        );
                        console.error('Auth error:', err);
                      }
                    } finally {
                      setAuthLoading(false);
                    }
                  }}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 px-6 py-4 rounded-full font-semibold text-sm hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                >
                  {authLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing you in...
                    </>
                  ) : (
                    <>
                      {/* Official Google G logo */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                <p className="text-gray-600 text-xs mt-6">
                  Only authorized admin accounts can sign in.
                </p>
              </motion.div>
            </div>
          ) : adminTab === 'orders' ? (
            <div className="grid grid-cols-1 gap-6">
              {orders.length === 0 ? (
                <div className="text-center py-24 text-gray-500 italic">No orders yet...</div>
              ) : (
                orders.map(order => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-2xl border ${order.status === 'delivered' ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-luxury-gray'} flex flex-col md:flex-row justify-between gap-6`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            order.status === 'cooking' ? 'bg-blue-500/20 text-blue-500' :
                              order.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                                'bg-red-500/20 text-red-500'
                          }`}>
                          {order.status}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {order.createdAt?.toDate().toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gold mb-1">{order.itemName} <span className="text-white text-base">x{order.quantity}</span></h3>
                      <p className="text-gray-300 mb-4">{order.customerName} • {order.phoneNumber} • {order.location}</p>
                      {order.specialInstructions && (
                        <div className="bg-black/40 p-3 rounded-lg text-sm text-gray-400 italic mb-4">
                          "{order.specialInstructions}"
                        </div>
                      )}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-xl font-bold">{order.totalPrice} ETB</div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                          {order.paymentMethod === 'stripe' ? <CreditCard size={10} /> : order.paymentMethod === 'chapa' ? <Phone size={10} /> : <Utensils size={10} />}
                          {order.paymentMethod === 'stripe' ? 'Stripe' : order.paymentMethod === 'chapa' ? 'Telebirr/CBE' : 'Delivery'} • {order.paymentStatus || 'pending'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col gap-2 justify-end">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cooking')}
                        className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                        title="Start Cooking"
                      >
                        <Timer size={20} /> <span className="md:hidden">Cook</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all flex items-center gap-2"
                        title="Mark Delivered"
                      >
                        <CheckCircle2 size={20} /> <span className="md:hidden">Deliver</span>
                      </button>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                        title="Delete Order"
                      >
                        <Trash2 size={20} /> <span className="md:hidden">Delete</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-luxury-gray p-8 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gold/10 text-gold rounded-xl"><TrendingUp size={24} /></div>
                    <span className="text-gray-400 font-medium">Total Revenue</span>
                  </div>
                  <div className="text-4xl font-bold text-gold">{analyticsData?.totalRevenue || 0} <span className="text-lg font-normal text-white/60">ETB</span></div>
                </div>
                <div className="bg-luxury-gray p-8 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><ShoppingBag size={24} /></div>
                    <span className="text-gray-400 font-medium">Total Orders</span>
                  </div>
                  <div className="text-4xl font-bold">{analyticsData?.totalOrders || 0}</div>
                </div>
                <div className="bg-luxury-gray p-8 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><CheckCircle2 size={24} /></div>
                    <span className="text-gray-400 font-medium">Delivered</span>
                  </div>
                  <div className="text-4xl font-bold">{analyticsData?.deliveredOrders || 0}</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Chart */}
                <div className="bg-luxury-gray p-8 rounded-3xl border border-white/5">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><TrendingUp size={20} className="text-gold" /> Sales Performance</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData?.salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ETB`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#151619', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px' }}
                          itemStyle={{ color: '#D4AF37' }}
                        />
                        <Line type="monotone" dataKey="amount" stroke="#D4AF37" strokeWidth={3} dot={{ fill: '#D4AF37', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Popular Items */}
                <div className="bg-luxury-gray p-8 rounded-3xl border border-white/5">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><PieChartIcon size={20} className="text-gold" /> Popular Items</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData?.itemsChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analyticsData?.itemsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#151619', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Location Data */}
                <div className="bg-luxury-gray p-8 rounded-3xl border border-white/5 lg:col-span-2">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><MapIcon size={20} className="text-gold" /> Order Locations</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData?.locationsChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#151619', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px' }}
                        />
                        <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-gold selection:text-black">
      {/* Header */}
      <header className="fixed top-4 w-[calc(100%-2rem)] md:w-full md:max-w-7xl mx-auto left-0 right-0 z-50 glass-card rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
        <nav className="px-6 md:px-10 h-20 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black tracking-[0.3em] font-serif gold-gradient-text cursor-pointer"
            onDoubleClick={() => setIsAdminView(true)}
          >
            BRO'S እርጥብ
          </motion.div>
          <div className="hidden lg:flex items-center gap-8">
            <a href="#home" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors uppercase tracking-widest">Home</a>
            <a href="#story" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors uppercase tracking-widest">Our Story</a>
            <a href="#menu" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors uppercase tracking-widest">Menu</a>
            <a href="#gallery" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors uppercase tracking-widest">Gallery</a>
            <a href="#contact" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors uppercase tracking-widest">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAdminView(true)}
              className="text-gray-500 hover:text-gold transition-colors hidden md:block"
            >
              <LayoutDashboard size={20} />
            </button>
            <motion.button
              onClick={() => { setSelectedItemId(''); setIsModalOpen(true); }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gold text-luxury-black px-6 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              ORDER NOW
            </motion.button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/bros-special.jpg"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-40 hero-img"
          />
          <div className="absolute inset-0 bg-linear-to-b from-luxury-black via-transparent to-luxury-black" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-[10rem] leading-none font-serif font-black mb-6 tracking-tighter text-glow gold-gradient-text drop-shadow-2xl"
          >
            Bro's እርጥብ 
            <span className="block text-3xl md:text-5xl font-sans mt-4 italic text-white/60 font-light tracking-[0.2em] uppercase">Arba Minch Luxury</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-2xl text-gray-300 font-light mb-12 max-w-3xl mx-auto leading-relaxed border-l-2 border-gold/50 pl-6 text-left space-y-3"
          >
            <span className="block">
              የአርባ ምንጭ ምርጥና ታዋቂ እርጥብ — <span className="text-gold font-semibold">24/7 ክፍት</span>። 🌙
            </span>
            <span className="block text-white/70 italic text-base md:text-lg">
              The legendary destination for high-end Ertib and extraordinary vibes in Arba Minch.
            </span>
            <span className="block text-gold font-bold text-xl md:text-2xl mt-2 tracking-wide">
              አንዴ ቀምሰህ — ለዘላለም ትወደዋለህ። 🔥
            </span>
            <span className="block text-white/50 text-sm uppercase tracking-[0.25em] mt-1">
              Bro's እርጥብ ይለያል · It hits different.
            </span>
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="#menu"
              className="px-8 py-5 bg-transparent border border-gold/50 text-gold rounded-full font-bold text-sm tracking-[0.2em] hover:bg-gold hover:text-luxury-black hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
            >
              EXPLORE THE MENU <ChevronRight size={18} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="story" className="py-32 px-6 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
            <h2 className="text-sm font-bold text-gold uppercase tracking-[0.3em] mb-6">The Legend</h2>
            <h3 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Crafting <span className="italic text-gold">Masterpieces</span> in Arba Minch
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Bro's እርጥብ isn't just a restaurant; it's a culinary landmark. Born from a passion for authentic flavors and a commitment to "Luxury" street food, we've become the 24/7 heartbeat of Arba Minch's food scene.
            </p>
            <p className="text-gray-400 text-lg leading-relaxed">
              Every plate of Ertib is a balance of heat, texture, and soul. Our secret sauces and artisanal approach ensure that every bite is an experience you'll never forget.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            <img
              src="/images/bros-special.jpg"
              alt="Bro's Special እርጥብ"
              className="rounded-3xl w-full h-64 object-cover border border-white/5 story-img"
            />
            <img
              src="/images/bros-ertib.jpg"
              alt="Bro's እርጥብ"
              className="rounded-3xl w-full h-64 object-cover mt-12 border border-white/5 story-img"
            />
          </motion.div>
        </div>
      </section>

      {/* Reviews Marquee */}
      <section className="bg-luxury-gray py-16 border-y-2 border-gold/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8">
            {REVIEWS.map((review) => (
              <motion.div
                key={review.id}
                whileHover={{ y: -5 }}
                className="bg-black/40 p-8 rounded-2xl border border-white/5 max-w-md"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.stars)].map((_, i) => (
                    <Star key={i} size={16} className="fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-gray-300 italic mb-4 leading-relaxed">"{review.text}"</p>
                <p className="text-gold font-medium text-sm">— {review.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            ምን ማዘዝ ይፈልጋሉ?
          </motion.h2>
          <div className="w-20 h-1 bg-gold mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {MENU_ITEMS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-luxury-gray rounded-3xl overflow-hidden border border-white/5 hover:border-gold/50 transition-all group"
            >
              <div className="h-56 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover menu-card-img"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gold mb-2">{item.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{item.price} ETB</span>
                  <motion.button
                    onClick={() => { setSelectedItemId(item.id); setIsModalOpen(true); }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 bg-gold/10 text-gold rounded-full hover:bg-gold hover:text-luxury-black transition-colors"
                  >
                    <Utensils size={20} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-32 bg-luxury-gray">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">The Vibe</h2>
            <div className="w-20 h-1 bg-gold mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600"
            ].map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="aspect-square overflow-hidden rounded-2xl border border-white/5"
              >
                <img
                  src={url}
                  alt={`Gallery ${i}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-black/60 py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gold mb-8">Visit The Lab</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gold/10 rounded-xl text-gold">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="font-bold mb-1">Location</p>
                  <p className="text-gray-400">Arba Minch University, Arba Minch 4620</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gold/10 rounded-xl text-gold">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="font-bold mb-1">Hours</p>
                  <p className="text-gray-400">Open 24 Hours / 7 Days a Week</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gold/10 rounded-xl text-gold">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="font-bold mb-1">Phone</p>
                  <p className="text-gray-400">0954897133</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-luxury-gray p-10 rounded-3xl border border-white/5"
          >
            <h2 className="text-3xl font-bold text-gold mb-8">The Experience</h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-300">
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                Contact Delivery Available
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                Dine-in Excellence
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                Drive-through Service
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                Legendary Arba Minch Vibe
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-xl font-bold text-gold tracking-widest">BRO'S እርጥብ</div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-gold transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-gold transition-colors"><Facebook size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-gold transition-colors"><Twitter size={20} /></a>
          </div>
          <p className="text-gray-500 text-sm">© 2026 Bro's እርጥብ. All rights reserved.</p>
        </div>
      </footer>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScroll && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-28 right-8 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center z-50 hover:bg-gold hover:text-luxury-black transition-all"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => { setSelectedItemId(''); setIsModalOpen(true); }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gold text-luxury-black rounded-full flex items-center justify-center shadow-2xl z-50 hover:shadow-gold/40 transition-shadow"
      >
        <ShoppingBag size={30} />
      </motion.button>

      {/* Order Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeOrderModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-luxury-gray/80 backdrop-blur-2xl w-full max-w-lg rounded-3xl border border-white/10 shadow-[0_0_60px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="absolute inset-0 bg-linear-to-br from-gold/5 via-transparent to-transparent opacity-50 pointer-events-none" />
              <div className="p-6 md:p-8 overflow-y-auto relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold bg-linear-to-r from-gold via-[#FFE58F] to-gold bg-clip-text text-transparent">Place Your Order</h2>
                  <button
                    onClick={closeOrderModal}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {orderSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="w-20 h-20 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Order Received!</h3>
                    <p className="text-gray-400 mb-8">Bro is preparing your luxury meal. Stay hungry! 🔥</p>

                    {lastOrder && (
                      <div className="bg-black/40 rounded-2xl p-6 text-left border border-white/5 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 uppercase tracking-widest">Order ID</span>
                          <span className="text-gold font-mono">{lastOrder.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 uppercase tracking-widest">Item</span>
                          <span className="text-white">{lastOrder.itemName} (x{lastOrder.quantity})</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 uppercase tracking-widest">Total</span>
                          <span className="text-gold font-bold">{lastOrder.totalPrice} ETB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 uppercase tracking-widest">Location</span>
                          <span className="text-white">{lastOrder.location}</span>
                        </div>
                      </div>
                    )}

                    <p className="mt-8 text-xs text-gray-500 animate-pulse">Closing in a few seconds...</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleOrderSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">Select Item</label>
                      <select
                        name="itemId"
                        required
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all placeholder-white/20 shadow-inner appearance-none"
                      >
                        <option value="" disabled>Choose from menu...</option>
                        {MENU_ITEMS.map(item => (
                          <option key={item.id} value={item.id}>{item.name} - {item.price} ETB</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">Quantity</label>
                        <input
                          name="quantity"
                          type="number"
                          min="1"
                          defaultValue="1"
                          required
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all placeholder-white/20 shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">Your Name</label>
                        <input
                          name="customerName"
                          type="text"
                          placeholder="Bro's Name"
                          required
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all placeholder-white/20 shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">Phone Number</label>
                      <input
                        name="phoneNumber"
                        type="tel"
                        placeholder="09..."
                        required
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all placeholder-white/20 shadow-inner"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">Delivery Location / Room</label>
                      <input
                        name="location"
                        type="text"
                        placeholder="e.g. Block 4, Room 202"
                        required
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all placeholder-white/20 shadow-inner"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">Special Instructions</label>
                      <textarea
                        name="specialInstructions"
                        placeholder="Extra sauce? No onions? Tell Bro..."
                        rows={2}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all placeholder-white/20 shadow-inner resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="relative flex items-center justify-center py-2 px-2 bg-black/20 border border-white/10 rounded-lg cursor-pointer hover:border-gold/40 hover:bg-gold/5 transition-all group">
                          <input type="radio" name="paymentMethod" value="delivery" defaultChecked className="hidden peer" />
                          <div className="peer-checked:text-gold transition-colors flex items-center gap-1.5">
                            <Utensils size={10} />
                            <span className="text-xs font-bold uppercase">Delivery</span>
                          </div>
                          <div className="absolute inset-0 border border-transparent peer-checked:border-gold rounded-lg pointer-events-none" />
                        </label>
                        <label className="relative flex items-center justify-center py-2 px-2 bg-black/20 border border-white/10 rounded-lg cursor-pointer hover:border-gold/40 hover:bg-gold/5 transition-all group">
                          <input type="radio" name="paymentMethod" value="chapa" className="hidden peer" />
                          <div className="peer-checked:text-gold transition-colors flex items-center gap-1.5">
                            <Phone size={10} />
                            <span className="text-xs font-bold uppercase">Telebirr</span>
                          </div>
                          <div className="absolute inset-0 border border-transparent peer-checked:border-gold rounded-lg pointer-events-none" />
                        </label>
                        <label className="relative flex items-center justify-center py-2 px-2 bg-black/20 border border-white/10 rounded-lg cursor-pointer hover:border-gold/40 hover:bg-gold/5 transition-all group col-span-2">
                          <input type="radio" name="paymentMethod" value="stripe" className="hidden peer" />
                          <div className="peer-checked:text-gold transition-colors flex items-center gap-1.5">
                            <CreditCard size={10} />
                            <span className="text-xs font-bold uppercase">International Card (Stripe)</span>
                          </div>
                          <div className="absolute inset-0 border border-transparent peer-checked:border-gold rounded-lg pointer-events-none" />
                        </label>
                      </div>
                    </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full relative group overflow-hidden bg-gold text-luxury-black py-3.5 rounded-xl font-bold text-lg hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 mt-4"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                        <span className="relative z-10">{isSubmitting ? "PROCESSING..." : "CONFIRM LUXURY ORDER"}</span>
                      </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bot Diagnostic Error/Success Toast */}
      <AnimatePresence>
        {notificationError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-6 left-6 right-6 z-9999 p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex flex-col gap-2 ${
              notificationError.includes('Success') 
                ? 'bg-green-600/90 border-green-400' 
                : 'bg-red-600/90 border-red-400'
            } text-white`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold">{notificationError.includes('Success') ? '✅ Delivery Setup' : '⚠️ Connection Issue'}</span>
              <button onClick={() => setNotificationError(null)} className="text-white/60 hover:text-white">✕</button>
            </div>
            <p className="text-xs">{notificationError}</p>
            {!notificationError.includes('Success') && (
              <div className="text-[10px] opacity-60 font-mono">Target: {API_BASE_URL || 'Local Vercel (Wrong)'}/api/notify</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
