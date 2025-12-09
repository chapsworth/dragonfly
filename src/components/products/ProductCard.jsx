import React from 'react';
import { ShoppingBag, Leaf } from 'lucide-react';
import { useCart } from '../cart/CartContext';
import { motion } from 'framer-motion';

const strainColors = {
  indica: 'from-purple-400 to-indigo-500',
  sativa: 'from-amber-400 to-orange-500',
  hybrid: 'from-emerald-400 to-green-500',
  cbd: 'from-blue-400 to-cyan-500',
  'n/a': 'from-slate-400 to-gray-500'
};

export default function ProductCard({ product }) {
  const { addToCart, setIsCartOpen } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
    setIsCartOpen(true);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="min-w-[200px] sm:min-w-[240px] bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-emerald-900/5 overflow-hidden group"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        {product.strain_type && product.strain_type !== 'n/a' && (
          <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${strainColors[product.strain_type]} shadow-lg`}>
            {product.strain_type.charAt(0).toUpperCase() + product.strain_type.slice(1)}
          </span>
        )}

        <button
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 p-3 rounded-xl bg-white/90 backdrop-blur hover:bg-white transition-colors shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
        >
          <ShoppingBag className="w-5 h-5 text-emerald-600" />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-emerald-900 truncate mb-1">{product.name}</h3>
        
        {(product.thc_level || product.cbd_level) && (
          <div className="flex gap-2 mb-2">
            {product.thc_level > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-medium">
                THC {product.thc_level}%
              </span>
            )}
            {product.cbd_level > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                CBD {product.cbd_level}%
              </span>
            )}
          </div>
        )}

        {product.weight && (
          <p className="text-xs text-emerald-500 mb-2">{product.weight}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-emerald-700">${product.price?.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            className="sm:hidden p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}