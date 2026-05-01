import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface Props {
  language: Language;
  onOrderOpen: () => void;
}

export default function HeroSection({ language, onOrderOpen }: Props) {
  const t = translations[language];

  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/bros-special.jpg"
          alt="Hero Background"
          className="w-full h-full object-cover opacity-35 hero-img"
        />
        <div className="absolute inset-0 bg-linear-to-b from-luxury-black/80 via-luxury-black/30 to-luxury-black/90" />
        <div className="absolute inset-0 bg-linear-to-r from-luxury-black/60 via-transparent to-luxury-black/60" />
      </div>

      {/* Floating ambient orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="orb-a absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="orb-b absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/4 rounded-full blur-3xl" />
        <div className="orb-c absolute top-1/2 right-1/3 w-64 h-64 bg-amber-500/4 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="relative pulse-ring inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold/10 border border-gold/30 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-gold uppercase tracking-[0.25em]">Now Open · Arba Minch</span>
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-7xl md:text-[9rem] leading-none font-serif font-black mb-4 tracking-tighter text-glow gold-gradient-text drop-shadow-2xl"
        >
          Bro's<br />
          <span className="font-serif italic">እርጥብ</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-sm md:text-base uppercase tracking-[0.4em] text-white/50 mb-8 font-light"
        >
          {t.hero.subtitle}
        </motion.p>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <p className="text-base md:text-lg text-gray-300 leading-relaxed">
            {t.hero.titleAmh}<span className="text-gold font-semibold">{t.hero.titleAmhHighlight}</span>{t.hero.titleAmhEnd}
          </p>
          <p className="text-sm text-white/50 italic mt-2">{t.hero.description1}</p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <motion.button
            onClick={onOrderOpen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-10 py-4 bg-gold text-luxury-black rounded-full font-bold text-sm tracking-[0.15em] uppercase hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} /> {t.nav.orderNow}
          </motion.button>
          <a
            href="#menu"
            className="px-10 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold text-sm tracking-[0.15em] uppercase hover:border-gold/60 hover:text-gold hover:bg-white/5 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            {t.hero.explore} <ChevronRight size={16} />
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex items-center justify-center gap-2 sm:gap-8 flex-wrap"
        >
          {[
            { value: '500+', label: 'Happy Customers' },
            { value: '5.0★', label: 'Rating' },
            { value: '30min', label: 'Avg. Delivery' },
            { value: '100%', label: 'Fresh Daily' },
          ].map((stat, i) => (
            <div key={i} className="stat-card text-center px-4 py-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm min-w-[80px]">
              <div className="text-gold font-black text-xl font-serif">{stat.value}</div>
              <div className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

    </section>
  );
}
