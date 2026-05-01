import { motion } from 'motion/react';
import { CheckCircle2, Timer, Trash2, Phone, Utensils, CreditCard } from 'lucide-react';
import { Order, Language } from '../../types';
import { translations } from '../../translations';
import { db, updateDoc, doc, deleteDoc } from '../../firebase';

interface Props {
  language: Language;
  orders: Order[];
}

export default function OrdersTab({ language, orders }: Props) {
  const t = translations[language];

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  if (orders.length === 0) {
    return <div className="text-center py-24 text-gray-500 italic">{t.admin.orders.noOrders}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {orders.map((order) => (
        <motion.div
          key={order.id}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${
            order.status === 'delivered' ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-luxury-gray'
          } flex flex-col md:flex-row justify-between gap-6`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
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
            <h3 className="text-lg font-bold text-gold mb-1">
              {order.itemName} <span className="text-white text-base">x{order.quantity}</span>
            </h3>
            <p className="text-gray-300 mb-4">
              {order.customerName} • {order.phoneNumber} • {order.location}
            </p>
            {order.specialInstructions && (
              <div className="bg-black/40 p-3 rounded-lg text-sm text-gray-400 italic mb-4">
                "{order.specialInstructions}"
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold">{order.totalPrice} ETB</div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {order.paymentMethod === 'stripe' ? <CreditCard size={10} /> :
                 order.paymentMethod === 'chapa' ? <Phone size={10} /> : <Utensils size={10} />}
                {order.paymentMethod === 'stripe' ? 'Stripe' : order.paymentMethod === 'chapa' ? 'Telebirr/CBE' : 'Delivery'} • {order.paymentStatus || 'pending'}
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-2 justify-end">
            <button
              onClick={() => updateOrderStatus(order.id, 'cooking')}
              className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
              title={t.admin.orders.startCooking}
            >
              <Timer size={20} /> <span className="md:hidden">{t.admin.orders.cook}</span>
            </button>
            <button
              onClick={() => updateOrderStatus(order.id, 'delivered')}
              className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all flex items-center gap-2"
              title={t.admin.orders.markDelivered}
            >
              <CheckCircle2 size={20} /> <span className="md:hidden">{t.admin.orders.deliver}</span>
            </button>
            <button
              onClick={() => deleteOrder(order.id)}
              className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
              title={t.admin.orders.deleteOrder}
            >
              <Trash2 size={20} /> <span className="md:hidden">{t.admin.orders.delete}</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
