import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, Sparkles, ChevronRight, Loader2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductEditModal from '@/components/products/ProductEditModal';

const categoryColors = {
  flower: 'from-emerald-400 to-green-500',
  'pre-rolls': 'from-orange-400 to-amber-500',
  edibles: 'from-purple-400 to-indigo-500',
  concentrates: 'from-yellow-400 to-amber-500',
  vapes: 'from-cyan-400 to-blue-500',
  tinctures: 'from-pink-400 to-rose-500',
  topicals: 'from-lime-400 to-green-500',
  accessories: 'from-gray-400 to-slate-500'
};

export default function ProductLibrary() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(search.toLowerCase()) ||
                         product.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredProducts = products.filter(p => p.published && p.in_stock).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Package className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-emerald-900">Product Library</h1>
          </div>
          <p className="text-emerald-600 text-lg">Browse our complete product catalog</p>
        </motion.div>

        {/* Featured Products Banner */}
        {featuredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Featured Products
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  onClick={() => setSelectedProduct(product)}
                  className="cursor-pointer"
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow bg-white/80 backdrop-blur border-2 border-emerald-200 hover:border-emerald-400">
                    <div className="h-32 relative">
                      <img 
                        src={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400'} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-2 right-2 px-3 py-1 rounded-full bg-gradient-to-r ${categoryColors[product.category]} text-white text-xs font-bold`}>
                        {product.category}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-emerald-900 mb-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-emerald-600 font-bold text-lg">${product.price?.toFixed(2)}</p>
                        <Badge variant={product.in_stock ? "default" : "secondary"} className="text-xs">
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 space-y-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-white/80 backdrop-blur border-emerald-200 focus:border-emerald-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {['all', 'flower', 'pre-rolls', 'edibles', 'concentrates', 'vapes', 'tinctures', 'topicals', 'accessories'].map(category => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className={selectedCategory === category ? `bg-gradient-to-r ${categoryColors[category] || 'from-emerald-500 to-green-500'}` : ''}
                size="sm"
              >
                {category === 'all' ? 'All Products' : category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-emerald-600">No products found.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all bg-white/60 backdrop-blur border border-emerald-200 hover:border-emerald-400 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <div className="h-40 relative">
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=300'} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full bg-gradient-to-r ${categoryColors[product.category]} text-white text-xs font-bold`}>
                      {product.category}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduct(product);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
                    >
                      <Edit2 className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-emerald-900 mb-2">{product.name}</h3>
                    <p className="text-xs text-emerald-600 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg text-emerald-900">${product.price?.toFixed(2)}</p>
                      <ChevronRight className="w-4 h-4 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ProductEditModal
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
      />

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur">
          {selectedProduct && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${categoryColors[selectedProduct.category]} flex items-center justify-center shadow-lg`}>
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`bg-gradient-to-r ${categoryColors[selectedProduct.category]} text-white`}>
                        {selectedProduct.category}
                      </Badge>
                      <Badge variant={selectedProduct.in_stock ? "default" : "secondary"}>
                        {selectedProduct.in_stock ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                      {selectedProduct.published && (
                        <Badge variant="outline" className="border-emerald-400 text-emerald-700">
                          Published
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingProduct(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {selectedProduct.image_url && (
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                )}

                <div>
                  <h3 className="font-bold text-emerald-900 mb-2">Description</h3>
                  <p className="text-emerald-700">{selectedProduct.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-xs text-emerald-600 mb-1">Price</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      ${selectedProduct.price?.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Stock</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedProduct.stock_quantity || 0}
                    </p>
                  </div>
                </div>

                {selectedProduct.weight && (
                  <div>
                    <h3 className="font-bold text-emerald-900 mb-2">Weight/Size</h3>
                    <p className="text-emerald-700">{selectedProduct.weight}</p>
                  </div>
                )}

                {selectedProduct.thc_level && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold text-emerald-900 mb-2">THC Level</h3>
                      <p className="text-emerald-700">{selectedProduct.thc_level}%</p>
                    </div>
                    {selectedProduct.cbd_level && (
                      <div>
                        <h3 className="font-bold text-emerald-900 mb-2">CBD Level</h3>
                        <p className="text-emerald-700">{selectedProduct.cbd_level}%</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedProduct.strain_type && selectedProduct.strain_type !== 'n/a' && (
                  <div>
                    <h3 className="font-bold text-emerald-900 mb-2">Strain Type</h3>
                    <Badge className="bg-purple-500">
                      {selectedProduct.strain_type}
                    </Badge>
                  </div>
                )}

                {selectedProduct.variants?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-emerald-900 mb-3">Variants</h3>
                    <div className="space-y-2">
                      {selectedProduct.variants.map((variant, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                          <span className="text-emerald-900 font-semibold">{variant.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-700">${variant.price?.toFixed(2)}</span>
                            <Badge variant={variant.stock_quantity > 0 ? "default" : "secondary"}>
                              {variant.stock_quantity || 0} in stock
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.sku && (
                  <div>
                    <h3 className="font-bold text-emerald-900 mb-2">SKU</h3>
                    <p className="text-emerald-700 font-mono text-sm">{selectedProduct.sku}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}