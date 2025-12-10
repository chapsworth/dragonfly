import React from 'react';
import { Package, Cannabis, Cigarette, Cookie, Droplets, Wind, Sparkles, Flame, Grid3x3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const iconMap = {
  Cannabis,
  Cigarette,
  Cookie,
  Droplets,
  Wind,
  Sparkles,
  Flame,
  Package
};

export default function CategoryGrid({ selectedCategory, onCategoryChange }) {
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list()
  });

  const activeCategories = dbCategories.
  filter((c) => c.is_active).
  sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const categories = [
  { name: 'All', icon: Grid3x3, gradient: 'from-emerald-400 to-green-500', value: 'all' },
  ...activeCategories.map((cat) => ({
    name: cat.name,
    icon: iconMap[cat.icon_name] || Package,
    gradient: cat.gradient || 'from-emerald-400 to-green-500',
    value: cat.slug
  }))];


  return (
    <section className="">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category, i) =>
          <motion.button
          key={category.value}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => onCategoryChange(category.value)}
          className="flex-shrink-0 relative">

            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:bg-white/30">
              <div className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md transition-all",
              category.gradient
            )}>
                <category.icon className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div className="relative">
                <p className={cn(
                "text-xs font-semibold transition-colors whitespace-nowrap",
                selectedCategory === category.value ? "text-emerald-700" : "text-emerald-600"
              )}>
                  {category.name}
                </p>
                {selectedCategory === category.value && (
                  <motion.div
                    layoutId="categoryIndicator"
                    className="absolute -bottom-1.5 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
            </div>
          </motion.button>
          )}
        </div>
      </div>
    </section>);

}