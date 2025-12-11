import React from 'react';
import { Package, Cannabis, Cigarette, Cookie, Droplets, Wind, Sparkles, Flame, Grid3x3, Leaf, Droplet, ShoppingBag, Heart, Candy } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const iconMap = {
  Cannabis,
  Cigarette,
  Cookie,
  Droplets,
  Droplet: Droplets,
  Wind,
  Sparkles,
  Flame,
  Package,
  Leaf: Cannabis,
  ShoppingBag: Package,
  Heart: Flame,
  Candy: Cookie
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
    <section className="px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:justify-between scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((category) =>
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className="flex-shrink-0 flex flex-col items-center gap-2 p-2 md:p-3 rounded-xl transition-all hover:bg-white/30 min-w-[70px] md:min-w-[90px]">

            <div className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm transition-all",
              category.gradient
            )}>
              <category.icon className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2} />
            </div>
            <div className="relative">
              <p className={cn(
                "text-xs font-medium transition-colors whitespace-nowrap",
                selectedCategory === category.value ? "text-emerald-700" : "text-emerald-600"
              )}>
                {category.name}
              </p>
              {selectedCategory === category.value &&
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" />
              }
            </div>
          </button>
          )}
        </div>
      </div>
    </section>);

}