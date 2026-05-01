import { motion } from 'motion/react';
import { MapPin, Clock, Phone } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface Props {
  language: Language;
}

export default function ContactSection({ language }: Props) {
  const t = translations[language];

  return (
    <section id="contact" className="bg-black/60 py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-gold mb-8">{t.contact.title}</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gold/10 rounded-xl text-gold"><MapPin size={24} /></div>
              <div>
                <p className="font-bold mb-1">{t.contact.location}</p>
                <p className="text-gray-400">Arba Minch University, Arba Minch 4620</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gold/10 rounded-xl text-gold"><Clock size={24} /></div>
              <div>
                <p className="font-bold mb-1">{t.contact.hours}</p>
                <p className="text-gray-400">{t.contact.open}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gold/10 rounded-xl text-gold"><Phone size={24} /></div>
              <div>
                <p className="font-bold mb-1">{t.contact.phone}</p>
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
          <h2 className="text-3xl font-bold text-gold mb-8">{t.contact.experience}</h2>
          <ul className="space-y-4">
            {[t.contact.exp1, t.contact.exp2, t.contact.exp3, t.contact.exp4].map((exp, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300">
                <div className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
                {exp}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
