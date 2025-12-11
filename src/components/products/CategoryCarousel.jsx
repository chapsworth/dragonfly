import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, ChevronRight, Leaf, Cannabis, Cookie, Droplets, Wind, Sparkles, Flame, Package, Cigarette, Plus } from 'lucide-react';
import ProductCard from './ProductCard';
import AddProductToCarousel from './AddProductToCarousel';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const categoryIcons = {
  flower: Cannabis,
  prerolls: Cigarette,
  'pre-rolls': Cigarette,
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

const strainColors = {
  indica: 'from-purple-400 to-indigo-500',
  sativa: 'from-orange-400 to-amber-500',
  hybrid: 'from-emerald-400 to-green-500',
  cbd: 'from-blue-400 to-cyan-500'
};

export default function CategoryCarousel({ category, products, selectedStrain = 'all', sortBy = null, sortDirection = 'desc', search = '' }) {
  const scrollRef = useRef(null);
  const Icon = categoryIcons[category] || Leaf;
  const gradientColor = categoryColors[category] || 'from-emerald-400 to-green-500';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };



  let filteredProducts = [...products];

  // Filter by search
  if (search) {
    filteredProducts = filteredProducts.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Filter by strain
  if (selectedStrain !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.strain_type === selectedStrain);
  }

  // Sort products
  if (sortBy) {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      const aVal = sortBy === 'thc' ? (a.thc_level || 0) : (a.cbd_level || 0);
      const bVal = sortBy === 'thc' ? (b.thc_level || 0) : (b.cbd_level || 0);
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  if (products.length === 0) return null;

  return (
    <div className="mb-8 max-w-7xl mx-auto">
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
        </div>
        
        <div className="flex items-center gap-2">
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
          
          <Link to={`${createPageUrl('Shop')}?category=${category}`}>
            <button className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:shadow-lg transition-all">
              Show All
            </button>
          </Link>
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

        {user?.role === 'admin' && (
          <motion.button
            onClick={() => setIsAddModalOpen(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredProducts.length * 0.05 }}
            className="min-w-[200px] sm:min-w-[240px] w-[200px] sm:w-[240px] h-[320px] sm:h-[370px] bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-xl rounded-3xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
            <div className="text-center px-4">
              <p className="font-semibold text-emerald-900 mb-1">Add Product</p>
              <p className="text-xs text-emerald-600">Select existing or create new</p>
            </div>
          </motion.button>
        )}
      </div>

      {user?.role === 'admin' && (
        <AddProductToCarousel
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          category={category}
        />
      )}
    </div>
  );
}