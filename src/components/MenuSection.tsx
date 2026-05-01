import { motion } from 'motion/react';
import { Utensils } from 'lucide-react';
import { useState } from 'react';
import { MenuItem, Language } from '../types';
import { translations } from '../translations';

interface Props {
  language: Language;
  menuItems: MenuItem[];
  onOrderItem: (itemId: string) => void;
}

const CATEGORIES = ['All', 'Foods', 'Snacks', 'Soft Drinks', 'Other'];

export default function MenuSection({ language, menuItems, onOrderItem }: Props) {
  const t = translations[language];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredItems = menuItems.filter(
    (item) => item.isAvailable !== false && (selectedCategory === 'All' || item.category === selectedCategory)
  );

  return (
    <section id="menu" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          {t.menu.title}
        </motion.h2>
        <div className="w-20 h-1 bg-gold mx-auto rounded-full" />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {CATEGORIES.map((category, index) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all border ${
              selectedCategory === category
                ? 'bg-gold text-luxury-black border-gold'
                : 'bg-transparent text-white border-white/10 hover:border-gold/50'
            }`}
          >
            {t.menu.categories[index]}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredItems.map((item, index) => (
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
              <img src={item.image} alt={item.name} className="w-full h-full object-cover menu-card-img" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gold mb-2">{item.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{item.price} ETB</span>
                <motion.button
                  onClick={() => onOrderItem(item.id)}
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
  );
}
