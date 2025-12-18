import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, Sparkles, ChevronRight, Loader2, Edit2, Grid2X2, Rows, LayoutGrid, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ProductEditModal from '@/components/products/ProductEditModal';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

const categoryColors = {
  'pipes': 'from-amber-400 to-yellow-500',
  'bongs': 'from-cyan-400 to-blue-500',
  'grinders': 'from-pink-400 to-rose-500',
  'papers': 'from-orange-400 to-amber-500',
  'vaporizers': 'from-purple-400 to-indigo-500',
  'storage': 'from-emerald-400 to-green-500',
  'accessories': 'from-lime-400 to-green-500',
  'cleaning': 'from-teal-400 to-cyan-500'
};

export default function GlassPortal() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [aiSearch, setAiSearch] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [batchCount, setBatchCount] = useState(10);
  const [viewMode, setViewMode] = useState('grid2x2');
  const [confirmationModal, setConfirmationModal] = useState(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const glassProducts = products.filter(p => p.category === 'accessories');

  const filteredProducts = glassProducts.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(search.toLowerCase()) ||
                         product.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.name?.toLowerCase().includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const featuredProducts = filteredProducts.slice(0, 3);

  const handleAiDiscover = async (mode = 'single') => {
    if (mode === 'single' && !aiSearch.trim()) {
      toast.error('Please enter product name(s)');
      return;
    }

    setIsDiscovering(true);
    try {
      let payload;
      
      if (mode === 'surprise') {
        toast.info(`Finding ${batchCount} interesting glass products...`);
        const suggestResponse = await base44.functions.invoke('discoverGlass', {
          mode,
          count: batchCount
        });
        
        if (!suggestResponse.data.success || !suggestResponse.data.productNames?.length) {
          toast.error('No new products found');
          setIsDiscovering(false);
          return;
        }
        
        toast.success(`Found ${suggestResponse.data.productNames.length} products to discover!`);
        payload = { productNames: suggestResponse.data.productNames };
      } else {
        const names = aiSearch.split(',').map(n => n.trim()).filter(Boolean);
        if (names.length > 20) {
          toast.error('Maximum 20 products at a time');
          setIsDiscovering(false);
          return;
        }
        payload = { productNames: names };
      }

      toast.info('Discovering glass products... This may take a minute.');
      const response = await base44.functions.invoke('discoverGlass', payload);

      if (response.data.needsConfirmation && response.data.needsConfirmation.length > 0) {
        setConfirmationModal({
          names: response.data.needsConfirmation,
          payload: payload,
          mode: mode
        });
        setIsDiscovering(false);
        return;
      }

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        setAiSearch('');
        
        const { new: newCount, existing, failed } = response.data;
        toast.success(`Added ${newCount} new products! (${existing} already existed, ${failed} failed)`);
      } else {
        toast.error(response.data.error || 'Discovery failed');
      }
    } catch (error) {
      console.error('Discovery error:', error);
      toast.error('Failed to discover products');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleConfirmFictional = async () => {
    setIsDiscovering(true);
    try {
      const payload = { ...confirmationModal.payload, allowFictional: true };
      toast.info('Creating fictional products...');
      const response = await base44.functions.invoke('discoverGlass', payload);

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        setAiSearch('');
        const { new: newCount, existing, failed } = response.data;
        toast.success(`Added ${newCount} new products! (${existing} already existed, ${failed} failed)`);
      } else {
        toast.error(response.data.error || 'Creation failed');
      }
    } catch (error) {
      console.error('Creation error:', error);
      toast.error('Failed to create products');
    } finally {
      setConfirmationModal(null);
      setIsDiscovering(false);
    }
  };

  const handleDuplicate = async (product, e) => {
    e.stopPropagation();
    setIsDuplicating(true);
    try {
      const { id, created_date, updated_date, created_by, ...productData } = product;
      const duplicatedProduct = await base44.entities.Product.create({
        ...productData,
        name: `${productData.name} (Copy)`,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product duplicated successfully!');
    } catch (error) {
      console.error('Duplicate error:', error);
      toast.error('Failed to duplicate product');
    } finally {
      setIsDuplicating(false);
    }
  };

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }) => {
      for (const id of ids) {
        await base44.entities.Product.update(id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProducts([]);
      toast.success('Products updated');
    }
  });

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-24 pb-32 px-4 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Package className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-purple-900">Glass Portal</h1>
          </div>
          <p className="text-purple-600 text-lg">Discover premium glass pipes, bongs, grinders & smoke shop accessories</p>
        </motion.div>

        {/* Stats Widgets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-purple-200">
            <p className="text-sm text-purple-600 mb-1">Total Products</p>
            <p className="text-3xl font-bold text-purple-900">{glassProducts.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white border border-amber-300">
            <p className="text-sm text-amber-100 mb-1">Glass Pieces</p>
            <p className="text-3xl font-bold">{glassProducts.filter(p => p.name?.toLowerCase().includes('glass') || p.name?.toLowerCase().includes('pipe') || p.name?.toLowerCase().includes('bong')).length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 text-white border border-purple-300">
            <p className="text-sm text-purple-100 mb-1">Grinders</p>
            <p className="text-3xl font-bold">{glassProducts.filter(p => p.name?.toLowerCase().includes('grinder')).length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 text-white border border-pink-300">
            <p className="text-sm text-pink-100 mb-1">Accessories</p>
            <p className="text-3xl font-bold">{glassProducts.filter(p => !p.name?.toLowerCase().includes('pipe') && !p.name?.toLowerCase().includes('bong') && !p.name?.toLowerCase().includes('grinder')).length}</p>
          </div>
        </motion.div>

        {/* AI Discovery Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-300/50 backdrop-blur">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-900">AI Product Discovery</h3>
            </div>
            <p className="text-sm text-purple-700 mb-4">
              Enter glass product name(s) separated by commas (max 20), or let AI find new products!
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter product name(s) or use buttons below..."
                  value={aiSearch}
                  onChange={(e) => setAiSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiDiscover('single')}
                  className="flex-1 bg-white border-purple-300 focus:border-purple-500"
                  disabled={isDiscovering}
                />
                <Button 
                  onClick={() => handleAiDiscover('single')}
                  disabled={isDiscovering || !aiSearch.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isDiscovering ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Discover
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleAiDiscover('surprise')}
                  disabled={isDiscovering}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Surprise Me ({batchCount})
                </Button>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={batchCount}
                  onChange={(e) => setBatchCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 10)))}
                  className="w-20 border-purple-300"
                  disabled={isDiscovering}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Featured Products Banner */}
        {featuredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Featured Glass
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
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow bg-white/80 backdrop-blur border-2 border-purple-200 hover:border-purple-400">
                    <div className="h-32 relative">
                      <img 
                        src={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400'} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-purple-900 mb-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-purple-600 font-bold text-lg">${product.price?.toFixed(2)}</p>
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

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex gap-2"
          >
            <Button
              size="sm"
              onClick={() => bulkUpdateMutation.mutate({ ids: selectedProducts, data: { published: true } })}
              className="bg-green-600 hover:bg-green-700"
            >
              Publish Selected ({selectedProducts.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkUpdateMutation.mutate({ ids: selectedProducts, data: { published: false } })}
            >
              Unpublish Selected ({selectedProducts.length})
            </Button>
          </motion.div>
        )}

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 space-y-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
            <Input
              placeholder="Search glass products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-white/80 backdrop-blur border-purple-200 focus:border-purple-400"
            />
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-purple-700 uppercase">Product Type</p>
                <div className="flex gap-1 border border-purple-200 rounded-lg p-1 bg-white/60">
                  <Button
                    size="icon"
                    variant={viewMode === 'grid2x2' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid2x2')}
                    className="h-8 w-8"
                  >
                    <Grid2X2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewMode === 'grid1x1' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid1x1')}
                    className="h-8 w-8"
                  >
                    <Rows className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewMode === 'carousel' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('carousel')}
                    className="h-8 w-8"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {['all', 'pipe', 'bong', 'grinder', 'paper', 'vaporizer', 'storage'].map(category => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className={selectedCategory === category ? `bg-gradient-to-r ${categoryColors[category + 's'] || 'from-purple-500 to-pink-500'}` : ''}
                    size="sm"
                  >
                    {category === 'all' ? 'All Products' : category.charAt(0).toUpperCase() + category.slice(1) + 's'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Product Display */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-purple-600">No products found.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid2x2' ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4'}>
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative"
              >
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                  className="absolute top-3 left-3 w-5 h-5 z-10 cursor-pointer text-purple-600 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <Card className="overflow-hidden hover:shadow-lg transition-all bg-white/60 backdrop-blur border border-purple-200 hover:border-purple-400 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <div className={viewMode === 'grid2x2' ? 'h-32' : 'h-48'} className="relative">
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=300'} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={(e) => handleDuplicate(product, e)}
                        disabled={isDuplicating}
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-110 disabled:opacity-50"
                      >
                        <Copy className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(product);
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
                      >
                        <Edit2 className="w-4 h-4 text-purple-600" />
                      </button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-purple-900 mb-2">{product.name}</h3>
                    {viewMode === 'grid1x1' && <p className="text-xs text-purple-600 mb-3 line-clamp-2">{product.description}</p>}
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg text-purple-900">${product.price?.toFixed(2)}</p>
                      <ChevronRight className="w-4 h-4 text-purple-400" />
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

      {/* Confirmation Modal */}
      <Dialog open={!!confirmationModal} onOpenChange={() => setConfirmationModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Products Not Found Online</DialogTitle>
            <DialogDescription>
              The following products were not found in online databases. Would you like to create them as fictional products?
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm font-semibold text-yellow-900 mb-2">Not Found:</p>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {confirmationModal?.names.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmationModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmFictional} disabled={isDiscovering}>
              {isDiscovering ? 'Creating...' : 'Create as Fictional'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur">
          {selectedProduct && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant={selectedProduct.in_stock ? "default" : "secondary"}>
                        {selectedProduct.in_stock ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                      {selectedProduct.published && (
                        <Badge variant="outline" className="border-purple-400 text-purple-700">
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
                  <h3 className="font-bold text-purple-900 mb-2">Description</h3>
                  <p className="text-purple-700">{selectedProduct.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1">Price</p>
                    <p className="text-2xl font-bold text-purple-900">
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
                    <h3 className="font-bold text-purple-900 mb-2">Size</h3>
                    <p className="text-purple-700">{selectedProduct.weight}</p>
                  </div>
                )}

                {selectedProduct.sku && (
                  <div>
                    <h3 className="font-bold text-purple-900 mb-2">SKU</h3>
                    <p className="text-purple-700 font-mono text-sm">{selectedProduct.sku}</p>
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