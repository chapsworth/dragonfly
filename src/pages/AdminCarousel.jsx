import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '@/components/admin/AdminNav';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GripVertical, X, LayoutDashboard, Package, ShoppingCart, Users, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const categories = ['flower', 'pre-rolls', 'edibles', 'concentrates', 'vapes', 'tinctures', 'topicals', 'accessories'];

export default function AdminCarousel() {
  const [editingCarousel, setEditingCarousel] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]);
  const queryClient = useQueryClient();

  const { data: carouselSettings = [] } = useQuery({
    queryKey: ['carouselSettings'],
    queryFn: () => base44.entities.CarouselSettings.list()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingCarousel) {
        return base44.entities.CarouselSettings.update(editingCarousel.id, data);
      }
      return base44.entities.CarouselSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carouselSettings'] });
      setEditingCarousel(null);
      setFormData({});
      setSelectedProducts([]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CarouselSettings.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carouselSettings'] });
    }
  });

  const handleEdit = (carousel) => {
    setEditingCarousel(carousel);
    setFormData(carousel);
    setSelectedProducts(carousel.featured_product_ids || []);
  };

  const handleNew = () => {
    setEditingCarousel(null);
    setFormData({ is_active: true, display_order: carouselSettings.length + 1 });
    setSelectedProducts([]);
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      display_order: parseInt(formData.display_order) || 0,
      featured_product_ids: selectedProducts
    });
  };

  const addProduct = (productId) => {
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(id => id !== productId));
  };

  const moveProduct = (index, direction) => {
    const newList = [...selectedProducts];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newList.length) {
      [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
      setSelectedProducts(newList);
    }
  };

  const getProductName = (id) => products.find(p => p.id === id)?.name || 'Unknown';
  const categoryProducts = products.filter(p => p.category === formData.category);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'AdminDashboard' },
    { id: 'products', label: 'Products', icon: Package, page: 'AdminProducts' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, page: 'AdminOrders' },
    { id: 'users', label: 'Users', icon: Users, page: 'AdminUsers' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Mobile Header with Tabs */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/40">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-emerald-900">Admin</h1>
        </div>
        <div className="overflow-x-auto scrollbar-hide px-4 pb-2">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link key={tab.id} to={createPageUrl(tab.page)}>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all bg-white/60 text-emerald-700 hover:bg-white"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Nav */}
        <div className="hidden lg:block">
          <AdminNav currentPage="AdminCarousel" />
        </div>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-900 mb-1 sm:mb-2">Carousel Settings</h1>
              <p className="text-sm sm:text-base text-emerald-600">Configure featured products and carousel order</p>
            </div>
            <Button onClick={handleNew} className="bg-gradient-to-r from-emerald-500 to-green-500 w-full sm:w-auto">
              <Plus className="w-5 h-5 mr-2" />
              Add Carousel
            </Button>
          </div>

          <div className="space-y-4">
            {carouselSettings
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map((carousel) => (
                <div key={carousel.id} className="p-4 sm:p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 flex-shrink-0">
                        {carousel.display_order}
                      </div>
                      <div>
                        <h3 className="font-bold text-emerald-900 text-base sm:text-lg capitalize">{carousel.category}</h3>
                        <p className="text-xs sm:text-sm text-emerald-600">
                          {carousel.featured_product_ids?.length || 0} featured products
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Badge variant={carousel.is_active ? 'default' : 'secondary'} className="text-xs">
                        {carousel.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(carousel)} className="flex-1 sm:flex-none">Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(carousel.id)} className="text-red-600 flex-1 sm:flex-none">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <Dialog open={!!editingCarousel || formData.category} onOpenChange={() => { setEditingCarousel(null); setFormData({}); setSelectedProducts([]); }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>{editingCarousel ? 'Edit Carousel' : 'New Carousel'}</DialogTitle>
              </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category || ''} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input 
                    type="number" 
                    value={formData.display_order || ''} 
                    onChange={(e) => setFormData({...formData, display_order: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <Label>Featured Products (in order)</Label>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {selectedProducts.map((productId, index) => (
                    <motion.div
                      key={productId}
                      className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200"
                    >
                      <GripVertical className="w-4 h-4 text-emerald-400" />
                      <span className="flex-1 text-sm text-emerald-900">{getProductName(productId)}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => moveProduct(index, -1)} disabled={index === 0}>↑</Button>
                        <Button size="sm" variant="ghost" onClick={() => moveProduct(index, 1)} disabled={index === selectedProducts.length - 1}>↓</Button>
                        <Button size="sm" variant="ghost" onClick={() => removeProduct(productId)}><X className="w-4 h-4" /></Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {formData.category && (
                <div>
                  <Label>Add Products</Label>
                  <Select onValueChange={addProduct}>
                    <SelectTrigger><SelectValue placeholder="Select product to add" /></SelectTrigger>
                    <SelectContent>
                      {categoryProducts
                        .filter(p => !selectedProducts.includes(p.id))
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => { setEditingCarousel(null); setFormData({}); setSelectedProducts([]); }} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500">
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}