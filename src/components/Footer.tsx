import { Instagram, Facebook, Twitter } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface Props {
  language: Language;
}

export default function Footer({ language }: Props) {
  const t = translations[language];

  return (
    <footer className="py-16 px-6 border-t border-white/5 bg-black/60">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
          <div>
            <div className="text-2xl font-black text-gold tracking-widest font-serif mb-1">BRO'S እርጥብ</div>
            <p className="text-white/30 text-sm">Arba Minch Luxury Food · Since 2020</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-5">
              <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold/40 transition-all">
                <Instagram size={16} />
              </a>
              <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold/40 transition-all">
                <Facebook size={16} />
              </a>
              <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold/40 transition-all">
                <Twitter size={16} />
              </a>
            </div>
          </div>

          <div className="text-right">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Call Us</p>
            <a href="tel:0954897133" className="text-gold font-bold text-lg hover:text-white transition-colors">
              0954 897 133
            </a>
          </div>
        </div>
        <hr className="gold-divider mb-6" />
        <p className="text-center text-gray-600 text-xs">© 2026 Bro's እርጥብ. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
