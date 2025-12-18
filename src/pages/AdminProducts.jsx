import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '@/components/admin/AdminNav';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, LayoutDashboard, Package, ShoppingCart, Users, ArrowLeft, Grid3x3, List, Edit2, Trash2, GripVertical, Filter, CheckCircle, XCircle, Settings, Eye, EyeOff, Share2, LayoutGrid, Rows, Leaf, Sparkles, Cookie, Droplets, Wind, Beaker, Heart, Boxes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import ProductEditModal from '@/components/products/ProductEditModal';
import CategoryManager from '@/components/admin/CategoryManager';

const categories = ['flower', 'pre-rolls', 'edibles', 'concentrates', 'vapes', 'tinctures', 'topicals', 'accessories'];
const strainTypes = ['indica', 'sativa', 'hybrid', 'cbd', 'n/a'];

const categoryIcons = {
  flower: Leaf,
  'pre-rolls': Sparkles,
  edibles: Cookie,
  concentrates: Droplets,
  vapes: Wind,
  tinctures: Beaker,
  topicals: Heart,
  accessories: Boxes
};

export default function AdminProducts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingProduct) {
        return base44.entities.Product.update(editingProduct.id, data);
      }
      return base44.entities.Product.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingProduct(null);
    setFormData({ in_stock: true, category: 'flower', strain_type: 'hybrid', price: '' });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      price: parseFloat(formData.price) || 0,
      thc_level: parseFloat(formData.thc_level) || 0,
      cbd_level: parseFloat(formData.cbd_level) || 0,
    });
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleAllProducts = () => {
    const filteredIds = filteredProducts.map(p => p.id);
    if (selectedProducts.length === filteredIds.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredIds);
    }
  };

  const copyShareLink = (product) => {
    // Functions must use base44.com domain but will redirect to mydragonfly.club
    const shareUrl = `https://mydragonfly.base44.com/function/linkPreview?page=product&id=${product.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard!');
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedProducts.length} products?`)) {
      Promise.all(selectedProducts.map(id => deleteMutation.mutateAsync(id)))
        .then(() => {
          setSelectedProducts([]);
          toast.success('Products deleted');
        });
    }
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const handleBulkEdit = (field, value) => {
    Promise.all(selectedProducts.map(id => {
      const product = products.find(p => p.id === id);
      return base44.entities.Product.update(id, { ...product, [field]: value });
    }))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        setSelectedProducts([]);
        toast.success('Products updated');
      });
  };

  const handleDragStart = () => {
    document.body.style.overflow = 'hidden';
  };

  const handleDragEnd = (result) => {
    document.body.style.overflow = '';
    
    if (!result.destination) return;
    
    const category = result.source.droppableId;
    const items = productsByCategory[category];
    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    // Update display_order for each product
    reordered.forEach((product, index) => {
      base44.entities.Product.update(product.id, { display_order: index });
    });
    
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.success('Order updated');
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const productsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = products
      .filter(p => p.category === cat)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return acc;
  }, {});

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
              const isActive = tab.id === 'products';
              return (
                <Link key={tab.id} to={createPageUrl(tab.page)}>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                        : 'bg-white/60 text-emerald-700 hover:bg-white'
                    }`}
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
          <AdminNav currentPage="AdminProducts" />
        </div>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-6 pb-20 lg:pb-8">
          <div className="flex flex-col gap-4 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-900 mb-1 sm:mb-2">Products</h1>
                <p className="text-sm sm:text-base text-emerald-600">Manage your product catalog</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <CategoryManager />
                <Button onClick={handleNew} className="bg-gradient-to-r from-emerald-500 to-green-500 flex-1 sm:flex-initial">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-white/60"
                />
              </div>

              {/* Category Filter Buttons */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className={selectedCategory === 'all' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''}
                >
                  All Categories
                </Button>
                {categories.map(cat => {
                  const Icon = categoryIcons[cat];
                  return (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className={selectedCategory === cat ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <span className="capitalize">{cat}</span>
                    </Button>
                  );
                })}
              </div>

              {filteredProducts.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/60 backdrop-blur-xl border border-white/40">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={toggleAllProducts}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {selectedProducts.length > 0 && (
                    <>
                      <Badge variant="secondary" className="px-3 py-1">{selectedProducts.length} selected</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">Bulk Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleBulkEdit('published', true)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkEdit('published', false)}>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkEdit('in_stock', true)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark In Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkEdit('in_stock', false)}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Mark Out of Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProducts([])}>Clear</Button>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-1 bg-white/60 backdrop-blur-xl p-1 rounded-xl w-fit">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`${viewMode === 'grid' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''} px-2 sm:px-3`}
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Grid</span>
                </Button>
                {isMobile && (
                  <Button
                    variant={viewMode === 'single' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('single')}
                    className={`${viewMode === 'single' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''} px-2`}
                  >
                    <Rows className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant={viewMode === 'carousel' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('carousel')}
                  className={`${viewMode === 'carousel' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''} px-2 sm:px-3`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Carousel</span>
                </Button>
                <Button
                  variant={viewMode === 'category' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('category')}
                  className={`${viewMode === 'category' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''} px-2 sm:px-3`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Category</span>
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : viewMode === 'category' ? (
            <div className="space-y-6">
              {categories.map((category) => {
                const categoryProducts = productsByCategory[category] || [];
                if (categoryProducts.length === 0) return null;
                
                return (
                  <div key={category} className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-emerald-900 capitalize flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {category}
                      </h2>
                      <Badge variant="secondary">{categoryProducts.length} products</Badge>
                    </div>
                    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                      <Droppable droppableId={category}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {categoryProducts.map((product, index) => (
                              <Draggable key={product.id} draggableId={product.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                        <GripVertical className="w-5 h-5 text-emerald-400" />
                                      </div>
                                      <Checkbox
                                        checked={selectedProducts.includes(product.id)}
                                        onCheckedChange={() => toggleProductSelection(product.id)}
                                      />
                                      <div className="w-12 h-12 rounded-lg bg-emerald-100 flex-shrink-0 overflow-hidden">
                                        {product.image_url ? (
                                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-5 h-5 text-emerald-300" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-emerald-900 text-sm line-clamp-1">{product.name}</h3>
                                        <p className="text-xs text-emerald-600">${product.price?.toFixed(2)} • THC: {product.thc_level}%</p>
                                      </div>
                                      <div className="flex gap-1">
                                       <Button size="sm" variant="ghost" onClick={() => copyShareLink(product)} className="h-8 w-8 p-0 text-blue-600">
                                         <Share2 className="w-4 h-4" />
                                       </Button>
                                       <Button size="sm" variant="ghost" onClick={() => handleEdit(product)} className="h-8 w-8 p-0">
                                         <Edit2 className="w-4 h-4" />
                                       </Button>
                                       <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(product.id)} className="h-8 w-8 p-0 text-red-600">
                                         <Trash2 className="w-4 h-4" />
                                       </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg overflow-hidden relative">
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => toggleProductSelection(product.id)}
                    className="absolute top-2 left-2 z-10 bg-white"
                  />
                  <div className="aspect-square bg-emerald-100 relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 bg-white/90 hover:bg-white shadow-lg"
                      >
                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMutation.mutate({ id: product.id, data: { published: !product.published } });
                        }}
                        className={`h-7 w-7 sm:h-8 sm:w-8 shadow-lg ${product.published ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white/90 hover:bg-white'}`}
                      >
                        {product.published ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 sm:p-3">
                    <h3 className="font-bold text-emerald-900 text-xs sm:text-sm mb-1 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                      <span className="font-bold text-emerald-600 text-xs sm:text-sm">${product.price?.toFixed(2)}</span>
                    </div>
                    {!product.published && <Badge variant="outline" className="text-xs mb-1">Hidden</Badge>}
                    <div className="hidden sm:block text-xs text-emerald-600 mb-2">
                      THC: {product.thc_level}% | CBD: {product.cbd_level}%
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyShareLink(product)} className="h-7 sm:h-8 px-2 text-blue-600">
                        <Share2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="flex-1 h-7 sm:h-8 text-xs px-1 sm:px-2">
                        <Edit2 className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(product.id)} className="h-7 sm:h-8 px-2 text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'single' ? (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg overflow-hidden relative">
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => toggleProductSelection(product.id)}
                    className="absolute top-2 left-2 z-10 bg-white"
                  />
                  <div className="h-48 bg-emerald-100 relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-emerald-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                        className="h-8 w-8 bg-white/90 hover:bg-white shadow-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMutation.mutate({ id: product.id, data: { published: !product.published } });
                        }}
                        className={`h-8 w-8 shadow-lg ${product.published ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white/90 hover:bg-white'}`}
                      >
                        {product.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-emerald-900 mb-2">{product.name}</h3>
                    <p className="text-xs text-emerald-600 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                        {!product.published && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                      </div>
                      <span className="font-bold text-emerald-600">${product.price?.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-emerald-600 mb-3">
                      THC: {product.thc_level}% | CBD: {product.cbd_level}%
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyShareLink(product)} className="h-8 text-blue-600">
                        <Share2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="flex-1 h-8 text-xs">
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(product.id)} className="h-8 text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'carousel' ? (
            <div className="space-y-6 sm:space-y-8">
              {categories.map((category) => {
                const categoryProducts = products.filter(p => p.category === category && (selectedCategory === 'all' || selectedCategory === category));
                if (categoryProducts.length === 0) return null;
                return (
                  <div key={category}>
                    <h2 className="text-lg sm:text-xl font-bold text-emerald-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-base sm:text-xl">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                      {categoryProducts.map(product => (
                        <div key={product.id} className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg overflow-hidden relative">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                            className="absolute top-2 left-2 z-10 bg-white"
                          />
                          <div className="aspect-square bg-emerald-100 relative">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-300" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(product);
                                }}
                                className="h-7 w-7 sm:h-8 sm:w-8 bg-white/90 hover:bg-white shadow-lg"
                              >
                                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateMutation.mutate({ id: product.id, data: { published: !product.published } });
                                }}
                                className={`h-7 w-7 sm:h-8 sm:w-8 shadow-lg ${product.published ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white/90 hover:bg-white'}`}
                              >
                                {product.published ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="p-2 sm:p-3">
                            <h3 className="font-bold text-emerald-900 text-xs sm:text-sm mb-1 line-clamp-1">{product.name}</h3>
                            <p className="font-bold text-emerald-900 text-sm sm:text-base">${product.price?.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg p-4">
                  <div className="flex gap-3">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                    <div className="w-16 h-16 rounded-lg bg-emerald-100 flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-emerald-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-emerald-900 text-sm line-clamp-1">{product.name}</h3>
                        <span className="font-bold text-emerald-600 text-sm whitespace-nowrap">${product.price?.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                       <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                       {!product.published && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                       <span className="text-xs text-emerald-600">THC: {product.thc_level}%</span>
                       <span className="text-xs text-emerald-600">CBD: {product.cbd_level}%</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyShareLink(product)} className="h-7 text-xs text-blue-600">
                          <Share2 className="w-3 h-3 mr-1" />
                          Share
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="h-7 text-xs">
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(product.id)} className="h-7 text-xs text-red-600">
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ProductEditModal
            isOpen={isDialogOpen}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingProduct(null);
            }}
            product={editingProduct}
            onSave={(updatedProduct) => {
              saveMutation.mutate(updatedProduct);
            }}
          />
        </div>
      </div>
    </div>
  );
}