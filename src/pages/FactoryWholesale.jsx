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
import { Plus, Minus, Download, ShoppingCart, Package, Trash2, Search, FileText, ChevronDown, Percent, Edit2, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import PasswordGuard from '@/components/auth/PasswordGuard';
import { motion, AnimatePresence } from 'framer-motion';

export default function FactoryWholesale() {
  return (
    <PasswordGuard>
      <FactoryWholesaleContent />
    </PasswordGuard>
  );
}

function FactoryWholesaleContent() {
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
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [newItem, setNewItem] = useState({ product_name: '', category: '', variant: '', price: '', size: '' });
  const floatingTotalRef = useRef(null);
  const floatingMarkupRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'admin';

  const { data: markupSettings } = useQuery({
    queryKey: ['markup-settings', selectedVendor],
    queryFn: async () => {
      const all = await base44.entities.MarkupSettings.list();
      let settings = all.find(s => s.setting_key === selectedVendor);
      if (!settings) {
        settings = await base44.entities.MarkupSettings.create({
          setting_key: selectedVendor,
          global_markup: 15,
          product_markups: {}
        });
      }
      return settings;
    }
  });

  const globalMarkup = markupSettings?.global_markup || 15;
  const productMarkups = markupSettings?.product_markups || {};

  const updateGlobalMarkupMutation = useMutation({
    mutationFn: async (newMarkup) => {
      if (!markupSettings) return;
      return await base44.entities.MarkupSettings.update(markupSettings.id, {
        global_markup: newMarkup
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markup-settings'] });
      toast.success('Global markup updated');
    }
  });

  const updateProductMarkupMutation = useMutation({
    mutationFn: async ({ id, markup }) => {
      if (!markupSettings) return;
      const updatedProductMarkups = { ...productMarkups, [id]: markup };
      return await base44.entities.MarkupSettings.update(markupSettings.id, {
        product_markups: updatedProductMarkups
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markup-settings'] });
    }
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => base44.entities.VendorProduct.create({
      ...data,
      vendor_name: selectedVendor,
      is_active: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-products']);
      setIsAddItemOpen(false);
      setNewItem({ product_name: '', category: '', variant: '', price: '', size: '' });
      toast.success('Product added');
    }
  });

  const updateProductDataMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VendorProduct.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-products']);
      setEditingProduct(null);
      toast.success('Product updated');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.VendorProduct.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-products']);
      toast.success('Product deleted');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.VendorProduct.update(id, { is_active: false })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-products']);
      setSelectedProducts([]);
      toast.success('Products deleted');
    }
  });

  const { data: jaredProducts = [], isLoading } = useQuery({
    queryKey: ['vendor-products', selectedVendor],
    queryFn: async () => {
      const all = await base44.entities.VendorProduct.list();
      return all.filter(p => p.vendor_name === selectedVendor && p.is_active);
    }
  });

  const calculateMarkedUpPrice = (wholesalePrice, productId) => {
    const markup = productMarkups[productId] !== undefined ? productMarkups[productId] : globalMarkup;
    return Math.round(wholesalePrice * (1 + markup / 100) * 100) / 100;
  };

  const products = jaredProducts.map(p => ({
    ...p,
    originalPrice: p.price,
    price: calculateMarkedUpPrice(p.price, p.id),
    markup: productMarkups[p.id] !== undefined ? productMarkups[p.id] : globalMarkup
  }));

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

  const calculateProfit = () => {
    return cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      if (!product) return sum;
      const wholesaleCost = product.originalPrice * item.quantity;
      const markedUpPrice = item.price * item.quantity;
      return sum + (markedUpPrice - wholesaleCost);
    }, 0);
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
  const profit = calculateProfit();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-1 sm:p-4 pb-96 overflow-x-hidden w-full">
      {/* Sticky Footer with Total and Markup */}
      <div ref={floatingTotalRef} className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t-2 border-emerald-200 shadow-2xl pb-6">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Order Total */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600">Order Total</p>
                <p className="text-base sm:text-xl font-bold text-emerald-600">${total.toFixed(2)}</p>
                {isAdmin && cart.length > 0 && (
                  <p className="text-[10px] sm:text-xs text-green-600 font-semibold">+${profit.toFixed(2)} profit</p>
                )}
              </div>
              {cart.length > 0 && (
                <Badge className="bg-emerald-600 text-white text-xs">{cart.length}</Badge>
              )}
            </div>

            {/* Global Markup - Admin Only */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 sm:gap-3 border-l border-gray-300 pl-2 sm:pl-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-600">Markup</p>
                    <p className="text-base sm:text-xl font-bold text-blue-600">{globalMarkup}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateGlobalMarkupMutation.mutate(Math.max(0, globalMarkup - 5))}
                    className="h-7 w-7 sm:h-8 sm:w-8"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateGlobalMarkupMutation.mutate(globalMarkup + 5)}
                    className="h-7 w-7 sm:h-8 sm:w-8"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-4 sm:pt-6 w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
            <Button 
              variant={selectedVendor === 'Jared Cookie Factory' ? 'default' : 'outline'}
              onClick={() => setSelectedVendor('Jared Cookie Factory')}
              className="text-sm"
            >
              Factory Wholesale
            </Button>
            <Button 
              variant={selectedVendor === 'Pioneer' ? 'default' : 'outline'}
              onClick={() => setSelectedVendor('Pioneer')}
              className="text-sm"
            >
              THCV Pioneer
            </Button>
            {isAdmin && (
              <Button onClick={() => setIsAddItemOpen(true)} className="bg-emerald-600 text-sm ml-auto">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            )}
            <Button onClick={() => setIsOrdersOpen(true)} variant="outline" className="text-sm">
              <FileText className="w-4 h-4 mr-1" />
              Orders
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-emerald-900">{selectedVendor} Orders</h1>
          <p className="text-sm text-emerald-600">Create orders for {selectedVendor}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-2 sm:gap-6">
          {/* Product Catalog */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-2 sm:mb-3">
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
                </div>
                {isAdmin && selectedProducts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedProducts.length} selected</Badge>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => bulkDeleteMutation.mutate(selectedProducts)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete Selected
                    </Button>
                  </div>
                )}
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
                        <CardContent className="space-y-1.5 p-2">
                          {categoryProducts.map(product => (
                            <div key={product.id} className="flex items-center gap-1 p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                             {isAdmin && (
                               <Button
                                 size="icon"
                                 variant="ghost"
                                 onClick={() => {
                                   if (selectedProducts.includes(product.id)) {
                                     setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                   } else {
                                     setSelectedProducts([...selectedProducts, product.id]);
                                   }
                                 }}
                                 className="h-5 w-5 flex-shrink-0 p-0"
                               >
                                 {selectedProducts.includes(product.id) ? (
                                   <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                 ) : (
                                   <Square className="w-3.5 h-3.5" />
                                 )}
                               </Button>
                             )}
                             <div className="flex-1 min-w-0">
                               <p className="font-semibold text-xs text-gray-900 truncate leading-tight">{product.product_name}</p>
                               {product.variant && (
                                 <p className="text-[10px] text-gray-600 truncate leading-tight">{product.variant}</p>
                               )}
                               {product.size && (
                                 <p className="text-[10px] text-gray-500 leading-tight">{product.size}</p>
                               )}
                             </div>
                             <div className="flex items-center gap-0.5 flex-shrink-0">
                               <div className="text-right min-w-[52px]">
                                 {isAdmin && (
                                   <div className="flex flex-col items-end mb-0.5">
                                     <span className="text-[9px] text-gray-500 line-through leading-none">${product.originalPrice.toFixed(2)}</span>
                                     <Badge variant="outline" className="text-[8px] px-0.5 py-0 h-3 leading-none mt-0.5">{product.markup}%</Badge>
                                   </div>
                                 )}
                                 <p className="font-bold text-xs text-emerald-600 whitespace-nowrap leading-none">${product.price.toFixed(2)}</p>
                               </div>
                               {isAdmin && (
                                 <div className="flex gap-0.5">
                                   <Button
                                     size="icon"
                                     variant="ghost"
                                     onClick={() => setEditingProduct(product)}
                                     className="h-5 w-5 p-0"
                                   >
                                     <Edit2 className="w-2.5 h-2.5" />
                                   </Button>
                                   <Button
                                     size="icon"
                                     variant="ghost"
                                     onClick={() => {
                                       if (confirm('Delete this product?')) {
                                         deleteProductMutation.mutate(product.id);
                                       }
                                     }}
                                     className="h-5 w-5 p-0 text-red-500"
                                   >
                                     <Trash2 className="w-2.5 h-2.5" />
                                   </Button>
                                 </div>
                               )}
                               <Button 
                                 onClick={(e) => {
                                   addToCart(product, { current: e.currentTarget });
                                 }} 
                                 size="icon"
                                 className="bg-emerald-600 h-6 w-6 flex-shrink-0 p-0"
                               >
                                 <Plus className="w-3 h-3" />
                               </Button>
                             </div>
                            </div>
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
      <Dialog open={isAddItemOpen || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setIsAddItemOpen(false);
          setEditingProduct(null);
          setNewItem({ product_name: '', category: '', variant: '', price: '', size: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={editingProduct ? editingProduct.product_name : newItem.product_name}
                onChange={(e) => editingProduct 
                  ? setEditingProduct({...editingProduct, product_name: e.target.value})
                  : setNewItem({...newItem, product_name: e.target.value})
                }
                placeholder="e.g., Enjoyable Gummies"
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select 
                value={editingProduct ? editingProduct.category : newItem.category}
                onValueChange={(v) => editingProduct
                  ? setEditingProduct({...editingProduct, category: v})
                  : setNewItem({...newItem, category: v})
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edibles">Edibles</SelectItem>
                  <SelectItem value="vapes">Vapes</SelectItem>
                  <SelectItem value="pre-rolls">Pre-Rolls</SelectItem>
                  <SelectItem value="concentrates">Concentrates</SelectItem>
                  <SelectItem value="flower">Flower</SelectItem>
                  <SelectItem value="tinctures">Tinctures</SelectItem>
                  <SelectItem value="topicals">Topicals</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Variant</Label>
              <Input
                value={editingProduct ? editingProduct.variant || '' : newItem.variant}
                onChange={(e) => editingProduct
                  ? setEditingProduct({...editingProduct, variant: e.target.value})
                  : setNewItem({...newItem, variant: e.target.value})
                }
                placeholder="e.g., Strawberry Kiwi"
              />
            </div>
            <div>
              <Label>Size</Label>
              <Input
                value={editingProduct ? editingProduct.size || '' : newItem.size}
                onChange={(e) => editingProduct
                  ? setEditingProduct({...editingProduct, size: e.target.value})
                  : setNewItem({...newItem, size: e.target.value})
                }
                placeholder="e.g., 2.5g"
              />
            </div>
            <div>
              <Label>Wholesale Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={editingProduct ? editingProduct.price : newItem.price}
                onChange={(e) => editingProduct
                  ? setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})
                  : setNewItem({...newItem, price: e.target.value})
                }
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setIsAddItemOpen(false);
                  setEditingProduct(null);
                  setNewItem({ product_name: '', category: '', variant: '', price: '', size: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-emerald-600"
                onClick={() => {
                  if (editingProduct) {
                    updateProductDataMutation.mutate({
                      id: editingProduct.id,
                      data: {
                        product_name: editingProduct.product_name,
                        category: editingProduct.category,
                        variant: editingProduct.variant || null,
                        size: editingProduct.size || null,
                        price: editingProduct.price
                      }
                    });
                  } else {
                    if (!newItem.product_name || !newItem.category || !newItem.price) {
                      toast.error('Fill in required fields');
                      return;
                    }
                    createItemMutation.mutate({
                      product_name: newItem.product_name,
                      category: newItem.category,
                      variant: newItem.variant || null,
                      size: newItem.size || null,
                      price: parseFloat(newItem.price)
                    });
                  }
                }}
                disabled={createItemMutation.isPending || updateProductDataMutation.isPending}
              >
                {(createItemMutation.isPending || updateProductDataMutation.isPending) ? 'Saving...' : editingProduct ? 'Update' : 'Add Product'}
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