import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '@/components/admin/AdminNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { CheckCircle, Truck, PackageCheck, XCircle, Mail, MoreHorizontal, LayoutDashboard, Package, ShoppingCart, Users, ArrowLeft, Grid3x3, List, Plus, UserPlus, Eye, Trash2, TestTube, MapPin } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ProductSelector from '@/components/orders/ProductSelector';
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import InteractiveOrderCard from '@/components/orders/InteractiveOrderCard';
import OrderNotification from '@/components/admin/OrderNotification';
import AdminOrdersMap from '@/components/admin/AdminOrdersMap';


const statusOptions = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

function AdminOrdersContent() {
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [mapSelectedOrderId, setMapSelectedOrderId] = useState(null);
  const [flashingOrderId, setFlashingOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      return await base44.entities.Order.list('-created_date');
    }
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: async (orderData) => {
      const order = await base44.entities.Order.create(orderData);
      
      // Update or create contact record
      if (orderData.customer_id) {
        const contact = contacts.find(c => c.id === orderData.customer_id);
        if (contact) {
          await base44.entities.Contact.update(contact.id, {
            type: 'customer',
            total_orders: (contact.total_orders || 0) + 1,
            total_spent: (contact.total_spent || 0) + orderData.total,
            last_order_date: new Date().toISOString().split('T')[0]
          });
        }
      } else if (orderData.customer_email) {
        // Create new contact if doesn't exist
        const existingContact = contacts.find(c => c.email === orderData.customer_email);
        if (!existingContact) {
          await base44.entities.Contact.create({
            full_name: orderData.customer_name,
            email: orderData.customer_email,
            phone: orderData.customer_phone,
            type: 'customer',
            total_orders: 1,
            total_spent: orderData.total,
            last_order_date: new Date().toISOString().split('T')[0]
          });
        }
      }
      
      // Send confirmation email
      try {
        await base44.functions.invoke('sendOrderEmail', {
          orderId: order.id,
          status: order.status,
          customerEmail: orderData.customer_email,
          customerName: orderData.customer_name
        });
      } catch (e) {
        console.error('Email error:', e);
      }

      // Notify admins of new order
      try {
        await base44.functions.invoke('notifyAdminsNewOrder', {
          order_id: order.id,
          order_number: order.id.slice(0, 8).toUpperCase(),
          customer_name: orderData.customer_name || 'N/A',
          customer_email: orderData.customer_email || '',
          customer_phone: orderData.customer_phone || '',
          delivery_address: orderData.delivery_address || '',
          total: orderData.total,
          items_count: orderData.items?.length || 0,
          items: orderData.items || []
        });
      } catch (notifyError) {
        console.error('Admin notification error:', notifyError);
      }
      
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setEditingOrder(null);
      setFormData({});
      setIsCreateOpen(false);
      toast.success('Order created successfully');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, sendEmail = true }) => {
      const order = await base44.entities.Order.update(id, data);
      
      // Send status update email if status changed
      if (sendEmail && data.status) {
        try {
          await base44.functions.invoke('sendOrderEmail', {
            orderId: id,
            status: data.status,
            customerEmail: order.customer_email,
            customerName: order.customer_name
          });
        } catch (e) {
          console.error('Email error:', e);
        }
      }
      
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setEditingOrder(null);
      setFormData({});
      setIsCreateOpen(false);
      toast.success('Order saved successfully');
    }
  });

  const resendEmailMutation = useMutation({
    mutationFn: async (order) => {
      await base44.functions.invoke('sendOrderEmail', {
        orderId: order.id,
        status: order.status,
        customerEmail: order.customer_email,
        customerName: order.customer_name
      });
    },
    onSuccess: () => {
      toast.success('Email sent successfully');
    },
    onError: () => {
      toast.error('Failed to send email');
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ orderIds, status }) => {
      const promises = orderIds.map(id => {
        const order = orders.find(o => o.id === id);
        return base44.entities.Order.update(id, { status }).then(() => {
          // Send email for each order
          return base44.functions.invoke('sendOrderEmail', {
            orderId: id,
            status,
            customerEmail: order.customer_email,
            customerName: order.customer_name
          }).catch(e => console.error('Email error:', e));
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrders([]);
      toast.success('Orders updated successfully');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const testAdminEmailMutation = useMutation({
    mutationFn: async (orderId) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');
      
      return await base44.functions.invoke('notifyAdminsNewOrder', {
        order_id: order.id,
        order_number: order.id.slice(0, 8).toUpperCase(),
        customer_name: order.customer_name || 'N/A',
        customer_email: order.customer_email || '',
        customer_phone: order.customer_phone || '',
        delivery_address: order.delivery_address || '',
        total: order.total,
        items_count: order.items?.length || 0,
        items: order.items || []
      });
    },
    onSuccess: (result) => {
      toast.success(`Admin email test completed! Check function logs for details.`);
      console.log('Test result:', result);
    },
    onError: (error) => {
      toast.error(`Failed to send test email: ${error.message}`);
      console.error('Test error:', error);
    }
  });

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      status: order.status,
      driver_name: order.driver_name || '',
      driver_phone: order.driver_phone || '',
      delivery_lat: order.delivery_lat || '',
      delivery_lng: order.delivery_lng || ''
    });
  };

  const handleCreate = () => {
    setEditingOrder(null);
    setFormData({
      items: [],
      subtotal: 0,
      discount: 0,
      fees: 0,
      total: 0,
      status: 'pending',
      delivery_address: '',
      customer_id: '',
      customer_selection: 'existing',
      driver_selection: 'none'
    });
    setIsCreateOpen(true);
  };

  const calculateTotals = (items, discount = 0, fees = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - discount + fees;
    return { subtotal, total };
  };

  const handleAddProducts = (products) => {
    const newItems = [...(formData.items || []), ...products];
    const { subtotal, total } = calculateTotals(newItems, formData.discount || 0, formData.fees || 0);
    setFormData({ ...formData, items: newItems, subtotal, total });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const { subtotal, total } = calculateTotals(newItems, formData.discount || 0, formData.fees || 0);
    setFormData({ ...formData, items: newItems, subtotal, total });
  };

  const handleUpdateItemPrice = (index, newPrice) => {
    const newItems = formData.items.map((item, i) => 
      i === index ? { ...item, price: parseFloat(newPrice) || 0 } : item
    );
    const { subtotal, total } = calculateTotals(newItems, formData.discount || 0, formData.fees || 0);
    setFormData({ ...formData, items: newItems, subtotal, total });
  };

  const handleUpdateItemQuantity = (index, newQuantity) => {
    const newItems = formData.items.map((item, i) => 
      i === index ? { ...item, quantity: Math.max(1, parseInt(newQuantity) || 1) } : item
    );
    const { subtotal, total } = calculateTotals(newItems, formData.discount || 0, formData.fees || 0);
    setFormData({ ...formData, items: newItems, subtotal, total });
  };

  const handleUpdateDiscount = (discount) => {
    const discountVal = parseFloat(discount) || 0;
    const { total } = calculateTotals(formData.items || [], discountVal, formData.fees || 0);
    setFormData({ ...formData, discount: discountVal, total });
  };

  const handleUpdateFees = (fees) => {
    const feesVal = parseFloat(fees) || 0;
    const { total } = calculateTotals(formData.items || [], formData.discount || 0, feesVal);
    setFormData({ ...formData, fees: feesVal, total });
  };

  const handleCreateOrder = () => {
    if (formData.customer_selection === 'new' && !formData.new_customer_name) {
      toast.error('Please enter customer name');
      return;
    }
    if (formData.customer_selection === 'existing' && !formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (!formData.items || formData.items.length === 0) {
      toast.error('Please add at least one product');
      return;
    }
    
    const selectedContact = formData.customer_selection === 'existing' ? contacts.find(c => c.id === formData.customer_id) : null;
    
    const orderData = {
      items: formData.items,
      subtotal: formData.subtotal,
      discount: formData.discount || 0,
      fees: formData.fees || 0,
      total: formData.total,
      status: formData.status,
      delivery_address: formData.delivery_address,
      delivery_lat: formData.delivery_lat,
      delivery_lng: formData.delivery_lng,
      customer_name: formData.customer_selection === 'existing' ? selectedContact?.full_name : formData.new_customer_name,
      customer_phone: formData.customer_selection === 'existing' ? selectedContact?.phone : formData.new_customer_phone,
      customer_email: formData.customer_selection === 'existing' ? selectedContact?.email : formData.new_customer_email,
      customer_id: formData.customer_selection === 'existing' ? formData.customer_id : undefined,
      notes: formData.notes
    };

    // Add driver info if selected
    if (formData.driver_selection === 'self') {
      orderData.driver_name = currentUser?.full_name;
      orderData.driver_phone = currentUser?.phone || '';
      orderData.driver_email = currentUser?.email;
      orderData.status = 'out_for_delivery';
    } else if (formData.driver_selection === 'other') {
      orderData.driver_name = formData.driver_name;
      orderData.driver_phone = formData.driver_phone;
      orderData.driver_email = formData.driver_email;
    }
    
    createMutation.mutate(orderData);
  };

  const handleSave = () => {
    const updateData = { 
      status: formData.status,
      driver_name: formData.driver_name,
      driver_phone: formData.driver_phone
    };
    
    if (formData.delivery_lat) {
      updateData.delivery_lat = parseFloat(formData.delivery_lat);
    }
    if (formData.delivery_lng) {
      updateData.delivery_lng = parseFloat(formData.delivery_lng);
    }
    
    updateMutation.mutate({ id: editingOrder?.id, data: updateData });
  };

  const handleQuickStatusUpdate = (order, newStatus) => {
    updateMutation.mutate({ id: order.id, data: { status: newStatus } });
  };

  const handleCancelOrder = (order) => {
    if (confirm(`Cancel order #${order.id.slice(0, 8)}?`)) {
      updateMutation.mutate({ id: order.id, data: { status: 'cancelled' } });
    }
  };

  const handleResendEmail = (order) => {
    resendEmailMutation.mutate(order);
  };

  const handleTakeDelivery = async (order) => {
    const user = await base44.auth.me();
    updateMutation.mutate({
      id: order.id,
      data: {
        status: 'out_for_delivery',
        driver_email: user.email,
        driver_name: user.full_name,
        driver_phone: user.phone || ''
      }
    });
  };

  const handleBulkAction = (action) => {
    if (selectedOrders.length === 0) {
      toast.error('No orders selected');
      return;
    }
    
    if (action === 'cancel') {
      if (confirm(`Cancel ${selectedOrders.length} orders?`)) {
        bulkUpdateMutation.mutate({ orderIds: selectedOrders, status: 'cancelled' });
      }
    } else {
      bulkUpdateMutation.mutate({ orderIds: selectedOrders, status: action });
    }
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const getQuickActions = (order) => {
    const actions = [];
    
    if (order.status === 'pending') {
      actions.push({ label: 'Confirm', status: 'confirmed', icon: CheckCircle, color: 'text-blue-600' });
    }
    if (order.status === 'confirmed') {
      actions.push({ label: 'Prepare', status: 'preparing', icon: PackageCheck, color: 'text-purple-600' });
    }
    if (order.status === 'preparing') {
      actions.push({ label: 'Out for Delivery', status: 'out_for_delivery', icon: Truck, color: 'text-cyan-600' });
    }
    if (order.status === 'out_for_delivery') {
      actions.push({ label: 'Delivered', status: 'delivered', icon: CheckCircle, color: 'text-green-600' });
    }
    
    return actions;
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'AdminDashboard' },
    { id: 'products', label: 'Products', icon: Package, page: 'AdminProducts' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, page: 'AdminOrders' },
    { id: 'users', label: 'Users', icon: Users, page: 'AdminUsers' },
  ];

  // Extract unique cities from orders
  const cities = [...new Set(orders
    .map(o => o.delivery_address?.split(',').slice(-3, -2)[0]?.trim())
    .filter(Boolean)
  )];

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    const cityMatch = cityFilter === 'all' || 
      order.delivery_address?.toLowerCase().includes(cityFilter.toLowerCase());
    return statusMatch && cityMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <OrderNotification />
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
              const isActive = tab.id === 'orders';
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
          <AdminNav currentPage="AdminOrders" />
        </div>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-6 pb-20 lg:pb-8">
          <div className="flex flex-col gap-4 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-900 mb-1 sm:mb-2">Orders</h1>
                <p className="text-sm sm:text-base text-emerald-600">Manage customer orders</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="bg-gradient-to-r from-emerald-500 to-green-500">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Order
                </Button>
                {orders.length > 0 && (
                  <>
                    <Button 
                      onClick={() => testAdminEmailMutation.mutate(orders[0].id)} 
                      disabled={testAdminEmailMutation.isPending}
                      variant="outline"
                      className="gap-2"
                    >
                      <TestTube className="w-4 h-4" />
                      {testAdminEmailMutation.isPending ? 'Testing...' : 'Test Admin Email'}
                    </Button>
                    <Button 
                      onClick={async () => {
                        if (confirm('Geocode all orders missing coordinates?')) {
                          toast.promise(
                            base44.functions.invoke('geocodeOrders'),
                            {
                              loading: 'Geocoding orders...',
                              success: (res) => `${res.data.message}`,
                              error: 'Failed to geocode orders'
                            }
                          );
                        }
                      }}
                      variant="outline"
                      className="gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Geocode Orders
                    </Button>
                  </>
                )}
              </div>
              
              {selectedOrders.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Badge variant="secondary" className="px-3 py-1">{selectedOrders.length} selected</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1 sm:flex-none">Bulk Actions</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBulkAction('confirmed')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Orders
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('preparing')}>
                        <PackageCheck className="w-4 h-4 mr-2" />
                        Mark as Preparing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('out_for_delivery')}>
                        <Truck className="w-4 h-4 mr-2" />
                        Out for Delivery
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('delivered')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Delivered
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('cancel')} className="text-red-600">
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Orders
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-2 bg-white/60 backdrop-blur-xl p-1 rounded-xl">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''}
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''}
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-white/60 backdrop-blur-xl">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-48 bg-white/60 backdrop-blur-xl">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Admin Orders Map */}
          <AdminOrdersMap 
            orders={filteredOrders} 
            selectedOrderId={mapSelectedOrderId}
            onOrderSelect={(orderId) => {
              setMapSelectedOrderId(orderId);
              setFlashingOrderId(orderId);
              setTimeout(() => setFlashingOrderId(null), 600);
            }}
          />

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  className={`transition-all ${
                    flashingOrderId === order.id ? 'animate-pulse scale-105' : ''
                  } ${mapSelectedOrderId === order.id ? 'ring-2 ring-emerald-500 rounded-2xl' : ''}`}
                  onClick={() => {
                    setMapSelectedOrderId(order.id);
                    setFlashingOrderId(order.id);
                    setTimeout(() => setFlashingOrderId(null), 600);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                      className="mt-4"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <InteractiveOrderCard order={order} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Dialog open={!!editingOrder || isCreateOpen} onOpenChange={() => { setEditingOrder(null); setFormData({}); setIsCreateOpen(false); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>{editingOrder ? 'Update Order' : 'Create Order'}</DialogTitle>
              </DialogHeader>
            <div className="space-y-4 mt-4">
              {!editingOrder ? (
                <>
                  {/* Customer Selection */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Customer *</Label>
                    <RadioGroup value={formData.customer_selection} onValueChange={(v) => setFormData({...formData, customer_selection: v})}>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-emerald-50">
                        <RadioGroupItem value="existing" id="existing" />
                        <Label htmlFor="existing" className="flex-1 cursor-pointer">Select existing customer</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-emerald-50">
                        <RadioGroupItem value="new" id="new" />
                        <Label htmlFor="new" className="flex-1 cursor-pointer">Create new customer</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.customer_selection === 'existing' && (
                    <div>
                      <Label>Select Customer *</Label>
                      <Select value={formData.customer_id} onValueChange={(v) => {
                        const selectedContact = contacts.find(c => c.id === v);
                        if (selectedContact) {
                          const address = selectedContact.address ? 
                            `${selectedContact.address}${selectedContact.city ? ', ' + selectedContact.city : ''}${selectedContact.state ? ', ' + selectedContact.state : ''}${selectedContact.zip ? ' ' + selectedContact.zip : ''}` 
                            : '';
                          setFormData({
                            ...formData, 
                            customer_id: v,
                            delivery_address: address
                          });
                        } else {
                          setFormData({...formData, customer_id: v});
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a customer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.filter(c => c.type === 'customer' || c.email).map(contact => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.full_name} ({contact.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.customer_selection === 'new' && (
                    <div className="space-y-3 p-4 border rounded-lg bg-emerald-50/50">
                      <div className="flex items-center gap-2 mb-2">
                        <UserPlus className="w-5 h-5 text-emerald-600" />
                        <Label className="font-semibold">New Customer Details</Label>
                      </div>
                      <div>
                        <Label>Full Name *</Label>
                        <Input 
                          value={formData.new_customer_name || ''} 
                          onChange={(e) => setFormData({...formData, new_customer_name: e.target.value})}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input 
                          type="email"
                          value={formData.new_customer_email || ''} 
                          onChange={(e) => setFormData({...formData, new_customer_email: e.target.value})}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input 
                          value={formData.new_customer_phone || ''} 
                          onChange={(e) => setFormData({...formData, new_customer_phone: e.target.value})}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  )}

                  {/* Driver Assignment */}
                  <div className="border-t border-emerald-100 pt-4">
                    <Label className="text-base font-semibold mb-3 block">Delivery Driver</Label>
                    <RadioGroup value={formData.driver_selection} onValueChange={(v) => setFormData({...formData, driver_selection: v})}>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-emerald-50">
                        <RadioGroupItem value="none" id="none" />
                        <Label htmlFor="none" className="flex-1 cursor-pointer">No driver assigned yet</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-emerald-50">
                        <RadioGroupItem value="self" id="driver-self" />
                        <Label htmlFor="driver-self" className="flex-1 cursor-pointer">I'll deliver this ({currentUser?.email})</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-emerald-50">
                        <RadioGroupItem value="other" id="other-driver" />
                        <Label htmlFor="other-driver" className="flex-1 cursor-pointer">Assign to another driver</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.driver_selection === 'other' && (
                    <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50">
                      <Label className="font-semibold">Driver Details</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Driver Name</Label>
                          <Input 
                            value={formData.driver_name || ''} 
                            onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                            placeholder="Jane Smith"
                          />
                        </div>
                        <div>
                          <Label>Driver Phone</Label>
                          <Input 
                            value={formData.driver_phone || ''} 
                            onChange={(e) => setFormData({...formData, driver_phone: e.target.value})}
                            placeholder="(555) 987-6543"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Driver Email</Label>
                        <Input 
                          type="email"
                          value={formData.driver_email || ''} 
                          onChange={(e) => setFormData({...formData, driver_email: e.target.value})}
                          placeholder="driver@example.com"
                        />
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="border-t border-emerald-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-semibold">Order Items</Label>
                      <Button 
                        type="button"
                        size="sm"
                        onClick={() => setIsProductSelectorOpen(true)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Products
                      </Button>
                    </div>

                    {(!formData.items || formData.items.length === 0) ? (
                      <p className="text-gray-400 text-center py-4 border rounded-lg">No products added yet</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {formData.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {item.image_url && (
                              <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) => handleUpdateItemPrice(index, e.target.value)}
                                  className="h-7 w-20 text-xs"
                                />
                                <span className="text-xs">×</span>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(index, e.target.value)}
                                  className="h-7 w-16 text-xs"
                                />
                                <span className="text-xs font-bold text-emerald-600">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pricing Summary */}
                    <div className="mt-4 p-4 bg-emerald-50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span className="font-semibold">${(formData.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">Discount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.discount || 0}
                          onChange={(e) => handleUpdateDiscount(e.target.value)}
                          className="h-8 w-24 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">Fees</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.fees || 0}
                          onChange={(e) => handleUpdateFees(e.target.value)}
                          className="h-8 w-24 text-right"
                        />
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total</span>
                        <span className="text-emerald-600">${(formData.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="border-t border-emerald-100 pt-4">
                    <Label className="text-base font-semibold mb-3 block">Order Details</Label>
                    <div>
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(s => (
                            <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-3">
                      <Label>Delivery Address</Label>
                      <AddressAutocomplete
                        value={formData.delivery_address || ''} 
                        onChange={(val) => setFormData({...formData, delivery_address: val})}
                        placeholder="123 Main St, City, State"
                        onPlaceSelect={(details) => {
                          setFormData({
                            ...formData, 
                            delivery_address: details.address,
                            delivery_lat: details.lat,
                            delivery_lng: details.lng
                          });
                        }}
                      />
                    </div>
                    <div className="mt-3">
                      <Label>Notes</Label>
                      <Textarea 
                        value={formData.notes || ''} 
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Special instructions..."
                        rows={3}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Order ID</Label>
                      <p className="text-sm text-emerald-600">#{editingOrder?.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <Label>Customer</Label>
                      <p className="text-sm text-emerald-900">{editingOrder?.customer_name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => (
                          <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t border-emerald-100 pt-4">
                    <Label className="text-base font-semibold mb-3 block">Delivery Tracking Info</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Driver Name</Label>
                        <Input 
                          value={formData.driver_name || ''} 
                          onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Driver Phone</Label>
                        <Input 
                          value={formData.driver_phone || ''} 
                          onChange={(e) => setFormData({...formData, driver_phone: e.target.value})}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label>Delivery Latitude</Label>
                        <Input 
                          type="number"
                          step="0.000001"
                          value={formData.delivery_lat || ''} 
                          onChange={(e) => setFormData({...formData, delivery_lat: e.target.value})}
                          placeholder="34.0522"
                        />
                      </div>
                      <div>
                        <Label>Delivery Longitude</Label>
                        <Input 
                          type="number"
                          step="0.000001"
                          value={formData.delivery_lng || ''} 
                          onChange={(e) => setFormData({...formData, delivery_lng: e.target.value})}
                          placeholder="-118.2437"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => { setEditingOrder(null); setFormData({}); setIsCreateOpen(false); }} className="flex-1">Cancel</Button>
                <Button 
                  onClick={editingOrder ? handleSave : handleCreateOrder} 
                  disabled={updateMutation.isPending || createMutation.isPending} 
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500"
                >
                  {(updateMutation.isPending || createMutation.isPending) ? 'Saving...' : editingOrder ? 'Update Order' : 'Create Order'}
                </Button>
              </div>
              </div>
            </DialogContent>
          </Dialog>

          <ProductSelector
            isOpen={isProductSelectorOpen}
            onClose={() => setIsProductSelectorOpen(false)}
            onAddProducts={handleAddProducts}
          />

          <OrderDetailModal
            order={viewingOrder}
            isOpen={!!viewingOrder}
            onClose={() => setViewingOrder(null)}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  return <AdminOrdersContent />;
}