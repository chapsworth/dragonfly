import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, ChevronRight, Leaf, Cannabis, Cookie, Droplets, Wind, Sparkles, Flame, Package, ArrowUp, ArrowDown, Cigarette } from 'lucide-react';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';
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

const strainColors = {
  indica: 'from-purple-400 to-indigo-500',
  sativa: 'from-orange-400 to-amber-500',
  hybrid: 'from-emerald-400 to-green-500',
  cbd: 'from-blue-400 to-cyan-500'
};

export default function CategoryCarousel({ category, products }) {
  const [selectedStrain, setSelectedStrain] = React.useState('all');
  const [sortBy, setSortBy] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState('asc');
  const scrollRef = useRef(null);
  
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list()
  });
  
  const categoryData = dbCategories.find(c => c.slug === category);
  const Icon = categoryData ? (iconMap[categoryData.icon_name] || Package) : Leaf;
  const gradientColor = categoryData?.gradient || 'from-emerald-400 to-green-500';

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSort = (type) => {
    if (sortBy === type) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortDirection('desc');
    }
  };

  let filteredProducts = selectedStrain === 'all' 
    ? products 
    : products.filter(p => p.strain_type === selectedStrain);

  if (sortBy) {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      const aVal = sortBy === 'thc' ? (a.thc_level || 0) : (a.cbd_level || 0);
      const bVal = sortBy === 'thc' ? (b.thc_level || 0) : (b.cbd_level || 0);
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  if (products.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-emerald-900 capitalize">{category.replace('-', ' ')}</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-sm font-medium">
              {filteredProducts.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStrain('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedStrain === 'all'
                  ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md'
                  : 'bg-white/60 text-emerald-700 hover:bg-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStrain('sativa')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedStrain === 'sativa'
                  ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md'
                  : 'bg-white/60 text-orange-700 hover:bg-white'
              }`}
            >
              Sativa
            </button>
            <button
              onClick={() => setSelectedStrain('hybrid')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedStrain === 'hybrid'
                  ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md'
                  : 'bg-white/60 text-emerald-700 hover:bg-white'
              }`}
            >
              Hybrid
            </button>
            <button
              onClick={() => setSelectedStrain('indica')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedStrain === 'indica'
                  ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                  : 'bg-white/60 text-purple-700 hover:bg-white'
              }`}
            >
              Indica
            </button>
            <button
              onClick={() => handleSort('thc')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                sortBy === 'thc'
                  ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                  : 'bg-white/60 text-red-700 hover:bg-white'
              }`}
            >
              THC
              {sortBy === 'thc' && (
                sortDirection === 'desc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={() => handleSort('cbd')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                sortBy === 'cbd'
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-md'
                  : 'bg-white/60 text-blue-700 hover:bg-white'
              }`}
            >
              CBD
              {sortBy === 'cbd' && (
                sortDirection === 'desc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link to={`${createPageUrl('Shop')}?category=${category}`}>
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 text-white text-sm font-semibold hover:shadow-lg transition-all">
              Show All
            </button>
          </Link>
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
        {filteredProducts.map((product, index) => (
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