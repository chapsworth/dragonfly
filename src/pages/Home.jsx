import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Shield, Clock, Leaf } from 'lucide-react';
import CategoryCarousel from '@/components/products/CategoryCarousel';
import CategoryGrid from '@/components/home/CategoryGrid';
import { motion } from 'framer-motion';

const categories = ['flower', 'pre-rolls', 'edibles', 'concentrates', 'vapes', 'tinctures', 'topicals', 'accessories'];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: carouselSettings = [] } = useQuery({
    queryKey: ['carouselSettings'],
    queryFn: () => base44.entities.CarouselSettings.list()
  });

  // Sort carousels by display_order and filter active ones
  const activeCarousels = carouselSettings
    .filter(c => c.is_active)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const productsByCategory = categories.reduce((acc, cat) => {
    const carouselSetting = carouselSettings.find(c => c.category === cat);
    
    if (carouselSetting?.featured_product_ids?.length > 0) {
      // Use featured products in specified order
      acc[cat] = carouselSetting.featured_product_ids
        .map(id => products.find(p => p.id === id))
        .filter(Boolean);
    } else {
      // Show all products in category
      acc[cat] = products.filter(p => p.category === cat);
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-24">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1587579286550-d42fcad93ec2?w=1600&q=80"
            alt="Cannabis products"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/60 via-emerald-900/40 to-emerald-50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-6">
              <Leaf className="w-4 h-4 text-emerald-300" />
              <span className="text-white/90 text-sm font-medium">Premium Quality Cannabis</span>
            </div>
            
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Shop')}>
                <Button className="h-14 px-8 rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-lg shadow-xl shadow-black/20">
                  Order Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl('Contact')}>
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-2 border-white/40 text-white hover:bg-white/10 font-semibold text-lg backdrop-blur">
                  Contact Us
                </Button>
              </Link>
            </div>
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

      {/* Features */}
      <section className="py-16 px-4">
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

      {/* Category Grid */}
      <CategoryGrid 
        selectedCategory={selectedCategory} 
        onCategoryChange={setSelectedCategory} 
      />

      {/* Category Carousels */}
      <section className="py-8 pb-24">
        <div className="max-w-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            (activeCarousels.length > 0 ? activeCarousels : categories)
              .filter(item => {
                if (selectedCategory === 'all') return true;
                const cat = typeof item === 'string' ? item : item.category;
                return cat === selectedCategory;
              })
              .map(item => {
                const cat = typeof item === 'string' ? item : item.category;
                return (
                  <CategoryCarousel
                    key={cat}
                    category={cat}
                    products={productsByCategory[cat] || []}
                  />
                );
              })
          )}
        </div>
      </section>
    </div>
  );
}