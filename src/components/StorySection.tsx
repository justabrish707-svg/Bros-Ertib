import { motion } from 'motion/react';
import { Language } from '../types';
import { translations } from '../translations';

interface Props {
  language: Language;
}

export default function StorySection({ language }: Props) {
  const t = translations[language];

  return (
    <section id="story" className="py-32 px-6 bg-black relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/3 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -left-6 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-gold/60 to-transparent hidden lg:block" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
          <span className="inline-flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-[0.3em] mb-6 bg-gold/10 px-4 py-2 rounded-full border border-gold/20">
            ✦ {t.story.tag}
          </span>
          <h3 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            {t.story.title1} <span className="italic text-gold font-serif">{t.story.title2}</span> {t.story.title3}
          </h3>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">{t.story.p1}</p>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">{t.story.p2}</p>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">{t.story.p3}</p>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">{t.story.p4}</p>
          <p className="text-gray-400 text-lg leading-relaxed mb-10">{t.story.p5}</p>
          <div className="flex flex-wrap gap-3">
            {["🔥 Arba Minch's Finest", '🥚 Fresh Eggs Daily', '⚡ Fast Delivery', '💛 Since 2020'].map((feat) => (
              <span key={feat} className="text-xs font-semibold text-white/70 bg-white/5 border border-white/10 px-4 py-2 rounded-full hover:border-gold/40 hover:text-gold transition-colors cursor-default">
                {feat}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img src="/images/bros-special.jpg" alt="Bro's Special እርጥብ" className="rounded-3xl w-full h-48 object-cover border border-white/5 story-img" />
              <div className="rounded-3xl w-full h-32 bg-gold/10 border border-gold/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-black text-gold font-serif">5★</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Rated</div>
                </div>
              </div>
            </div>
            <div className="space-y-4 mt-10">
              <div className="rounded-3xl w-full h-32 bg-luxury-gray border border-white/5 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-black text-gold font-serif">500+</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Customers</div>
                </div>
              </div>
              <img src="/images/bros-ertib.jpg" alt="Bro's እርጥብ" className="rounded-3xl w-full h-48 object-cover border border-white/5 story-img" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
