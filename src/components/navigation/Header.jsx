import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { PanelLeft, ShoppingBag, Leaf, Grid2x2, LogIn, User } from 'lucide-react';
import { useCart } from '../cart/CartContext';
import { motion } from 'framer-motion';
import QuickCreateMenu from './QuickCreateMenu';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Header({ onMenuClick }) {
  const { cartCount, setIsCartOpen } = useCart();
  
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

  const isAdmin = user?.role === 'admin';
  
  const { data: appSettings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const settings = await base44.entities.AppSettings.list();
      return settings[0] || null;
    }
  });

  return (
    <header className="fixed lg:static top-0 left-0 right-0 z-40 lg:z-auto">
      <div className="mx-4 mt-4 lg:mx-0 lg:mt-0">
        <div className="bg-white/60 lg:bg-white/0 backdrop-blur-md rounded-2xl lg:rounded-none border border-white/20 lg:border-none shadow-lg lg:shadow-none shadow-emerald-900/5 px-4 py-3">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-2 z-10">
              <button
                onClick={onMenuClick}
                className="p-2 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <PanelLeft className="w-6 h-6 text-emerald-700" />
              </button>
              {isAdmin && (
                <Link to={createPageUrl('AdminLauncher')}>
                  <button className="p-2 rounded-xl hover:bg-emerald-50 transition-colors">
                    <Grid2x2 className="w-6 h-6 text-emerald-700" />
                  </button>
                </Link>
              )}
              {user && <NotificationBell />}
            </div>

            <Link to={createPageUrl('Home')} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                {appSettings?.header_icon_url ? (
                  <img 
                    src={appSettings.header_icon_url} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Leaf className="w-6 h-6 text-white" />
                )}
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent hidden sm:block">
                {appSettings?.site_name || 'Dragonfly'}
              </span>
            </Link>

            <div className="flex items-center gap-1 z-10">
              <QuickCreateMenu />
              <button
                onClick={() => setIsCartOpen(true)}
                data-cart-button
                className="relative p-2 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-emerald-700" />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white text-xs font-bold flex items-center justify-center shadow-lg"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>
              {user ? (
                <Link to={createPageUrl('Profile')}>
                  <button className="p-2 rounded-xl hover:bg-emerald-50 transition-colors">
                    <User className="w-6 h-6 text-emerald-700" />
                  </button>
                </Link>
              ) : (
                <Button 
                  onClick={() => base44.auth.redirectToLogin()} 
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-green-500 h-9"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}