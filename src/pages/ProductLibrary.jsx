import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, Sparkles, ChevronRight, Loader2, Edit2, Brain, Grid2X2, Rows, LayoutGrid, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ProductEditModal from '@/components/products/ProductEditModal';
import { toast } from 'sonner';

const categoryColors = {
  'concentrated-oils': 'from-amber-400 to-yellow-500',
  'diamonds': 'from-cyan-400 to-blue-500',
  'sugar': 'from-pink-400 to-rose-500',
  'crumble': 'from-orange-400 to-amber-500',
  'shatter': 'from-yellow-400 to-amber-500',
  'sauce': 'from-purple-400 to-indigo-500',
  'extracts': 'from-emerald-400 to-green-500',
  'tinctures': 'from-lime-400 to-green-500',
  'topicals': 'from-teal-400 to-cyan-500'
};

const strainColors = {
  indica: 'from-purple-500 to-indigo-600',
  sativa: 'from-orange-500 to-amber-600',
  hybrid: 'from-emerald-500 to-green-600',
  cbd: 'from-blue-500 to-cyan-600'
};

export default function ProductLibrary() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStrain, setSelectedStrain] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [aiSearch, setAiSearch] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [batchCount, setBatchCount] = useState(10);
  const [viewMode, setViewMode] = useState('grid2x2'); // grid2x2, grid1x1, carousel
  const [confirmationModal, setConfirmationModal] = useState(null); // { names: [], mode: '' }
  const [isDuplicating, setIsDuplicating] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(search.toLowerCase()) ||
                         product.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStrain = selectedStrain === 'all' || product.strain_type === selectedStrain;
    // Exclude flower products
    const isNotFlower = product.category !== 'flower' && product.category !== 'pre-rolls';
    return matchesSearch && matchesCategory && matchesStrain && isNotFlower;
  });

  const featuredProducts = filteredProducts.filter(p => p.category === 'concentrates').slice(0, 3);

  const handleAiDiscover = async (mode = 'single') => {
    if (mode === 'single' && !aiSearch.trim()) {
      toast.error('Please enter product name(s)');
      return;
    }

    setIsDiscovering(true);
    try {
      let payload;
      
      if (mode === 'surprise' || mode === 'teachme') {
        toast.info(`Finding ${batchCount} ${mode === 'teachme' ? 'educational' : 'interesting'} concentrate products...`);
        const suggestResponse = await base44.functions.invoke('discoverProduct', {
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

      toast.info('Discovering products... This may take a minute.');
      const response = await base44.functions.invoke('discoverProduct', payload);

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
      const response = await base44.functions.invoke('discoverProduct', payload);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-24 pb-32 px-4 overflow-x-hidden">
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
          <p className="text-emerald-600 text-lg">Explore premium cannabis concentrates, extracts, tinctures & topicals</p>
        </motion.div>

        {/* Stats Widgets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-emerald-200">
            <p className="text-sm text-emerald-600 mb-1">Total Products</p>
            <p className="text-3xl font-bold text-emerald-900">{products.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white border border-amber-300">
            <p className="text-sm text-amber-100 mb-1">Concentrates</p>
            <p className="text-3xl font-bold">{products.filter(p => p.category === 'concentrates').length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 text-white border border-purple-300">
            <p className="text-sm text-purple-100 mb-1">Tinctures</p>
            <p className="text-3xl font-bold">{products.filter(p => p.category === 'tinctures').length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white border border-teal-300">
            <p className="text-sm text-teal-100 mb-1">Topicals</p>
            <p className="text-3xl font-bold">{products.filter(p => p.category === 'topicals').length}</p>
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
              Enter concentrate/derivative product name(s) separated by commas (max 20), or let AI find new products!
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
                  onClick={() => handleAiDiscover('teachme')}
                  disabled={isDiscovering}
                  variant="outline"
                  className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Teach Me ({batchCount})
                </Button>
                <Button
                  onClick={() => handleAiDiscover('surprise')}
                  disabled={isDiscovering}
                  variant="outline"
                  className="flex-1 border-pink-300 text-pink-700 hover:bg-pink-50"
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
            <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Premium Concentrates
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
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${categoryColors[product.category]} text-white text-xs font-bold`}>
                          {product.category?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </div>
                        {product.strain_type && product.strain_type !== 'n/a' && (
                          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${strainColors[product.strain_type]} text-white text-xs font-bold`}>
                            {product.strain_type}
                          </div>
                        )}
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
          transition={{ delay: 0.4 }}
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

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-emerald-700 uppercase">Concentrate Type</p>
                <div className="flex gap-1 border border-emerald-200 rounded-lg p-1 bg-white/60">
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
                {['all', 'concentrated-oils', 'diamonds', 'sugar', 'crumble', 'shatter', 'sauce', 'extracts', 'tinctures', 'topicals'].map(category => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className={selectedCategory === category ? `bg-gradient-to-r ${categoryColors[category] || 'from-emerald-500 to-green-500'}` : ''}
                    size="sm"
                  >
                    {category === 'all' ? 'All Types' : category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-2 uppercase">Strain Type</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {['all', 'indica', 'sativa', 'hybrid', 'cbd'].map(strain => (
                  <Button
                    key={strain}
                    onClick={() => setSelectedStrain(strain)}
                    variant={selectedStrain === strain ? 'default' : 'outline'}
                    className={selectedStrain === strain ? `bg-gradient-to-r ${strainColors[strain] || 'from-emerald-500 to-green-500'}` : ''}
                    size="sm"
                  >
                    {strain === 'all' ? 'All Strains' : strain.charAt(0).toUpperCase() + strain.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Product Display */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-emerald-600">No products found.</p>
          </div>
        ) : viewMode === 'carousel' ? (
          <div className="space-y-8">
            {['concentrated-oils', 'diamonds', 'sugar', 'crumble', 'shatter', 'sauce', 'extracts', 'tinctures', 'topicals'].map(category => {
              const categoryProducts = products.filter(p => p.category === category && (selectedCategory === 'all' || selectedCategory === category));
              if (categoryProducts.length === 0) return null;
              return (
                <div key={category}>
                  <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${categoryColors[category]}`} />
                    {category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </h2>
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                    {categoryProducts.map(product => (
                      <Card key={product.id} className="min-w-[280px] overflow-hidden hover:shadow-lg transition-all bg-white/60 backdrop-blur border border-emerald-200 hover:border-emerald-400 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        <div className="h-32 relative">
                          <img 
                            src={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=300'} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${categoryColors[product.category]} text-white text-xs font-bold`}>
                              {product.category?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </div>
                          </div>
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
                              <Edit2 className="w-4 h-4 text-emerald-600" />
                            </button>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-bold text-emerald-900 mb-1 text-sm">{product.name}</h3>
                          <p className="font-bold text-emerald-900">${product.price?.toFixed(2)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
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
                <Card className="overflow-hidden hover:shadow-lg transition-all bg-white/60 backdrop-blur border border-emerald-200 hover:border-emerald-400 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <div className={viewMode === 'grid2x2' ? 'h-32' : 'h-48'} className="relative">
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=300'} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${categoryColors[product.category]} text-white text-xs font-bold`}>
                        {product.category?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </div>
                      {product.strain_type && product.strain_type !== 'n/a' && (
                        <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${strainColors[product.strain_type]} text-white text-xs font-bold`}>
                          {product.strain_type}
                        </div>
                      )}
                    </div>
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
                        <Edit2 className="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-emerald-900 mb-2">{product.name}</h3>
                    {viewMode === 'grid1x1' && <p className="text-xs text-emerald-600 mb-3 line-clamp-2">{product.description}</p>}
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
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${categoryColors[selectedProduct.category]} flex items-center justify-center shadow-lg`}>
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={`bg-gradient-to-r ${categoryColors[selectedProduct.category]} text-white`}>
                        {selectedProduct.category?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Badge>
                      {selectedProduct.strain_type && selectedProduct.strain_type !== 'n/a' && (
                        <Badge className={`bg-gradient-to-r ${strainColors[selectedProduct.strain_type]} text-white`}>
                          {selectedProduct.strain_type}
                        </Badge>
                      )}
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