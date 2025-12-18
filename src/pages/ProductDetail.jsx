import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ArrowLeft, Leaf, Award, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/cart/CartContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import ProductEditModal from '@/components/products/ProductEditModal';

const strainColors = {
  indica: 'from-purple-400 to-indigo-500',
  sativa: 'from-amber-400 to-orange-500',
  hybrid: 'from-emerald-400 to-green-500',
  cbd: 'from-blue-400 to-cyan-500',
  'n/a': 'from-slate-400 to-gray-500'
};

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { addToCart, setIsCartOpen } = useCart();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.list();
      return products.find(p => p.id === productId);
    },
    enabled: !!productId
  });

  const { data: appSettings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const settings = await base44.entities.AppSettings.list();
      return settings[0] || null;
    }
  });

  React.useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-28 pb-12 px-4">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-28 pb-12 px-4">
        <div className="text-center py-20">
          <p className="text-emerald-600">Product not found</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedVariant);
    }
    setIsCartOpen(true);
  };

  const currentPrice = selectedVariant?.price || product?.price || 0;

  return (
    <>
      <Helmet>
        <title>{product.name} - Dragonfly</title>
        <meta name="description" content={product.description || `${product.name} - Premium cannabis products`} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description || `${product.name} - Premium cannabis products`} />
        <meta property="og:image" content={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=800'} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:price:amount" content={currentPrice} />
        <meta property="og:price:currency" content="USD" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.name} />
        <meta name="twitter:description" content={product.description || `${product.name} - Premium cannabis products`} />
        <meta name="twitter:image" content={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=800'} />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-28 pb-40 px-4">
        <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to={createPageUrl('Shop')} className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
            <ArrowLeft className="w-5 h-5" />
            Back to Shop
          </Link>
          {user?.role === 'admin' && (
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-xl border-emerald-200 hover:bg-emerald-50"
            >
              <Edit2 className="w-5 h-5 text-emerald-600" />
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative aspect-square rounded-3xl overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl"
          >
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=800'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.category !== 'accessories' && product.strain_type && product.strain_type !== 'n/a' && (
              <Badge className={cn(
                "absolute top-6 left-6 px-4 py-2 text-base bg-gradient-to-r",
                strainColors[product.strain_type],
                "text-white shadow-lg"
              )}>
                {product.strain_type.charAt(0).toUpperCase() + product.strain_type.slice(1)}
              </Badge>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-6">
              <Badge variant="outline" className="mb-3 border-emerald-300 text-emerald-700">
                {product.category.replace('-', ' ').toUpperCase()}
              </Badge>
              <h1 className="text-4xl font-bold text-emerald-900 mb-2">{product.name}</h1>
              {product.weight && (
                <p className="text-emerald-600 flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  {product.weight}
                </p>
              )}
            </div>

            {/* THC/CBD */}
            {product.category !== 'accessories' && (product.thc_level > 0 || product.cbd_level > 0) && (
              <div className="flex gap-3 mb-6">
                {product.thc_level > 0 && (
                  <div className="flex-1 p-4 rounded-2xl bg-amber-100 border border-amber-200">
                    <p className="text-xs text-amber-600 mb-1">THC Level</p>
                    <p className="text-2xl font-bold text-amber-700">{product.thc_level}%</p>
                  </div>
                )}
                {product.cbd_level > 0 && (
                  <div className="flex-1 p-4 rounded-2xl bg-blue-100 border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">CBD Level</p>
                    <p className="text-2xl font-bold text-blue-700">{product.cbd_level}%</p>
                  </div>
                )}
              </div>
            )}

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-emerald-900 mb-3">Select Size</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.name}
                      onClick={() => setSelectedVariant(variant)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        selectedVariant?.name === variant.name
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-emerald-200 bg-white hover:border-emerald-300"
                      )}
                    >
                      <p className="font-semibold text-emerald-900">{variant.name}</p>
                      <p className="text-sm text-emerald-600">${variant.price.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-6 p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40">
                <h3 className="font-bold text-emerald-900 mb-2">Description</h3>
                <p className="text-emerald-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Price & Add to Cart */}
            <div className="mt-auto">
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-sm text-emerald-600 mb-1">Price</p>
                  <p className="text-4xl font-bold text-emerald-700">${currentPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-xl border-emerald-200"
                  >
                    -
                  </Button>
                  <span className="text-2xl font-bold text-emerald-900 w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl border-emerald-200"
                  >
                    +
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/30"
              >
                <ShoppingBag className="w-6 h-6 mr-2" />
                Add to Bag - ${(currentPrice * quantity).toFixed(2)}
              </Button>

              {product.in_stock ? (
                <p className="text-center text-sm text-emerald-600 mt-3 flex items-center justify-center gap-2">
                  <Award className="w-4 h-4" />
                  Earn {Math.floor(currentPrice * quantity)} loyalty points
                </p>
              ) : (
                <p className="text-center text-sm text-red-600 mt-3">Out of stock</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ProductEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['product', productId] });
        }}
        product={product}
      />
      </div>
    </>
  );
}