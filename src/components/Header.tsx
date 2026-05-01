import { motion } from 'motion/react';
import { LayoutDashboard } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface Props {
  language: Language;
  onLanguageToggle: () => void;
  onAdminOpen: () => void;
  onOrderOpen: () => void;
}

export default function Header({ language, onLanguageToggle, onAdminOpen, onOrderOpen }: Props) {
  const t = translations[language];

  return (
    <header className="fixed top-4 w-[calc(100%-2rem)] md:w-full md:max-w-7xl mx-auto left-0 right-0 z-50 glass-card rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
      <nav className="px-6 md:px-10 h-20 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-black tracking-[0.3em] font-serif gold-gradient-text cursor-pointer"
          onDoubleClick={onAdminOpen}
        >
          BRO'S እርጥብ
        </motion.div>

        <div className="hidden lg:flex items-center gap-8">
          <a href="#home" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors uppercase tracking-widest">{t.nav.home}</a>
          <a href="#story" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors uppercase tracking-widest">{t.nav.story}</a>
          <a href="#menu" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors uppercase tracking-widest">{t.nav.menu}</a>
          <a href="#gallery" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors uppercase tracking-widest">{t.nav.gallery}</a>
          <a href="#contact" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors uppercase tracking-widest">{t.nav.contact}</a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onLanguageToggle}
            className="text-gold font-bold text-sm tracking-widest px-3 py-1 rounded-full border border-gold/30 hover:bg-gold/10 transition-colors"
          >
            {language === 'en' ? 'አማ' : 'EN'}
          </button>
          <button
            onClick={onAdminOpen}
            className="text-gray-500 hover:text-gold transition-colors hidden md:block"
          >
            <LayoutDashboard size={20} />
          </button>
          <motion.button
            onClick={onOrderOpen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gold text-luxury-black px-6 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          >
            {t.nav.orderNow}
          </motion.button>
        </div>
      </nav>
    </header>
  );
}
