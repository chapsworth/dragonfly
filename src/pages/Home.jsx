import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Shield, Clock, Leaf, Settings, Phone } from 'lucide-react';
import CategoryCarousel from '@/components/products/CategoryCarousel';
import CategoryGrid from '@/components/home/CategoryGrid';
import HomeSettingsModal from '@/components/admin/HomeSettingsModal';
import PageEditor from '@/components/editor/PageEditor';
import { motion } from 'framer-motion';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [pageSections, setPageSections] = React.useState([]);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: homeSettings } = useQuery({
    queryKey: ['homeSettings'],
    queryFn: async () => {
      const settings = await base44.entities.HomeSettings.list();
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
                <ArrowRight className="w-5 h-5 ml-2" />
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
      <CategoryGrid 
        key="category_grid"
        selectedCategory={selectedCategory} 
        onCategoryChange={setSelectedCategory} 
      />
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
                  />
                );
              })
          )}
        </div>
      </section>
    )
  };

  return (
    <div className="min-h-screen bg-white">
      <PageEditor sections={pageSections} onSectionsChange={setPageSections}>
        {/* Admin Edit Button */}
        {user?.role === 'admin' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsEditModalOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow"
          >
            <Settings className="w-6 h-6 text-white" />
          </motion.button>
        )}

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
  );
}