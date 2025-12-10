import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, ShoppingBag, Leaf, Phone } from 'lucide-react';
import { useCart } from '../cart/CartContext';
import { motion } from 'framer-motion';

export default function Header({ onMenuClick }) {
  const { cartCount, setIsCartOpen } = useCart();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="fixed lg:static top-0 left-0 right-0 z-40 lg:z-auto">
      <div className="mx-4 mt-4 lg:mx-0 lg:mt-0">
        <div className="bg-white/60 lg:bg-white/0 backdrop-blur-md rounded-2xl lg:rounded-none border border-white/20 lg:border-none shadow-lg lg:shadow-none shadow-emerald-900/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              <Menu className="w-6 h-6 text-emerald-700" />
            </button>

            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent hidden sm:block">
                Dragonfly
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <Link to={createPageUrl('Contact')}>
                <button className="p-2 rounded-xl hover:bg-green-50 transition-colors">
                  <Phone className="w-6 h-6 text-green-600" />
                </button>
              </Link>

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
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}