import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Clock, Package, Truck, CheckCircle2, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function OrderTracking() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => base44.entities.Order.list().then(orders => orders.find(o => o.id === orderId)),
    enabled: !!orderId
  });

  // Set up refetch interval based on order status
  React.useEffect(() => {
    if (order?.status === 'out_for_delivery') {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [order?.status, orderId]);

  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Calculate distance when driver location is available
  useEffect(() => {
    if (order?.driver_lat && order?.driver_lng && order?.delivery_lat && order?.delivery_lng) {
      const R = 6371; // Earth's radius in km
      const dLat = (order.delivery_lat - order.driver_lat) * Math.PI / 180;
      const dLon = (order.delivery_lng - order.driver_lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(order.driver_lat * Math.PI / 180) * Math.cos(order.delivery_lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      setDistance((dist * 0.621371).toFixed(2)); // Convert to miles
    }
  }, [order?.driver_lat, order?.driver_lng, order?.delivery_lat, order?.delivery_lng]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white pt-24 pb-32 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-emerald-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white pt-24 pb-32 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Package className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-emerald-900 mb-2">Order Not Found</h1>
          <p className="text-emerald-600">Please check your order ID and try again.</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'bg-yellow-500', text: 'Order Received' },
    confirmed: { icon: CheckCircle2, color: 'bg-blue-500', text: 'Confirmed' },
    preparing: { icon: Package, color: 'bg-orange-500', text: 'Preparing' },
    out_for_delivery: { icon: Truck, color: 'bg-purple-500', text: 'Out for Delivery' },
    delivered: { icon: CheckCircle2, color: 'bg-green-500', text: 'Delivered' },
    cancelled: { icon: Package, color: 'bg-red-500', text: 'Cancelled' }
  };

  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;
  const showDriverLocation = order.status === 'out_for_delivery' && order.driver_lat && order.driver_lng;
  const isAdmin = user?.role === 'admin';

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
      toast.success('Order status updated');
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">Track Your Order</h1>
          <p className="text-emerald-600">Order #{order.id.slice(0, 8)}</p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-8">
          <Badge className={`${currentStatus.color} text-white text-lg px-6 py-3 flex items-center gap-2`}>
            <StatusIcon className="w-5 h-5" />
            {currentStatus.text}
          </Badge>
        </div>

        {/* Driver Location Map - Only show when out for delivery */}
        {showDriverLocation && (
          <Card className="mb-6 overflow-hidden border-emerald-200">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6" />
                    <div>
                      <h3 className="font-bold text-lg">Your Driver is on the way!</h3>
                      {order.eta_minutes && (
                        <p className="text-emerald-100 text-sm">ETA: {order.eta_minutes} minutes</p>
                      )}
                    </div>
                  </div>
                  {distance && (
                    <div className="text-right">
                      <p className="text-2xl font-bold">{distance}</p>
                      <p className="text-xs text-emerald-100">miles away</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="h-96">
                <MapContainer
                  center={order.delivery_lat && order.delivery_lng ? 
                    [(order.driver_lat + order.delivery_lat) / 2, (order.driver_lng + order.delivery_lng) / 2] :
                    [order.driver_lat, order.driver_lng]
                  }
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {/* Driver Marker */}
                  <Marker position={[order.driver_lat, order.driver_lng]}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-bold">{order.driver_name || 'Your Driver'}</p>
                        {order.eta_minutes && <p className="text-sm">ETA: {order.eta_minutes} min</p>}
                      </div>
                    </Popup>
                  </Marker>
                  {/* Delivery Location Marker */}
                  {order.delivery_lat && order.delivery_lng && (
                    <Marker position={[order.delivery_lat, order.delivery_lng]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold">Delivery Location</p>
                          <p className="text-sm">{order.delivery_address}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  {/* Route Line */}
                  {order.delivery_lat && order.delivery_lng && (
                    <Polyline
                      positions={[
                        [order.driver_lat, order.driver_lng],
                        [order.delivery_lat, order.delivery_lng]
                      ]}
                      color="#10b981"
                      weight={4}
                      opacity={0.7}
                      dashArray="10, 10"
                    />
                  )}
                </MapContainer>
              </div>

              {/* Driver Contact Info */}
              <div className="p-4 bg-emerald-50 border-t border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-emerald-900">{order.driver_name || 'Your Driver'}</p>
                    {order.driver_phone && (
                      <p className="text-sm text-emerald-600">Contact your driver</p>
                    )}
                  </div>
                  {order.driver_phone && (
                    <a href={`tel:${order.driver_phone}`}>
                      <Button className="bg-gradient-to-r from-emerald-500 to-green-500">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Driver
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Controls */}
        {isAdmin && (
          <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Admin Controls
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-indigo-800 mb-2 block">Update Order Status</label>
                  <Select 
                    value={order.status} 
                    onValueChange={(val) => updateStatusMutation.mutate({ id: order.id, status: val })}
                  >
                    <SelectTrigger className="bg-white border-indigo-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-indigo-600">
                  💡 Changing to "Out for Delivery" will show live tracking with map
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <Card className="mb-6 border-emerald-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-emerald-900 mb-4">Order Details</h2>
            
            <div className="space-y-4">
              {/* Items */}
              <div>
                <h3 className="font-semibold text-emerald-800 mb-2">Items</h3>
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-lg">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-emerald-900">{item.name}</p>
                        {item.variant && <p className="text-sm text-emerald-600">{item.variant}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-emerald-900">x{item.quantity}</p>
                        <p className="text-sm text-emerald-600">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-emerald-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="pt-4 border-t border-emerald-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-1" />
                  <div>
                    <p className="font-semibold text-emerald-900">Delivery Address</p>
                    <p className="text-emerald-700">{order.delivery_address}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="pt-4 border-t border-emerald-200">
                <p className="font-semibold text-emerald-900 mb-2">Contact Information</p>
                <div className="space-y-1">
                  <p className="text-emerald-700">{order.customer_name}</p>
                  {order.customer_email && (
                    <a href={`mailto:${order.customer_email}`} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {order.customer_email}
                    </a>
                  )}
                  {order.customer_phone && (
                    <a href={`tel:${order.customer_phone}`} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {order.customer_phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="pt-4 border-t border-emerald-200">
                  <p className="font-semibold text-emerald-900 mb-1">Delivery Notes</p>
                  <p className="text-emerald-700">{order.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border-emerald-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-emerald-900 mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'].map((status, idx) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const isActive = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'].indexOf(order.status) >= idx;
                const isCurrent = order.status === status;

                return (
                  <div key={status} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive ? config.color : 'bg-gray-300'
                    } text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isCurrent ? 'text-emerald-900' : 'text-gray-600'}`}>
                        {config.text}
                      </p>
                      {isCurrent && <p className="text-sm text-emerald-600">Current status</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}