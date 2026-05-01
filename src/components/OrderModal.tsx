import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Utensils, Phone, CreditCard, ShoppingBag } from 'lucide-react';
import { FormEvent } from 'react';
import { MenuItem, Order, Language } from '../types';
import { translations } from '../translations';

interface Props {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  selectedItemId: string | number | '';
  onItemChange: (id: string) => void;
  orderSuccess: boolean;
  lastOrder: Partial<Order> & { id: string } | null;
  isSubmitting: boolean;
  onSubmit: (e: FormEvent) => void;
}

export default function OrderModal({
  language,
  isOpen,
  onClose,
  menuItems,
  selectedItemId,
  onItemChange,
  orderSuccess,
  lastOrder,
  isSubmitting,
  onSubmit,
}: Props) {
  const t = translations[language];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                <h2 className="text-3xl font-bold bg-linear-to-r from-gold via-[#FFE58F] to-gold bg-clip-text text-transparent">
                  {t.order.title}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
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
                  <h3 className="text-2xl font-bold mb-2">{t.order.successTitle}</h3>
                  <p className="text-gray-400 mb-8">{t.order.successSub}</p>

                  {lastOrder && (
                    <div className="bg-black/40 rounded-2xl p-6 text-left border border-white/5 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 uppercase tracking-widest">{t.order.orderId}</span>
                        <span className="text-gold font-mono">{lastOrder.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 uppercase tracking-widest">{t.order.item}</span>
                        <span className="text-white">{lastOrder.itemName} (x{lastOrder.quantity})</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 uppercase tracking-widest">{t.order.total}</span>
                        <span className="text-gold font-bold">{lastOrder.totalPrice} ETB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 uppercase tracking-widest">{t.order.location}</span>
                        <span className="text-white">{lastOrder.location}</span>
                      </div>
                    </div>
                  )}
                  <p className="mt-8 text-xs text-gray-500 animate-pulse">{t.order.closing}</p>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Item select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.order.selectItem}</label>
                    <select
                      name="itemId"
                      required
                      value={selectedItemId}
                      onChange={(e) => onItemChange(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all shadow-inner appearance-none"
                    >
                      <option value="" disabled>{t.order.chooseMenu}</option>
                      {menuItems.filter((item) => item.isAvailable !== false).map((item) => (
                        <option key={item.id} value={item.id}>{item.name} - {item.price} ETB</option>
                      ))}
                    </select>
                  </div>

                  {/* Qty + Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.order.quantity}</label>
                      <input name="quantity" type="number" min="1" defaultValue="1" required
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.order.name}</label>
                      <input name="customerName" type="text" placeholder={t.order.namePlaceholder} required
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all shadow-inner" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.order.phone}</label>
                    <input name="phoneNumber" type="tel" placeholder={t.order.phonePlaceholder} required
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all shadow-inner" />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.order.delLocation}</label>
                    <input name="location" type="text" placeholder={t.order.delPlaceholder} required
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all shadow-inner" />
                  </div>

                  {/* Special instructions */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.order.special}</label>
                    <textarea name="specialInstructions" placeholder={t.order.specialPlaceholder} rows={2}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all shadow-inner resize-none" />
                  </div>

                  {/* Payment method */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t.order.paymentMethod}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'delivery', icon: <Utensils size={10} />, label: t.order.payDelivery, span: false },
                        { value: 'chapa', icon: <Phone size={10} />, label: t.order.payChapa, span: false },
                        { value: 'stripe', icon: <CreditCard size={10} />, label: t.order.payStripe, span: true },
                      ].map(({ value, icon, label, span }) => (
                        <label key={value} className={`relative flex items-center justify-center py-2 px-2 bg-black/20 border border-white/10 rounded-lg cursor-pointer hover:border-gold/40 hover:bg-gold/5 transition-all ${span ? 'col-span-2' : ''}`}>
                          <input type="radio" name="paymentMethod" value={value} defaultChecked={value === 'delivery'} className="hidden peer" />
                          <div className="peer-checked:text-gold transition-colors flex items-center gap-1.5">
                            {icon}
                            <span className="text-xs font-bold uppercase">{label}</span>
                          </div>
                          <div className="absolute inset-0 border border-transparent peer-checked:border-gold rounded-lg pointer-events-none" />
                        </label>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full relative group overflow-hidden bg-gold text-luxury-black py-3.5 rounded-xl font-bold text-lg hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                    <ShoppingBag size={18} className="relative z-10" />
                    <span className="relative z-10">{isSubmitting ? t.order.processing : t.order.confirm}</span>
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
