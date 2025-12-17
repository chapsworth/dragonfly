import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Home, ShoppingBag, Phone, Leaf, Cannabis, Cookie, Droplets, 
  Wind, Sparkles, Flame, Package, X, ClipboardList, LayoutDashboard, Cigarette,
  ShoppingCart, Heart, Candy, ChevronDown, LogOut, User, Users, FolderTree, Settings, Image, Briefcase, Glasses
} from 'lucide-react';
import { motion } from 'framer-motion';

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

const navItems = [
  { name: 'Home', page: 'Home', icon: Home },
  { name: 'Shop', page: 'Shop', icon: ShoppingBag },
  { name: 'Strain Library', page: 'StrainLibrary', icon: Leaf },
  { name: 'Product Library', page: 'ProductLibrary', icon: Package },
  { name: 'Glass Portal', page: 'GlassPortal', icon: Glasses },
  { name: 'Radio', page: 'Radio', icon: Wind },
  { name: 'Rewards', page: 'Rewards', icon: Sparkles },
  { name: 'My Orders', page: 'Orders', icon: ClipboardList },
  { name: 'My Profile', page: 'Profile', icon: User },
  { name: 'Contact', page: 'Contact', icon: Phone },
];

const adminNavItems = [
  { name: 'Dashboard', page: 'AdminDashboard', icon: LayoutDashboard },
  { name: 'Products', page: 'AdminProducts', icon: Package },
  { name: 'Categories', page: 'AdminCategories', icon: FolderTree },
  { name: 'Orders', page: 'AdminOrders', icon: ShoppingCart },
  { name: 'Users', page: 'AdminUsers', icon: Users },
  { name: 'CRM', page: 'CRM', icon: Briefcase },
  { name: 'Carousel', page: 'AdminCarousel', icon: Image },
  { name: 'Settings', page: 'AdminSettings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list()
  });

  const categories = dbCategories
    .filter(c => c.is_active)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .map(c => ({
      name: c.name,
      slug: c.slug,
      icon: iconMap[c.icon_name] || Package,
      color: c.gradient || 'from-emerald-400 to-green-500'
    }));

  const isAdmin = user?.role === 'admin';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 bg-white border-r border-white/20 p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b border-emerald-100/50">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Dragonfly
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-1 mb-6">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={createPageUrl(item.page)}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                  >
                    <item.icon className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700" />
                    <span className="font-medium text-emerald-800">{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            {isAdmin && (
              <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen} className="border-t border-emerald-100/50 pt-4 mb-6">
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 hover:bg-emerald-50 rounded-xl transition-colors">
                  <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                    Admin
                  </h3>
                  <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1">
                  {adminNavItems.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={createPageUrl(item.page)}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                      >
                        <item.icon className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700" />
                        <span className="font-medium text-emerald-800">{item.name}</span>
                      </Link>
                    </motion.div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            <Collapsible open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen} className="border-t border-emerald-100/50 pt-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 hover:bg-emerald-50 rounded-xl transition-colors">
                <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                  Categories
                </h3>
                <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-1">
                  {categories.map((cat, i) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                    >
                      <Link
                        to={`${createPageUrl('Shop')}?category=${cat.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                          <cat.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-emerald-800">{cat.name}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="p-4 pb-20 border-t border-emerald-100/50 space-y-3">
            {user && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">{user.full_name}</span>
                </div>
                <button
                  onClick={() => base44.auth.logout(window.location.origin)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            )}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-200/50">
              <p className="text-xs text-emerald-600 mb-1">Need help?</p>
              <p className="text-sm font-medium text-emerald-800">Call us at (555) 420-1234</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}