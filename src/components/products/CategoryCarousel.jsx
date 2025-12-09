import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Leaf, Cannabis, Cookie, Droplets, Wind, Sparkles, Flame, Package } from 'lucide-react';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';

const categoryIcons = {
  flower: Leaf,
  'pre-rolls': Cannabis,
  edibles: Cookie,
  concentrates: Droplets,
  vapes: Wind,
  tinctures: Sparkles,
  topicals: Flame,
  accessories: Package
};

const categoryColors = {
  flower: 'from-green-400 to-emerald-500',
  'pre-rolls': 'from-lime-400 to-green-500',
  edibles: 'from-amber-400 to-orange-500',
  concentrates: 'from-yellow-400 to-amber-500',
  vapes: 'from-cyan-400 to-blue-500',
  tinctures: 'from-purple-400 to-violet-500',
  topicals: 'from-pink-400 to-rose-500',
  accessories: 'from-slate-400 to-gray-500'
};

export default function CategoryCarousel({ category, products }) {
  const scrollRef = useRef(null);
  const Icon = categoryIcons[category] || Leaf;
  const gradientColor = categoryColors[category] || 'from-emerald-400 to-green-500';

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-emerald-900 capitalize">{category.replace('-', ' ')}</h2>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-sm font-medium">
            {products.length}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl bg-white/60 backdrop-blur border border-white/40 hover:bg-white transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-emerald-700" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl bg-white/60 backdrop-blur border border-white/40 hover:bg-white transition-colors shadow-sm"
          >
            <ChevronRight className="w-5 h-5 text-emerald-700" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}