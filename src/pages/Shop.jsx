import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import CategoryGrid from '@/components/home/CategoryGrid';
import { motion, AnimatePresence } from 'framer-motion';

const strainTypes = [
  { value: 'all', label: 'All Strains' },
  { value: 'indica', label: 'Indica' },
  { value: 'sativa', label: 'Sativa' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'cbd', label: 'CBD' }
];

export default function Shop() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');

  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [category, setCategory] = useState(categoryParam || 'all');
  const [strain, setStrain] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list()
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    ...dbCategories
      .filter(c => c.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(c => ({ value: c.slug, label: c.name }))
  ];

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (search) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (strain !== 'all') {
      filtered = filtered.filter(p => p.strain_type === strain);
    }

    if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'thc-high') {
      filtered = [...filtered].sort((a, b) => (b.thc_level || 0) - (a.thc_level || 0));
    }

    return filtered;
  }, [products, search, category, strain, sortBy]);

  const activeFilters = [
    category !== 'all' && { type: 'category', value: category, label: categories.find(c => c.value === category)?.label },
    strain !== 'all' && { type: 'strain', value: strain, label: strainTypes.find(s => s.value === strain)?.label }
  ].filter(Boolean);

  const clearFilter = (type) => {
    if (type === 'category') setCategory('all');
    if (type === 'strain') setStrain('all');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-28 pb-12 px-4">
      <div className="max-w-7xl mx-auto overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-emerald-900 mb-2">
              {category !== 'all' 
                ? categories.find(c => c.value === category)?.label || 'Shop'
                : 'Shop'}
            </h1>
            <p className="text-emerald-600">
              {category !== 'all' 
                ? `Explore our ${categories.find(c => c.value === category)?.label.toLowerCase()} collection`
                : 'Browse our premium selection of cannabis products'}
            </p>
          </div>
          
          {/* Expandable Search */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 rounded-lg bg-white/60 border-emerald-200 focus:border-emerald-400"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearch('');
              }}
              className="h-10 w-10 rounded-lg bg-white/60 hover:bg-white"
            >
              {isSearchOpen ? (
                <X className="w-5 h-5 text-emerald-600" />
              ) : (
                <Search className="w-5 h-5 text-emerald-600" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Category Grid */}
        <CategoryGrid 
          selectedCategory={category}
          onCategoryChange={setCategory}
        />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {/* Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Strain Filters */}
            {strainTypes.map(s => (
              <button
                key={s.value}
                onClick={() => setStrain(s.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  strain === s.value
                    ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                    : 'bg-white/60 text-purple-700 hover:bg-white'
                }`}
              >
                {s.label}
              </button>
            ))}

            <div className="h-4 w-px bg-emerald-200 mx-1" />

            {/* Sort Filters */}
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                sortBy === 'name'
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-md'
                  : 'bg-white/60 text-blue-700 hover:bg-white'
              }`}
            >
              Name
            </button>
            <button
              onClick={() => setSortBy('price-low')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                sortBy === 'price-low'
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-md'
                  : 'bg-white/60 text-blue-700 hover:bg-white'
              }`}
            >
              Price ↑
            </button>
            <button
              onClick={() => setSortBy('price-high')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                sortBy === 'price-high'
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-md'
                  : 'bg-white/60 text-blue-700 hover:bg-white'
              }`}
            >
              Price ↓
            </button>
            <button
              onClick={() => setSortBy('thc-high')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                sortBy === 'thc-high'
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-md'
                  : 'bg-white/60 text-blue-700 hover:bg-white'
              }`}
            >
              THC ↓
            </button>
          </div>
        </motion.div>

        {/* Results count */}
        <p className="text-emerald-600 mb-6">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
        </p>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-emerald-600 text-lg">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 overflow-hidden">
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  className="min-w-0"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}