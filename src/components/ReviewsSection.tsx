import { motion } from 'motion/react';
import { Star } from 'lucide-react';

const REVIEWS = [
  {
    id: 1,
    text: "Yeah, this right here… this is Bro's እርጥብ star material. Gordon Ramsay might cry if he tasted this.",
    author: 'Hizkias Kassahun',
    stars: 5,
  },
  {
    id: 2,
    text: 'Best እርጥብ in Arba Minch. Hands down. The service is as good as the food.',
    author: 'Usaama Mahdi Ali',
    stars: 5,
  },
];

export default function ReviewsSection() {
  return (
    <section className="bg-luxury-gray py-20 border-y border-gold/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-gold uppercase tracking-[0.3em] mb-3">✦ What People Say</p>
          <h2 className="text-3xl md:text-4xl font-bold">
            Loved by <span className="italic text-gold font-serif">Arba Minch</span>
          </h2>
        </div>
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
  );
}
