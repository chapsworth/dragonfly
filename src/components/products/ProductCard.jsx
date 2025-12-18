import React from 'react';
import { ShoppingBag, Leaf, Pencil } from 'lucide-react';
import { useCart } from '../cart/CartContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import ProductEditModal from './ProductEditModal';
import DealBadge from './DealBadge';

const strainColors = {
  indica: 'from-purple-400 to-indigo-500',
  sativa: 'from-amber-400 to-orange-500',
  hybrid: 'from-emerald-400 to-green-500',
  cbd: 'from-blue-400 to-cyan-500',
  'n/a': 'from-slate-400 to-gray-500'
};

const getDefaultVariant = (category) => {
  const variantMap = {
    'flower': 'Eighth',
    'vapes': '1 Cart',
    'edibles': '1 Unit',
    'concentrates': '1 Gram'
  };
  return variantMap[category] || null;
};

export default function ProductCard({ product }) {
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedVariant, setSelectedVariant] = React.useState(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0];
    }
    return null;
  });
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedVariant);
  };

  return (
    <>
    <Link to={`${createPageUrl('ProductDetail')}?id=${product.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="min-w-[200px] sm:min-w-[240px] w-[200px] sm:w-[240px] bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-emerald-900/5 overflow-hidden group"
      >
        <div className="relative w-full h-[200px] sm:h-[240px] overflow-hidden">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_deal && product.deal_type && (
            <DealBadge dealType={product.deal_type} size="sm" />
          )}
          {product.strain_type && product.strain_type !== 'n/a' && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${strainColors[product.strain_type]} shadow-lg`}>
              {product.strain_type.charAt(0).toUpperCase() + product.strain_type.slice(1)}
            </span>
          )}
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditOpen(true);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
          >
            <Pencil className="w-4 h-4 text-emerald-600" />
          </button>
        )}
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

        <div className="min-h-[36px] mb-2 flex items-start">
          {product.variants?.length > 0 ? (
            <div className="flex flex-wrap gap-1" onClick={(e) => e.preventDefault()}>
              {product.variants.map((variant, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariant(variant);
                  }}
                  className={`px-2 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedVariant?.name === variant.name
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          ) : (
            product.weight && <p className="text-xs text-emerald-500">{product.weight}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-emerald-700">
              ${(selectedVariant?.price || product.price)?.toFixed(2)}
            </span>
            {product.variants?.length > 1 && !selectedVariant && (
              <span className="text-[10px] text-emerald-500">
                ${Math.min(...product.variants.map(v => v.price)).toFixed(2)} - ${Math.max(...product.variants.map(v => v.price)).toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              handleAddToCart(e);
              // Create flying animation element
              const button = e.currentTarget;
              const rect = button.getBoundingClientRect();
              const flyingBag = document.createElement('div');
              flyingBag.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
              flyingBag.style.cssText = `position: fixed; left: ${rect.left}px; top: ${rect.top}px; width: 40px; height: 40px; background: linear-gradient(to right, #10b981, #22c55e); border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 9999; pointer-events: none; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.5);`;
              document.body.appendChild(flyingBag);
              
              const cartButton = document.querySelector('[data-cart-button]');
              const targetRect = cartButton?.getBoundingClientRect();
              
              if (targetRect) {
                flyingBag.animate([
                  { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                  { transform: `translate(${targetRect.left - rect.left}px, ${targetRect.top - rect.top}px) scale(0.2)`, opacity: 0.8 }
                ], {
                  duration: 600,
                  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }).onfinish = () => flyingBag.remove();
              } else {
                setTimeout(() => flyingBag.remove(), 600);
              }
            }}
            className="p-2 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 text-white hover:from-emerald-500 hover:to-green-600 transition-colors shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
    </Link>
    
    {isEditOpen && (
      <ProductEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        product={product}
      />
    )}
  </>
  );
}