import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Home, ShoppingBag, Phone, Leaf, Cannabis, Cookie, Droplets, 
  Wind, Sparkles, Flame, Package, X, ClipboardList 
} from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
  { name: 'Flower', icon: Leaf, color: 'from-green-400 to-emerald-500' },
  { name: 'Pre-Rolls', icon: Cannabis, color: 'from-lime-400 to-green-500' },
  { name: 'Edibles', icon: Cookie, color: 'from-amber-400 to-orange-500' },
  { name: 'Concentrates', icon: Droplets, color: 'from-yellow-400 to-amber-500' },
  { name: 'Vapes', icon: Wind, color: 'from-cyan-400 to-blue-500' },
  { name: 'Tinctures', icon: Sparkles, color: 'from-purple-400 to-violet-500' },
  { name: 'Topicals', icon: Flame, color: 'from-pink-400 to-rose-500' },
  { name: 'Accessories', icon: Package, color: 'from-slate-400 to-gray-500' },
];

const navItems = [
  { name: 'Home', page: 'Home', icon: Home },
  { name: 'Shop', page: 'Shop', icon: ShoppingBag },
  { name: 'My Orders', page: 'Orders', icon: ClipboardList },
  { name: 'Contact', page: 'Contact', icon: Phone },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 bg-white/80 backdrop-blur-xl border-r border-white/20 p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b border-emerald-100/50">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                GreenLeaf
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

            <div className="border-t border-emerald-100/50 pt-4">
              <h3 className="px-4 text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <div className="space-y-1">
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                  >
                    <Link
                      to={`${createPageUrl('Shop')}?category=${cat.name.toLowerCase().replace('-', '')}`}
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
            </div>
          </div>

          <div className="p-4 border-t border-emerald-100/50">
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