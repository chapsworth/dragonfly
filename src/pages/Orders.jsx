import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Inbox, Calendar, DollarSign, MapPin, Clock, Eye, Phone, MessageCircle, ChevronRight, Loader2, Trash2, Radar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import CustomerOrderDetailModal from '@/components/orders/CustomerOrderDetailModal';
import OrderStatusTracker from '@/components/orders/OrderStatusTracker';

export default function Orders() {
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [previousOrderStatuses, setPreviousOrderStatuses] = useState({});
  
  const queryClient = useQueryClient();

  // Sound player function
  const playSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sounds for different status changes
    const soundMap = {
      confirmed: { freq: 523.25, duration: 0.2 }, // C5 - Short beep
      preparing: { freq: 659.25, duration: 0.2 }, // E5 - Short beep
      out_for_delivery: { freq: [523.25, 659.25, 783.99], duration: 0.3 }, // C-E-G chord
      delivered: { freq: [523.25, 659.25, 783.99, 1046.50], duration: 0.5 }, // Full success chord
      cancelled: { freq: 220, duration: 0.4 } // Low A - Warning
    };
    
    const sound = soundMap[type] || { freq: 440, duration: 0.15 };
    
    if (Array.isArray(sound.freq)) {
      // Play chord
      sound.freq.forEach((freq, idx) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + sound.duration);
      });
    } else {
      oscillator.frequency.value = sound.freq;
      oscillator.type = type === 'delivered' ? 'sine' : 'triangle';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + sound.duration);
    }
  };

  // Check if redirected from checkout with order ID
  const urlParams = new URLSearchParams(window.location.search);
  const orderIdFromUrl = urlParams.get('orderId');

  // Fetch Google Maps API key
  React.useEffect(() => {
    base44.functions.invoke('getGoogleMapsKey', {}).then(res => {
      setApiKey(res.data.key);
    }).catch(() => {});
  }, []);

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });

  // Fetch user's orders
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['customer-orders', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Fetch all orders for this customer
      const allOrders = await base44.entities.Order.list('-created_date');
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      // Filter by customer email and exclude orders older than 4 hours
      return allOrders.filter(order => 
        order.customer_email === user.email && 
        new Date(order.created_date) > fourHoursAgo
      );
    },
    enabled: !!user?.email,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Auto-open order if redirected from checkout
  React.useEffect(() => {
    if (orderIdFromUrl && orders.length > 0) {
      const order = orders.find(o => o.id === orderIdFromUrl);
      if (order) {
        setSelectedOrder(order);
        // Remove the query param from URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [orderIdFromUrl, orders]);

  // Monitor order status changes and play sounds
  React.useEffect(() => {
    if (!orders || orders.length === 0) return;

    orders.forEach(order => {
      const previousStatus = previousOrderStatuses[order.id];
      const currentStatus = order.status;

      // If status changed (and we have a previous status)
      if (previousStatus && previousStatus !== currentStatus) {
        // Play sound based on new status
        if (currentStatus === 'confirmed') {
          playSound('confirmed');
          toast.success('Order confirmed!', { duration: 2000 });
        } else if (currentStatus === 'preparing') {
          playSound('preparing');
          toast.info('Order is being prepared', { duration: 2000 });
        } else if (currentStatus === 'out_for_delivery') {
          playSound('out_for_delivery');
          toast.info('🚗 Driver is on the way!', { duration: 3000 });
        } else if (currentStatus === 'delivered') {
          playSound('delivered');
          toast.success('🎉 Order delivered!', { duration: 3000 });
        } else if (currentStatus === 'cancelled') {
          playSound('cancelled');
          toast.error('Order cancelled', { duration: 2000 });
        }
      }
    });

    // Update previous statuses
    const newStatuses = {};
    orders.forEach(order => {
      newStatuses[order.id] = order.status;
    });
    setPreviousOrderStatuses(newStatuses);
  }, [orders]);

  // Filter orders based on selected tab
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'active') return ['confirmed', 'preparing', 'out_for_delivery'].includes(order.status);
    if (filter === 'completed') return ['delivered', 'cancelled'].includes(order.status);
    return true;
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-300',
    preparing: 'bg-purple-100 text-purple-700 border-purple-300',
    out_for_delivery: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    delivered: 'bg-green-100 text-green-700 border-green-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300'
  };

  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };

  const deleteOrdersMutation = useMutation({
    mutationFn: async (orderIds) => {
      for (const id of orderIds) {
        await base44.entities.Order.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setSelectedOrders([]);
      toast.success('Orders deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete orders');
    }
  });

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedOrders.length === 0) return;
    if (confirm(`Delete ${selectedOrders.length} selected order(s)?`)) {
      deleteOrdersMutation.mutate(selectedOrders);
    }
  };

  const handleDeleteAll = () => {
    if (filteredOrders.length === 0) return;
    if (confirm(`Delete all ${filteredOrders.length} order(s)?`)) {
      deleteOrdersMutation.mutate(filteredOrders.map(o => o.id));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">Sign In Required</h2>
          <p className="text-emerald-600 mb-4">Please sign in to view your orders</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-emerald-500 to-green-500">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 text-white">
              <Package className="w-7 h-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-emerald-900">My Orders</h1>
          </div>
          <p className="text-emerald-600 ml-16">Track and manage your orders</p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="w-full grid grid-cols-4 h-12 bg-white/60 backdrop-blur-xl border border-white/40">
              <TabsTrigger value="all" className="text-sm">All Orders</TabsTrigger>
              <TabsTrigger value="pending" className="text-sm">Pending</TabsTrigger>
              <TabsTrigger value="active" className="text-sm">Active</TabsTrigger>
              <TabsTrigger value="completed" className="text-sm">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Bulk Actions */}
        {filteredOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4 flex gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedOrders.length === 0 || deleteOrdersMutation.isPending}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedOrders.length})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              disabled={deleteOrdersMutation.isPending}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </Button>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
            <p className="text-emerald-600">Loading your orders...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="p-6 rounded-full bg-emerald-100 mb-4">
              <Inbox className="w-16 h-16 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-900 mb-2">No orders yet</h3>
            <p className="text-emerald-600 mb-6 text-center max-w-md">
              {filter === 'all' 
                ? "Start shopping to see your orders here" 
                : `No ${filter} orders at the moment`}
            </p>
            <Button 
              onClick={refetch}
              variant="outline"
              className="mb-2"
            >
              Refresh Orders
            </Button>
          </motion.div>
        )}

        {/* Orders List */}
        <AnimatePresence mode="popLayout">
          {!isLoading && filteredOrders.length > 0 && (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card
                    className="bg-white/60 backdrop-blur-xl border-white/40 shadow-lg hover:shadow-xl transition-all overflow-hidden"
                  >
                    <CardContent className="p-4 sm:p-6">
                      {/* Order Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleOrderSelection(order.id);
                          }}
                          className="w-5 h-5 mt-1 text-emerald-600 rounded cursor-pointer"
                        />
                        <div className="flex-1 flex items-start justify-between cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-emerald-900">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <Badge className={`${statusColors[order.status]} border`}>
                              {statusLabels[order.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(order.created_date), 'MMM d, yyyy • h:mm a')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-900">${order.total?.toFixed(2)}</p>
                          <p className="text-sm text-emerald-600">{order.items?.length || 0} items</p>
                        </div>
                        </div>
                      </div>

                      {/* Status Tracker */}
                      <div className="mb-4">
                        <OrderStatusTracker status={order.status} />
                      </div>

                      {/* Order Items Preview */}
                      <div className="mb-4 p-3 bg-emerald-50/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-900">Order Items</span>
                        </div>
                        <div className="space-y-1">
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-emerald-700">
                                {item.name} {item.variant ? `(${item.variant})` : ''} × {item.quantity}
                              </span>
                              <span className="text-emerald-900 font-semibold">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {order.items?.length > 3 && (
                            <p className="text-xs text-emerald-600 italic">
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {order.delivery_address && (
                        <div className="mb-4 flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span className="text-emerald-700">{order.delivery_address}</span>
                        </div>
                      )}

                      {/* ETA if out for delivery */}
                      {order.status === 'out_for_delivery' && order.eta_minutes && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-xl flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-semibold text-blue-900">Estimated Arrival</p>
                            <p className="text-lg font-bold text-blue-600">{order.eta_minutes} minutes</p>
                          </div>
                        </div>
                      )}

                      {/* Driver Info if available */}
                      {order.driver_name && order.status === 'out_for_delivery' && (
                        <div className="mb-4 p-3 bg-cyan-50 rounded-xl">
                          <p className="text-sm font-semibold text-cyan-900 mb-2">Your Driver</p>
                          <div className="flex items-center justify-between">
                            <p className="text-cyan-700">{order.driver_name}</p>
                            <div className="flex gap-2">
                              {order.driver_phone && (
                                <a href={`tel:${order.driver_phone}`} onClick={(e) => e.stopPropagation()}>
                                  <Button size="sm" className="h-8 bg-green-500 hover:bg-green-600">
                                    <Phone className="w-3 h-3 mr-1" />
                                    Call
                                  </Button>
                                </a>
                              )}
                              {order.driver_phone && (
                                <a href={`sms:${order.driver_phone}`} onClick={(e) => e.stopPropagation()}>
                                  <Button size="sm" variant="outline" className="h-8">
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    SMS
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-2">
                        <Link to={createPageUrl('OrderTracking') + `?id=${order.id}`} className="flex-1">
                          <Button
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                          >
                            <Radar className="w-4 h-4 mr-2" />
                            Track Order
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="border-emerald-200 hover:bg-emerald-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Detail Modal */}
      <CustomerOrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        apiKey={apiKey}
      />
    </div>
  );
}