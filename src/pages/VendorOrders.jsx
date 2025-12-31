import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, Download, ShoppingCart, Package, Trash2, Search, FileText, ChevronDown, RefreshCw, Grid3x3, List, Edit, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function VendorOrders() {
  return <VendorOrdersContent />;
}

function VendorOrdersContent() {
  const [selectedVendor, setSelectedVendor] = useState('Jared Cookie Factory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState('');
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [addedItems, setAddedItems] = useState([]);
  const [floatingItemAnim, setFloatingItemAnim] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isGlobalEditOpen, setIsGlobalEditOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productForm, setProductForm] = useState({});
  const [vendorForm, setVendorForm] = useState({ name: '', type: 'flower', url: '', defaultPrice: 0 });
  const [bulkPriceChange, setBulkPriceChange] = useState({ type: 'set', value: 0 });
  const [globalPriceChange, setGlobalPriceChange] = useState({ type: 'set', value: 0 });
  const floatingTotalRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: vendorsData = [] } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const saved = await base44.entities.VendorProduct.list();
      const uniqueVendors = [...new Set(saved.map(p => p.vendor_name))];
      return uniqueVendors.map(name => ({ name, type: 'custom' }));
    }
  });

  const defaultVendors = [
    { name: 'Jared Cookie Factory', type: 'factory' },
    { name: 'LA Bulk - Sungrown (A)', type: 'flower', url: 'https://labulkflower.com/product/bulk-flower/', defaultPrice: 100 },
    { name: 'LA Bulk - AA', type: 'flower', url: 'https://labulkflower.com/product/aa/', defaultPrice: 150 },
    { name: 'LA Bulk - AAA Indoor', type: 'flower', url: 'https://labulkflower.com/product/aaa-indoor/', defaultPrice: 300 }
  ];

  const vendors = [...defaultVendors, ...vendorsData.filter(v => !defaultVendors.find(d => d.name === v.name))];

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['vendor-products', selectedVendor],
    queryFn: async () => {
      const all = await base44.entities.VendorProduct.list();
      return all.filter(p => p.vendor_name === selectedVendor && p.is_active);
    }
  });

  const handleScrapeMenu = async (vendor) => {
    if (!vendor.url) return;
    
    setIsScraping(true);
    try {
      const response = await base44.functions.invoke('scrapeFlowerMenu', {
        url: vendor.url,
        vendor_name: vendor.name,
        category: 'flower',
        default_price: vendor.defaultPrice / 4 // Convert QP price to per unit
      });

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
        toast.success(`Scraped ${response.data.scraped} products, imported ${response.data.imported} new items`);
      }
    } catch (error) {
      toast.error('Failed to scrape menu: ' + error.message);
    } finally {
      setIsScraping(false);
    }
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['vendor-orders', selectedVendor],
    queryFn: async () => {
      const all = await base44.entities.VendorOrder.list('-created_date');
      return all.filter(o => o.vendor_name === selectedVendor);
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => base44.entities.VendorOrder.create(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      setCart([]);
      setNotes('');
      toast.success('Order created successfully');
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id) => base44.entities.VendorOrder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      toast.success('Order deleted');
    }
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.VendorProduct.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setIsAddProductOpen(false);
      setProductForm({});
      toast.success('Product added');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VendorProduct.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setEditingProduct(null);
      setProductForm({});
      toast.success('Product updated');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.VendorProduct.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Product deleted');
    }
  });

  const bulkUpdatePricesMutation = useMutation({
    mutationFn: async ({ productIds, changeType, value }) => {
      for (const id of productIds) {
        const product = products.find(p => p.id === id);
        if (product) {
          let newPrice = product.price;
          if (changeType === 'set') {
            newPrice = parseFloat(value);
          } else if (changeType === 'increase') {
            newPrice = product.price + parseFloat(value);
          } else if (changeType === 'decrease') {
            newPrice = Math.max(0, product.price - parseFloat(value));
          } else if (changeType === 'percent') {
            newPrice = product.price * (1 + parseFloat(value) / 100);
          }
          await base44.entities.VendorProduct.update(id, { price: newPrice });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setSelectedProducts([]);
      setIsBulkEditOpen(false);
      toast.success('Prices updated');
    }
  });

  const globalUpdatePricesMutation = useMutation({
    mutationFn: async ({ changeType, value }) => {
      for (const product of filteredProducts) {
        let newPrice = product.price;
        if (changeType === 'set') {
          newPrice = parseFloat(value);
        } else if (changeType === 'increase') {
          newPrice = product.price + parseFloat(value);
        } else if (changeType === 'decrease') {
          newPrice = Math.max(0, product.price - parseFloat(value));
        } else if (changeType === 'percent') {
          newPrice = product.price * (1 + parseFloat(value) / 100);
        }
        await base44.entities.VendorProduct.update(product.id, { price: newPrice });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setIsGlobalEditOpen(false);
      toast.success('All prices updated');
    }
  });

  const categories = [...new Set(products.map(p => p.category))];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery === '' || 
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variant?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  const addToCart = (product, buttonRef) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    const quantity = existingItem ? existingItem.quantity + 1 : 1;
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.product_name,
        variant: product.variant,
        quantity: 1,
        price: product.price
      }]);
    }

    // Animation: Show added item toast
    const itemId = Date.now();
    const itemName = product.variant ? `${product.product_name} - ${product.variant}` : product.product_name;
    setAddedItems(prev => [...prev, { id: itemId, name: itemName, quantity }]);
    setTimeout(() => {
      setAddedItems(prev => prev.filter(item => item.id !== itemId));
    }, 2000);

    // Flying animation to floating total
    if (buttonRef?.current && floatingTotalRef?.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const totalRect = floatingTotalRef.current.getBoundingClientRect();
      
      setFloatingItemAnim({
        id: itemId,
        startX: buttonRect.left,
        startY: buttonRect.top,
        endX: totalRect.left + totalRect.width / 2,
        endY: totalRect.top + totalRect.height / 2,
        name: itemName
      });
      
      setTimeout(() => setFloatingItemAnim(null), 800);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      setCart(cart.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
    toast.success('Removed from order');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = () => {
    if (cart.length === 0) {
      toast.error('Add items to your order first');
      return;
    }

    const orderData = {
      vendor_name: selectedVendor,
      order_date: new Date().toISOString().split('T')[0],
      items: cart,
      subtotal: calculateTotal(),
      total: calculateTotal(),
      notes,
      status: 'draft'
    };

    createOrderMutation.mutate(orderData);
  };

  const exportToPDF = (order) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Vendor Order Form', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Vendor: ${order.vendor_name}`, 20, 35);
    doc.text(`Order Date: ${format(new Date(order.order_date), 'MMM d, yyyy')}`, 20, 42);
    doc.text(`Order ID: ${order.id.slice(0, 8).toUpperCase()}`, 20, 49);
    
    // Line
    doc.line(20, 55, 190, 55);
    
    // Table headers
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Item', 20, 65);
    doc.text('Qty', 120, 65);
    doc.text('Price', 145, 65);
    doc.text('Total', 170, 65);
    
    doc.line(20, 68, 190, 68);
    
    // Items
    doc.setFont(undefined, 'normal');
    let y = 78;
    order.items.forEach((item, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      const itemName = item.variant 
        ? `${item.product_name} - ${item.variant}` 
        : item.product_name;
      
      doc.text(itemName.substring(0, 50), 20, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`$${item.price.toFixed(2)}`, 145, y);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 170, y);
      y += 7;
    });
    
    // Total
    y += 10;
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text(`Total: $${order.total.toFixed(2)}`, 145, y);
    
    // Notes
    if (order.notes) {
      y += 15;
      doc.setFontSize(10);
      doc.text('Notes:', 20, y);
      y += 7;
      doc.setFont(undefined, 'normal');
      const splitNotes = doc.splitTextToSize(order.notes, 170);
      doc.text(splitNotes, 20, y);
    }
    
    doc.save(`vendor-order-${order.id.slice(0, 8)}.pdf`);
    toast.success('PDF downloaded');
  };

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-2 sm:p-4 lg:p-8 pb-96 overflow-x-hidden max-w-full">
      {/* Freeze Overlay when dragging */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sticky Footer with Total */}
      <div ref={floatingTotalRef} className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t-2 border-emerald-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600">Order Total</p>
                <p className="text-base sm:text-xl font-bold text-emerald-600">${total.toFixed(2)}</p>
              </div>
              {cart.length > 0 && (
                <Badge className="bg-emerald-600 text-white text-xs">{cart.length}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flying Item Animation */}
      <AnimatePresence>
        {floatingItemAnim && (
          <motion.div
            initial={{
              position: 'fixed',
              left: floatingItemAnim.startX,
              top: floatingItemAnim.startY,
              scale: 1,
              opacity: 1,
              zIndex: 9999
            }}
            animate={{
              left: floatingItemAnim.endX,
              top: floatingItemAnim.endY,
              scale: 0.3,
              opacity: 0
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="pointer-events-none"
          >
            <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold whitespace-nowrap">
              {floatingItemAnim.name}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Added Items Toasts */}
      <div className="fixed top-24 right-4 z-40 space-y-2">
        <AnimatePresence>
          {addedItems.map(item => (
            <motion.div
              key={item.id}
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
            >
              <Plus className="w-5 h-5" />
              <div>
                <p className="font-bold">Added {item.quantity}x</p>
                <p className="text-sm opacity-90">{item.name}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto pt-4 sm:pt-6 w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900">Vendor Orders</h1>
              <p className="text-sm text-emerald-600">Create orders for {selectedVendor}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {vendors.find(v => v.name === selectedVendor)?.url && (
                <Button 
                  onClick={() => handleScrapeMenu(vendors.find(v => v.name === selectedVendor))} 
                  disabled={isScraping}
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isScraping ? 'animate-spin' : ''}`} />
                  {isScraping ? 'Scraping...' : 'Refresh Menu'}
                </Button>
              )}
              <Button onClick={() => setIsAddProductOpen(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
              <Button onClick={() => setIsAddVendorOpen(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
              {selectedProducts.length > 0 && (
                <Button onClick={() => setIsBulkEditOpen(true)} variant="outline" size="sm">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Edit {selectedProducts.length} Prices
                </Button>
              )}
              <Button onClick={() => setIsGlobalEditOpen(true)} variant="outline" size="sm">
                <DollarSign className="w-4 h-4 mr-2" />
                Global Price Edit
              </Button>
              <Button onClick={() => setIsOrdersOpen(true)} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                View Orders
              </Button>
            </div>
          </div>

          {/* Vendor Tabs */}
          <Tabs value={selectedVendor} onValueChange={setSelectedVendor} className="w-full">
            <div className="w-full overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex w-auto gap-1 flex-nowrap">
                {vendors.map(vendor => (
                  <TabsTrigger key={vendor.name} value={vendor.name} className="text-xs sm:text-sm whitespace-nowrap">
                    {vendor.name.includes('LA Bulk') ? vendor.name.replace('LA Bulk - ', '') : vendor.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>

        <div className="grid lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Product Catalog */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                  <Collapsible 
                    key={category} 
                    open={expandedCategories[category] === true}
                    onOpenChange={(isOpen) => setExpandedCategories(prev => ({ ...prev, [category]: isOpen }))}
                  >
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="hover:bg-emerald-50/50 transition-colors cursor-pointer">
                          <CardTitle className="flex items-center justify-between text-emerald-900">
                            <div className="flex items-center gap-2">
                              <Package className="w-5 h-5" />
                              {category}
                              <Badge variant="outline">{categoryProducts.length}</Badge>
                            </div>
                            <ChevronDown className={`w-5 h-5 transition-transform ${expandedCategories[category] !== false ? 'rotate-180' : ''}`} />
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-3 p-3' : 'space-y-2 p-3'}>
                          {categoryProducts.map(product => (
                            viewMode === 'list' ? (
                              <div key={product.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <Checkbox
                                  checked={selectedProducts.includes(product.id)}
                                  onCheckedChange={(checked) => {
                                    setSelectedProducts(checked 
                                      ? [...selectedProducts, product.id]
                                      : selectedProducts.filter(id => id !== product.id)
                                    );
                                  }}
                                />
                                {product.image_url && (
                                  <img src={product.image_url} alt={product.product_name} className="w-16 h-16 object-cover rounded flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-gray-900">{product.product_name}</p>
                                  {product.variant && (
                                    <p className="text-xs text-gray-600">{product.variant}</p>
                                  )}
                                  {product.size && (
                                    <p className="text-xs text-gray-500">{product.size}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className="text-right">
                                    <p className="font-bold text-lg text-emerald-600">${product.price.toFixed(2)}</p>
                                  </div>
                                  <Button 
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setProductForm(product);
                                    }}
                                    className="h-9 w-9"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    onClick={(e) => {
                                      addToCart(product, { current: e.currentTarget });
                                    }} 
                                    size="icon"
                                    className="bg-emerald-600 h-9 w-9"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="relative">
                                  <Checkbox
                                    checked={selectedProducts.includes(product.id)}
                                    onCheckedChange={(checked) => {
                                      setSelectedProducts(checked 
                                        ? [...selectedProducts, product.id]
                                        : selectedProducts.filter(id => id !== product.id)
                                      );
                                    }}
                                    className="absolute top-2 left-2 z-10 bg-white"
                                  />
                                  {product.image_url ? (
                                    <img src={product.image_url} alt={product.product_name} className="w-full h-32 object-cover" />
                                  ) : (
                                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                                      <Package className="w-12 h-12 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <CardContent className="p-3">
                                  <p className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{product.product_name}</p>
                                  {product.variant && (
                                    <p className="text-xs text-gray-600 mb-2">{product.variant}</p>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-lg text-emerald-600">${product.price.toFixed(2)}</p>
                                    <div className="flex gap-1">
                                      <Button 
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingProduct(product);
                                          setProductForm(product);
                                        }}
                                        className="h-8 w-8"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        onClick={(e) => {
                                          addToCart(product, { current: e.currentTarget });
                                        }} 
                                        size="icon"
                                        className="bg-emerald-600 h-8 w-8"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          ))}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>

          {/* Order Cart */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Current Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No items added yet</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.product_id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{item.product_name}</p>
                              {item.variant && (
                                <p className="text-xs text-gray-600">{item.variant}</p>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeFromCart(item.product_id)}
                              className="h-6 w-6 text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                className="h-7 w-7"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                className="h-7 w-7"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="font-bold text-emerald-600">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <Label>Order Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes for this order..."
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-emerald-900">Total</span>
                        <span className="text-2xl font-bold text-emerald-600">${total.toFixed(2)}</span>
                      </div>
                      <Button
                        onClick={handleCreateOrder}
                        disabled={createOrderMutation.isPending}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500"
                      >
                        {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddProductOpen || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setIsAddProductOpen(false);
          setEditingProduct(null);
          setProductForm({});
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={productForm.product_name || ''}
                onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Input
                value={productForm.category || ''}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                placeholder="e.g., flower, edibles"
              />
            </div>
            <div>
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.price || ''}
                onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Variant</Label>
              <Input
                value={productForm.variant || ''}
                onChange={(e) => setProductForm({ ...productForm, variant: e.target.value })}
                placeholder="Optional variant"
              />
            </div>
            <div>
              <Label>Size</Label>
              <Input
                value={productForm.size || ''}
                onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                placeholder="Optional size"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={productForm.image_url || ''}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              {editingProduct && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Delete this product?')) {
                      deleteProductMutation.mutate(editingProduct.id);
                      setEditingProduct(null);
                      setProductForm({});
                    }
                  }}
                >
                  Delete
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddProductOpen(false);
                  setEditingProduct(null);
                  setProductForm({});
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!productForm.product_name || !productForm.category || !productForm.price) {
                    toast.error('Please fill required fields');
                    return;
                  }
                  if (editingProduct) {
                    updateProductMutation.mutate({
                      id: editingProduct.id,
                      data: productForm
                    });
                  } else {
                    createProductMutation.mutate({
                      ...productForm,
                      vendor_name: selectedVendor,
                      is_active: true
                    });
                  }
                }}
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="flex-1 bg-emerald-600"
              >
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor Tab</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Vendor Name *</Label>
              <Input
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                placeholder="Enter vendor name"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={vendorForm.type} onValueChange={(v) => setVendorForm({ ...vendorForm, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flower">Flower</SelectItem>
                  <SelectItem value="edibles">Edibles</SelectItem>
                  <SelectItem value="concentrates">Concentrates</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Menu URL (Optional)</Label>
              <Input
                value={vendorForm.url}
                onChange={(e) => setVendorForm({ ...vendorForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Default Price (Optional)</Label>
              <Input
                type="number"
                step="0.01"
                value={vendorForm.defaultPrice}
                onChange={(e) => setVendorForm({ ...vendorForm, defaultPrice: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAddVendorOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!vendorForm.name) {
                    toast.error('Please enter vendor name');
                    return;
                  }
                  setSelectedVendor(vendorForm.name);
                  setIsAddVendorOpen(false);
                  setVendorForm({ name: '', type: 'flower', url: '', defaultPrice: 0 });
                  toast.success('Vendor tab added - now add products to it');
                }}
                className="flex-1 bg-emerald-600"
              >
                Add Vendor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Price Edit Dialog */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {selectedProducts.length} Product Prices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Change Type</Label>
              <Select value={bulkPriceChange.type} onValueChange={(v) => setBulkPriceChange({ ...bulkPriceChange, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to specific price</SelectItem>
                  <SelectItem value="increase">Increase by amount</SelectItem>
                  <SelectItem value="decrease">Decrease by amount</SelectItem>
                  <SelectItem value="percent">Adjust by percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {bulkPriceChange.type === 'percent' ? 'Percentage (%)' : 'Amount ($)'}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={bulkPriceChange.value}
                onChange={(e) => setBulkPriceChange({ ...bulkPriceChange, value: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsBulkEditOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  bulkUpdatePricesMutation.mutate({
                    productIds: selectedProducts,
                    changeType: bulkPriceChange.type,
                    value: bulkPriceChange.value
                  });
                }}
                disabled={bulkUpdatePricesMutation.isPending}
                className="flex-1 bg-emerald-600"
              >
                Update Prices
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Price Edit Dialog */}
      <Dialog open={isGlobalEditOpen} onOpenChange={setIsGlobalEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Global Price Edit - {selectedVendor}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              This will update ALL {filteredProducts.length} products in the current view
            </p>
            <div>
              <Label>Change Type</Label>
              <Select value={globalPriceChange.type} onValueChange={(v) => setGlobalPriceChange({ ...globalPriceChange, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to specific price</SelectItem>
                  <SelectItem value="increase">Increase by amount</SelectItem>
                  <SelectItem value="decrease">Decrease by amount</SelectItem>
                  <SelectItem value="percent">Adjust by percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {globalPriceChange.type === 'percent' ? 'Percentage (%)' : 'Amount ($)'}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={globalPriceChange.value}
                onChange={(e) => setGlobalPriceChange({ ...globalPriceChange, value: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsGlobalEditOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (confirm(`Update ALL ${filteredProducts.length} product prices?`)) {
                    globalUpdatePricesMutation.mutate({
                      changeType: globalPriceChange.type,
                      value: globalPriceChange.value
                    });
                  }
                }}
                disabled={globalUpdatePricesMutation.isPending}
                className="flex-1 bg-emerald-600"
              >
                Update All Prices
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Orders Dialog */}
      <Dialog open={isOrdersOpen} onOpenChange={setIsOrdersOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order History - {selectedVendor}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No orders yet</p>
              </div>
            ) : (
              orders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.order_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{order.status}</Badge>
                        <Button
                          size="sm"
                          onClick={() => exportToPDF(order)}
                          className="bg-blue-600"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Delete this order?')) {
                              deleteOrderMutation.mutate(order.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}× {item.product_name}
                            {item.variant && ` - ${item.variant}`}
                          </span>
                          <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                        <strong>Notes:</strong> {order.notes}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="font-bold">Total</span>
                      <span className="text-xl font-bold text-emerald-600">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}