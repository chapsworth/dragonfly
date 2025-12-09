import React from 'react';
import { Leaf, Cigarette, Cookie, Flame, Wind, Droplets, Sparkles, Box, Grid3x3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const categories = [
  { name: 'All', icon: Grid3x3, gradient: 'from-emerald-400 to-green-500', value: 'all' },
  { name: 'Flower', icon: Leaf, gradient: 'from-emerald-400 to-green-500', value: 'flower' },
  { name: 'Pre-Rolls', icon: Cigarette, gradient: 'from-green-400 to-emerald-500', value: 'pre-rolls' },
  { name: 'Edibles', icon: Cookie, gradient: 'from-orange-400 to-amber-500', value: 'edibles' },
  { name: 'Concentrates', icon: Flame, gradient: 'from-yellow-400 to-orange-500', value: 'concentrates' },
  { name: 'Vapes', icon: Wind, gradient: 'from-cyan-400 to-blue-500', value: 'vapes' },
  { name: 'Tinctures', icon: Droplets, gradient: 'from-purple-400 to-violet-500', value: 'tinctures' },
  { name: 'Topicals', icon: Sparkles, gradient: 'from-pink-400 to-rose-500', value: 'topicals' },
  { name: 'Accessories', icon: Box, gradient: 'from-slate-400 to-gray-500', value: 'accessories' }
];

export default function CategoryGrid({ selectedCategory, onCategoryChange }) {
  return (
    <section className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category, i) => (
            <motion.button
              key={category.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onCategoryChange(category.value)}
              className="flex-shrink-0"
            >
              <div className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                selectedCategory === category.value
                  ? "bg-white/80 backdrop-blur-xl border-2 border-emerald-400 shadow-lg scale-105"
                  : "hover:bg-white/60 hover:scale-105"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md transition-all",
                  category.gradient,
                  selectedCategory === category.value && "shadow-lg"
                )}>
                  <category.icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <p className={cn(
                  "text-xs font-semibold transition-colors whitespace-nowrap",
                  selectedCategory === category.value ? "text-emerald-700" : "text-emerald-600"
                )}>
                  {category.name}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}