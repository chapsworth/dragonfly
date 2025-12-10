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
import { CheckCircle, Truck, PackageCheck, XCircle, Mail, MoreHorizontal, LayoutDashboard, Package, ShoppingCart, Users, ArrowLeft, Grid3x3, List } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const statusOptions = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date')
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
      toast.success('Order updated successfully');
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
    
    updateMutation.mutate({ id: editingOrder.id, data: updateData });
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
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 sm:pt-24 lg:pt-8 pb-20 lg:pb-8">
          <div className="flex flex-col gap-4 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-900 mb-1 sm:mb-2">Orders</h1>
                <p className="text-sm sm:text-base text-emerald-600">Manage customer orders</p>
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
            <div className="flex gap-2 bg-white/60 backdrop-blur-xl p-1 rounded-xl w-fit">
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
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {orders.map((order) => {
                const quickActions = getQuickActions(order);
                const statusColors = {
                  pending: 'bg-yellow-100 text-yellow-700',
                  confirmed: 'bg-blue-100 text-blue-700',
                  preparing: 'bg-purple-100 text-purple-700',
                  out_for_delivery: 'bg-cyan-100 text-cyan-700',
                  delivered: 'bg-green-100 text-green-700',
                  cancelled: 'bg-red-100 text-red-700',
                };
                
                return (
                  <div key={order.id} className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleOrderSelection(order.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-bold text-emerald-900 text-sm">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-emerald-600">{order.customer_name}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(order)}>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResendEmail(order)}>
                            <Mail className="w-4 h-4 mr-2" />
                            Resend Email
                          </DropdownMenuItem>
                          {order.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => handleCancelOrder(order)} className="text-red-600">
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-600">{format(new Date(order.created_date), 'MMM d, yyyy')}</span>
                        <span className="font-bold text-emerald-900">${order.total?.toFixed(2)}</span>
                      </div>
                      <Badge className={statusColors[order.status] + ' text-xs'}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {quickActions.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {quickActions.map((action) => (
                          <Button
                            key={action.status}
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickStatusUpdate(order, action.status)}
                            className="h-7 text-xs flex-1"
                          >
                            <action.icon className="w-3 h-3 mr-1" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const quickActions = getQuickActions(order);
                const statusColors = {
                  pending: 'bg-yellow-100 text-yellow-700',
                  confirmed: 'bg-blue-100 text-blue-700',
                  preparing: 'bg-purple-100 text-purple-700',
                  out_for_delivery: 'bg-cyan-100 text-cyan-700',
                  delivered: 'bg-green-100 text-green-700',
                  cancelled: 'bg-red-100 text-red-700',
                };
                
                return (
                  <div key={order.id} className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => toggleOrderSelection(order.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-emerald-900 text-sm">#{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-emerald-600">{order.customer_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-900 text-sm">${order.total?.toFixed(2)}</p>
                            <p className="text-xs text-emerald-600">{format(new Date(order.created_date), 'MMM d')}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge className={statusColors[order.status] + ' text-xs'}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(order)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResendEmail(order)}>
                                <Mail className="w-4 h-4 mr-2" />
                                Resend Email
                              </DropdownMenuItem>
                              {order.status !== 'cancelled' && (
                                <DropdownMenuItem onClick={() => handleCancelOrder(order)} className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {quickActions.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {quickActions.map((action) => (
                              <Button
                                key={action.status}
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickStatusUpdate(order, action.status)}
                                className="h-7 text-xs"
                              >
                                <action.icon className="w-3 h-3 mr-1" />
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Dialog open={!!editingOrder} onOpenChange={() => { setEditingOrder(null); setFormData({}); }}>
            <DialogContent className="max-w-2xl bg-white/90 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>Update Order</DialogTitle>
              </DialogHeader>
            <div className="space-y-4 mt-4">
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

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => { setEditingOrder(null); setFormData({}); }} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500">
                  {updateMutation.isPending ? 'Updating...' : 'Update Order'}
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