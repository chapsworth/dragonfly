import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Leaf, Cigarette, Cookie, Flame, Wind, Droplets, Sparkles, Box } from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
  { name: 'Flower', icon: Leaf, gradient: 'from-emerald-400 to-green-500', value: 'flower' },
  { name: 'Pre-Rolls', icon: Cigarette, gradient: 'from-green-400 to-emerald-500', value: 'pre-rolls' },
  { name: 'Edibles', icon: Cookie, gradient: 'from-orange-400 to-amber-500', value: 'edibles' },
  { name: 'Concentrates', icon: Flame, gradient: 'from-yellow-400 to-orange-500', value: 'concentrates' },
  { name: 'Vapes', icon: Wind, gradient: 'from-cyan-400 to-blue-500', value: 'vapes' },
  { name: 'Tinctures', icon: Droplets, gradient: 'from-purple-400 to-violet-500', value: 'tinctures' },
  { name: 'Topicals', icon: Sparkles, gradient: 'from-pink-400 to-rose-500', value: 'topicals' },
  { name: 'Accessories', icon: Box, gradient: 'from-slate-400 to-gray-500', value: 'accessories' }
];

export default function CategoryGrid() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-emerald-900 mb-2">Shop by Category</h2>
          <p className="text-emerald-600">Explore our curated selection</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category, i) => (
            <motion.div
              key={category.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`${createPageUrl('Shop')}?category=${category.value}`}>
                <div className="group cursor-pointer">
                  <div className={`aspect-square rounded-3xl bg-gradient-to-br ${category.gradient} p-6 flex items-center justify-center mb-3 shadow-lg hover:shadow-xl transition-all hover:scale-105`}>
                    <category.icon className="w-10 h-10 text-white" strokeWidth={2} />
                  </div>
                  <p className="text-center text-sm font-semibold text-emerald-900 group-hover:text-emerald-600 transition-colors">
                    {category.name}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}