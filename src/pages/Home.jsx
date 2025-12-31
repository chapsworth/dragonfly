import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cannabis, Truck, Shield, Clock, Leaf, Settings, Phone, SlidersHorizontal, ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import CategoryCarousel from '@/components/products/CategoryCarousel';
import CategoryGrid from '@/components/home/CategoryGrid';
import HomeSettingsModal from '@/components/admin/HomeSettingsModal';
import PageEditor from '@/components/editor/PageEditor';
import OrderNotification from '@/components/admin/OrderNotification';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [pageSections, setPageSections] = React.useState([]);
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const [selectedStrain, setSelectedStrain] = React.useState('all');
  const [sortBy, setSortBy] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState('desc');
  const [search, setSearch] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const products = allProducts.filter(p => p.published !== false);

  const { data: homeSettings } = useQuery({
    queryKey: ['homeSettings'],
    queryFn: async () => {
      const settings = await base44.entities.HomeSettings.list();
      return settings[0] || null;
    }
  });

  const { data: appSettings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const settings = await base44.entities.AppSettings.list();
      return settings[0] || null;
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list()
  });

  const { data: carouselSettings = [] } = useQuery({
    queryKey: ['carouselSettings'],
    queryFn: () => base44.entities.CarouselSettings.list()
  });

  // Get active categories sorted by display order
  const activeCategories = categories
    .filter(c => c.is_active)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  // Sort carousels by display_order and filter active ones
  const activeCarousels = carouselSettings
    .filter(c => c.is_active)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const productsByCategory = activeCategories.reduce((acc, cat) => {
    const carouselSetting = carouselSettings.find(c => c.category === cat.slug);
    
    if (carouselSetting?.featured_product_ids?.length > 0) {
      // Use featured products in specified order
      acc[cat.slug] = carouselSetting.featured_product_ids
        .map(id => products.find(p => p.id === id))
        .filter(Boolean);
    } else {
      // Show all products in category
      acc[cat.slug] = products.filter(p => p.category === cat.slug);
    }
    return acc;
  }, {});

  const heroBackgroundUrl = homeSettings?.hero_background_url || 'https://images.unsplash.com/photo-1587579286550-d42fcad93ec2?w=1600&q=80';
  const sectionOrder = Array.isArray(homeSettings?.section_order) && homeSettings.section_order.length > 0 
    ? homeSettings.section_order 
    : ['hero', 'features', 'category_grid', 'carousels'];

  const sections = {
    hero: (
      <section key="hero" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-24">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroBackgroundUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-white" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >

            
            <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight">
              Nature's Finest
              <span className="block bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
                Delivered Fresh
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Explore our curated selection of premium cannabis products. 
              Fast delivery, exceptional quality, always discreet.
            </p>

            <Link to={createPageUrl('Shop')}>
              <Button className="h-14 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg shadow-xl shadow-black/20">
                Order Now
                <Cannabis className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-white"
            />
          </div>
        </motion.div>
      </section>
    ),
    features: (
      <section key="features" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: 'Fast Delivery', desc: 'Same-day delivery available', color: 'from-emerald-400 to-green-500' },
              { icon: Shield, title: 'Lab Tested', desc: 'All products verified for quality', color: 'from-blue-400 to-cyan-500' },
              { icon: Clock, title: 'Always Fresh', desc: 'Premium products, always in stock', color: 'from-amber-400 to-orange-500' }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900 mb-1">{feature.title}</h3>
                <p className="text-emerald-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    ),
    category_grid: (
      <div key="category_grid" className="sticky top-0 lg:top-0 z-30 bg-white backdrop-blur-sm">
        {/* Title & Filter Button */}
        <div className="pt-3 px-4 pb-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center relative">
              <h1 className="text-3xl font-bold text-emerald-900">Shop</h1>
              <div className="absolute right-0 flex items-center gap-2">
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
                        className="h-9 rounded-lg bg-white border-gray-200 focus:border-emerald-400"
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => {
                    setIsSearchOpen(!isSearchOpen);
                    if (isSearchOpen) setSearch('');
                  }}
                  className="h-9 w-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                >
                  {isSearchOpen ? (
                    <X className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Search className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
                <button
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="h-9 w-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                >
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <CategoryGrid 
          selectedCategory={selectedCategory} 
          onCategoryChange={setSelectedCategory} 
        />

        {/* Global Filters */}
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pb-2"
            >
              <div className="flex flex-wrap items-center justify-center gap-2 px-4 pt-2">
                {/* Strain Filters */}
                <button
                  onClick={() => setSelectedStrain('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedStrain === 'all'
                      ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                      : 'bg-white/60 text-purple-700 hover:bg-white'
                  }`}
                >
                  All Strains
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
                  onClick={() => setSelectedStrain('sativa')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedStrain === 'sativa'
                      ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                      : 'bg-white/60 text-purple-700 hover:bg-white'
                  }`}
                >
                  Sativa
                </button>
                <button
                  onClick={() => setSelectedStrain('hybrid')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedStrain === 'hybrid'
                      ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                      : 'bg-white/60 text-purple-700 hover:bg-white'
                  }`}
                >
                  Hybrid
                </button>
                <button
                  onClick={() => setSelectedStrain('cbd')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedStrain === 'cbd'
                      ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                      : 'bg-white/60 text-purple-700 hover:bg-white'
                  }`}
                >
                  CBD
                </button>

                <div className="h-4 w-px bg-emerald-200 mx-1" />

                {/* Sort Filters */}
                <button
                  onClick={() => {
                    setSortBy('name');
                    setSortDirection('asc');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    sortBy === 'name'
                      ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-md'
                      : 'bg-white/60 text-blue-700 hover:bg-white'
                  }`}
                >
                  Name
                </button>
                <button
                  onClick={() => {
                    if (sortBy === 'price') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('price');
                      setSortDirection('asc');
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                    sortBy === 'price'
                      ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-md'
                      : 'bg-white/60 text-blue-700 hover:bg-white'
                  }`}
                >
                  Price
                  {sortBy === 'price' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (sortBy === 'thc') {
                      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                    } else {
                      setSortBy('thc');
                      setSortDirection('desc');
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                    sortBy === 'thc'
                      ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-md'
                      : 'bg-white/60 text-blue-700 hover:bg-white'
                  }`}
                >
                  THC
                  {sortBy === 'thc' && (
                    sortDirection === 'desc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ),
    carousels: (
      <section key="carousels" className="py-8 pb-24">
        <div className="max-w-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            activeCategories
              .filter(cat => {
                if (selectedCategory === 'all') return true;
                return cat.slug === selectedCategory;
              })
              .map(cat => {
                return (
                  <CategoryCarousel
                    key={cat.slug}
                    category={cat.slug}
                    products={productsByCategory[cat.slug] || []}
                    selectedStrain={selectedStrain}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    search={search}
                  />
                );
              })
          )}
        </div>
      </section>
    )
  };

  return (
    <>
      <Helmet>
        <title>Dragonfly - Premium Cannabis Delivery</title>
        <meta name="description" content="Explore our curated selection of premium cannabis products. Fast delivery, exceptional quality, always discreet." />
        <meta property="og:title" content="Dragonfly - Premium Cannabis Delivery" />
        <meta property="og:description" content="Explore our curated selection of premium cannabis products. Fast delivery, exceptional quality, always discreet." />
        <meta property="og:image" content={appSettings?.header_icon_url || 'https://images.unsplash.com/photo-1587579286550-d42fcad93ec2?w=1600&q=80'} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Dragonfly - Premium Cannabis Delivery" />
        <meta name="twitter:description" content="Explore our curated selection of premium cannabis products. Fast delivery, exceptional quality, always discreet." />
        <meta name="twitter:image" content={appSettings?.header_icon_url || 'https://images.unsplash.com/photo-1587579286550-d42fcad93ec2?w=1600&q=80'} />
      </Helmet>
      <div className="min-h-screen bg-white">
        <PageEditor sections={pageSections} onSectionsChange={setPageSections}>
        {/* Admin Order Notifications */}
        {user?.role === 'admin' && <OrderNotification />}

        {/* Render sections in order */}
        {sectionOrder.filter(key => sections[key]).map(sectionKey => sections[sectionKey])}

        {/* Edit Modal */}
        <HomeSettingsModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          settings={homeSettings}
        />
      </PageEditor>
    </div>
    </>
  );
}