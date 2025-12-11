import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Package, AlertTriangle, TrendingDown, TrendingUp, Search, Filter, Mail, Edit2, Plus, Minus } from 'lucide-react';
import AdminNav from '@/components/admin/AdminNav';
import { toast } from 'sonner';

export default function AdminInventory() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [variantStocks, setVariantStocks] = useState({});
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list()
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock updated successfully');
      setEditingProduct(null);
      setStockAdjustment(0);
      setVariantStocks({});
    }
  });

  const sendLowStockAlertMutation = useMutation({
    mutationFn: async (product) => {
      return await base44.functions.invoke('sendLowStockAlert', { product });
    },
    onSuccess: () => {
      toast.success('Low stock alert sent');
    }
  });

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                           p.sku?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = (p.stock_quantity || 0) <= (p.low_stock_threshold || 10);
      } else if (stockFilter === 'out') {
        matchesStock = (p.stock_quantity || 0) === 0;
      } else if (stockFilter === 'in') {
        matchesStock = (p.stock_quantity || 0) > (p.low_stock_threshold || 10);
      }
      
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'stock-asc') return (a.stock_quantity || 0) - (b.stock_quantity || 0);
      if (sortBy === 'stock-desc') return (b.stock_quantity || 0) - (a.stock_quantity || 0);
      if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
      return 0;
    });

  const lowStockProducts = products.filter(p => 
    (p.stock_quantity || 0) <= (p.low_stock_threshold || 10) && (p.stock_quantity || 0) > 0
  );
  const outOfStockProducts = products.filter(p => (p.stock_quantity || 0) === 0);
  const totalStockValue = products.reduce((sum, p) => 
    sum + ((p.stock_quantity || 0) * (p.price || 0)), 0
  );

  const handleStockUpdate = () => {
    if (!editingProduct) return;

    const newStock = Math.max(0, (editingProduct.stock_quantity || 0) + stockAdjustment);
    const updatedVariants = editingProduct.variants?.map((v, i) => ({
      ...v,
      stock_quantity: variantStocks[i] !== undefined ? variantStocks[i] : (v.stock_quantity || 0)
    }));

    updateStockMutation.mutate({
      id: editingProduct.id,
      data: {
        stock_quantity: newStock,
        variants: updatedVariants,
        in_stock: newStock > 0
      }
    });
  };

  const getStockStatus = (product) => {
    const stock = product.stock_quantity || 0;
    const threshold = product.low_stock_threshold || 10;
    
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-500', icon: AlertTriangle };
    if (stock <= threshold) return { label: 'Low Stock', color: 'bg-yellow-500', icon: TrendingDown };
    return { label: 'In Stock', color: 'bg-green-500', icon: Package };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      {/* Mobile Navigation */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-emerald-200">
        <AdminNav mobile currentPage="AdminInventory" />
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 min-h-screen bg-white border-r border-emerald-200 sticky top-0">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-emerald-900 mb-6">Admin Panel</h2>
            <AdminNav currentPage="AdminInventory" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-emerald-900 mb-2">Inventory Management</h1>
              <p className="text-emerald-600">Track and manage product stock levels</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-600 mb-1">Total Products</p>
                      <p className="text-2xl font-bold text-emerald-900">{products.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 mb-1">Low Stock</p>
                      <p className="text-2xl font-bold text-yellow-900">{lowStockProducts.length}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 mb-1">Out of Stock</p>
                      <p className="text-2xl font-bold text-red-900">{outOfStockProducts.length}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 mb-1">Stock Value</p>
                      <p className="text-2xl font-bold text-blue-900">${totalStockValue.toFixed(0)}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6 bg-white border-emerald-200">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input
                      placeholder="Search products or SKU..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 border-emerald-200"
                    />
                  </div>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Stock Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock Levels</SelectItem>
                      <SelectItem value="in">In Stock</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                      <SelectItem value="out">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
                      <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Product List */}
            <div className="space-y-3">
              {filteredProducts.map(product => {
                const status = getStockStatus(product);
                const StatusIcon = status.icon;
                
                return (
                  <Card key={product.id} className="bg-white border-emerald-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Product Image */}
                        <img
                          src={product.image_url || 'https://via.placeholder.com/80'}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg border border-emerald-200"
                        />

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-emerald-900">{product.name}</h3>
                              <p className="text-sm text-emerald-600">
                                {product.category} {product.sku && `• SKU: ${product.sku}`}
                              </p>
                            </div>
                            <Badge className={`${status.color} text-white`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-emerald-600">Stock:</span>{' '}
                              <span className="font-bold text-emerald-900">
                                {product.stock_quantity || 0} units
                              </span>
                            </div>
                            <div>
                              <span className="text-emerald-600">Threshold:</span>{' '}
                              <span className="font-bold text-yellow-900">
                                {product.low_stock_threshold || 10} units
                              </span>
                            </div>
                            <div>
                              <span className="text-emerald-600">Price:</span>{' '}
                              <span className="font-bold text-emerald-900">
                                ${product.price}
                              </span>
                            </div>
                            <div>
                              <span className="text-emerald-600">Value:</span>{' '}
                              <span className="font-bold text-blue-900">
                                ${((product.stock_quantity || 0) * (product.price || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Variants */}
                          {product.variants?.length > 0 && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {product.variants.map((variant, i) => (
                                <Badge key={i} variant="outline" className="border-emerald-300 text-emerald-700">
                                  {variant.name}: {variant.stock_quantity || 0} units
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setEditingProduct(product);
                              setStockAdjustment(0);
                              setVariantStocks({});
                            }}
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {(product.stock_quantity || 0) <= (product.low_stock_threshold || 10) && (
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => sendLowStockAlertMutation.mutate(product)}
                              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <Card className="bg-white border-emerald-200">
                <CardContent className="p-12 text-center">
                  <Package className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                  <p className="text-emerald-600">No products found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Stock Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Stock - {editingProduct?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Main Stock */}
            <div>
              <Label className="text-emerald-900 font-semibold mb-3 block">Main Stock Level</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-emerald-600 mb-1">Current Stock</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {editingProduct?.stock_quantity || 0} units
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-emerald-600 mb-1">Low Stock Threshold</p>
                    <Input
                      type="number"
                      value={editingProduct?.low_stock_threshold || 10}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        low_stock_threshold: parseInt(e.target.value) || 10
                      })}
                      className="border-emerald-200"
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <Label className="text-emerald-900 mb-2 block">Stock Adjustment</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setStockAdjustment(prev => prev - 1)}
                      className="border-emerald-300"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={stockAdjustment}
                      onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
                      className="text-center border-emerald-200"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setStockAdjustment(prev => prev + 1)}
                      className="border-emerald-300"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-emerald-600 mt-2">
                    New stock: <span className="font-bold">
                      {Math.max(0, (editingProduct?.stock_quantity || 0) + stockAdjustment)} units
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Variant Stocks */}
            {editingProduct?.variants?.length > 0 && (
              <div>
                <Label className="text-emerald-900 font-semibold mb-3 block">Variant Stock Levels</Label>
                <div className="space-y-3">
                  {editingProduct.variants.map((variant, i) => (
                    <div key={i} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-emerald-900">{variant.name}</p>
                        <p className="text-sm text-emerald-600">
                          ${variant.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Label className="text-xs text-emerald-600">Stock Quantity</Label>
                          <Input
                            type="number"
                            value={variantStocks[i] !== undefined ? variantStocks[i] : (variant.stock_quantity || 0)}
                            onChange={(e) => setVariantStocks({
                              ...variantStocks,
                              [i]: parseInt(e.target.value) || 0
                            })}
                            className="border-emerald-200 mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SKU Field */}
            <div>
              <Label className="text-emerald-900 font-semibold mb-2 block">SKU</Label>
              <Input
                value={editingProduct?.sku || ''}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  sku: e.target.value
                })}
                placeholder="Enter SKU code..."
                className="border-emerald-200"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-emerald-200">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingProduct(null);
                  setStockAdjustment(0);
                  setVariantStocks({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStockUpdate}
                disabled={updateStockMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-green-500"
              >
                {updateStockMutation.isPending ? 'Updating...' : 'Update Stock'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}