import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Phone, MessageSquare, Navigation, Package, User, MapPin, Truck, Clock, Radar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

export default function InteractiveOrderCard({ order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [distance, setDistance] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const queryClient = useQueryClient();

  // Fetch current user as potential driver
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Get driver location when status is out_for_delivery
  useEffect(() => {
    if (order.status === 'out_for_delivery' && currentUser?.email === order.driver_email && navigator.geolocation) {
      // Get initial location
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setDriverLocation({ lat, lng });
        
        // Update order with driver location
        base44.entities.Order.update(order.id, {
          driver_lat: lat,
          driver_lng: lng
        }).catch(err => console.error('Failed to update driver location:', err));
      });

      // Watch for location changes
      const watchId = navigator.geolocation.watchPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setDriverLocation({ lat, lng });
        
        // Update order with driver location
        base44.entities.Order.update(order.id, {
          driver_lat: lat,
          driver_lng: lng
        }).catch(err => console.error('Failed to update driver location:', err));
      });

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [order.status, order.driver_email, currentUser?.email, order.id]);

  // Calculate distance when driver and delivery locations are available
  useEffect(() => {
    const driverLat = driverLocation?.lat || order.driver_lat;
    const driverLng = driverLocation?.lng || order.driver_lng;

    if (driverLat && driverLng && order.delivery_lat && order.delivery_lng) {
      const R = 6371; // Earth's radius in km
      const dLat = (order.delivery_lat - driverLat) * Math.PI / 180;
      const dLon = (order.delivery_lng - driverLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(driverLat * Math.PI / 180) * Math.cos(order.delivery_lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      setDistance((dist * 0.621371).toFixed(2)); // Convert to miles
    }
  }, [driverLocation, order.driver_lat, order.driver_lng, order.delivery_lat, order.delivery_lng]);

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus) => base44.entities.Order.update(order.id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  if (!order) {
    return null;
  }

  const handleCall = () => {
    if (order.customer_phone) {
      window.location.href = `tel:${order.customer_phone}`;
    } else {
      toast.error('No phone number available');
    }
  };

  const handleText = () => {
    if (order?.customer_phone) {
      const orderId = order.id ? order.id.slice(-8) : 'XXXXX';
      const message = encodeURIComponent(`Hi ${order.customer_name || 'there'}, this is about your order #${orderId}. Your order is ${order.status?.replace('_', ' ') || 'being processed'}. We'll keep you updated!`);
      window.location.href = `sms:${order.customer_phone}${/iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'}body=${message}`;
    } else {
      toast.error('No phone number available');
    }
  };

  const handleNavigation = (type) => {
    if (!order.delivery_address && !order.delivery_lat) {
      toast.error('No delivery address available');
      return;
    }

    if (order.delivery_lat && order.delivery_lng) {
      if (type === 'apple') {
        window.open(`http://maps.apple.com/?daddr=${order.delivery_lat},${order.delivery_lng}`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`, '_blank');
      }
    } else if (order.delivery_address) {
      const encoded = encodeURIComponent(order.delivery_address);
      if (type === 'apple') {
        window.open(`http://maps.apple.com/?daddr=${encoded}`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
      }
    }
  };

  return (
    <div className="rounded-xl bg-white border border-emerald-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-emerald-900 text-sm">Order #{order.id.slice(-8)}</p>
              <Badge className={statusColors[order.status]}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-emerald-600">
              {format(new Date(order.created_date + 'Z'), 'MMM d, h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <p className="font-bold text-emerald-900">${order.total?.toFixed(2)}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Status Update */}
        <div className="mb-2">
          <Select
            value={order.status}
            onValueChange={(value) => updateStatusMutation.mutate(value)}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger className="h-8 text-xs bg-emerald-50 border-emerald-200">
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link to={createPageUrl('OrderTracking') + `?id=${order.id}`} className="flex-1">
            <Button
              size="sm"
              className="w-full h-8 text-xs bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Radar className="w-3 h-3 mr-1" />
              Track
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCall}
            className="flex-1 h-8 text-xs"
            disabled={!order.customer_phone}
          >
            <Phone className="w-3 h-3 mr-1" />
            Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleText}
            className="flex-1 h-8 text-xs"
            disabled={!order.customer_phone}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
              handleNavigation(isMac ? 'apple' : 'google');
            }}
            className="flex-1 h-8 text-xs"
            disabled={!order.delivery_address && !order.delivery_lat}
          >
            <Navigation className="w-3 h-3 mr-1" />
            Nav
          </Button>
        </div>

        {/* Compact Map Preview - Only when out for delivery */}
        {order.status === 'out_for_delivery' && (driverLocation || order.driver_lat) && order.delivery_lat && order.delivery_lng && (
          <div className="mt-3 rounded-lg overflow-hidden border-2 border-orange-200">
            <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white px-2 py-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Truck className="w-3 h-3" />
                <span className="font-semibold">Live Tracking</span>
              </div>
              {distance && (
                <span className="font-bold">{distance} mi away</span>
              )}
            </div>
            <div className="h-32 relative">
              <MapContainer
                center={[
                  ((driverLocation?.lat || order.driver_lat) + order.delivery_lat) / 2,
                  ((driverLocation?.lng || order.driver_lng) + order.delivery_lng) / 2
                ]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* Driver Marker */}
                <Marker position={[driverLocation?.lat || order.driver_lat, driverLocation?.lng || order.driver_lng]}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">Driver</p>
                      <p>{order.driver_name || 'En route'}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Customer Marker */}
                <Marker position={[order.delivery_lat, order.delivery_lng]}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">{order.customer_name}</p>
                      <p>{order.delivery_address}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Route Line */}
                <Polyline
                  positions={[
                    [driverLocation?.lat || order.driver_lat, driverLocation?.lng || order.driver_lng],
                    [order.delivery_lat, order.delivery_lng]
                  ]}
                  color="#f97316"
                  weight={2}
                  opacity={0.6}
                  dashArray="5, 5"
                />
              </MapContainer>
            </div>
          </div>
        )}
      </div>

      {/* Out for Delivery Map - Always show when status is out_for_delivery */}
      {order.status === 'out_for_delivery' && (driverLocation || order.driver_lat) && order.delivery_lat && order.delivery_lng && (
        <div className="border-t border-emerald-100">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm">Out for Delivery</p>
                {order.driver_name && <p className="text-xs opacity-90">{order.driver_name}</p>}
              </div>
            </div>
            {distance && (
              <div className="text-right">
                <p className="text-xl font-bold">{distance}</p>
                <p className="text-[10px] opacity-90">miles away</p>
              </div>
            )}
          </div>
          
          <div className="h-64 relative">
            <MapContainer
              center={[
                ((driverLocation?.lat || order.driver_lat) + order.delivery_lat) / 2,
                ((driverLocation?.lng || order.driver_lng) + order.delivery_lng) / 2
              ]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {/* Driver Marker */}
              <Marker position={[driverLocation?.lat || order.driver_lat, driverLocation?.lng || order.driver_lng]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold">{order.driver_name || 'Driver'}</p>
                    <p className="text-xs">Current Location</p>
                  </div>
                </Popup>
              </Marker>

              {/* Customer Marker */}
              <Marker position={[order.delivery_lat, order.delivery_lng]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold">{order.customer_name}</p>
                    <p className="text-xs">{order.delivery_address}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Route Line */}
              <Polyline
                positions={[
                  [driverLocation?.lat || order.driver_lat, driverLocation?.lng || order.driver_lng],
                  [order.delivery_lat, order.delivery_lng]
                ]}
                color="#f97316"
                weight={3}
                opacity={0.7}
                dashArray="10, 10"
              />
            </MapContainer>

            {/* ETA Overlay */}
            {order.eta_minutes && (
              <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-orange-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-[10px] text-gray-600">ETA</p>
                    <p className="text-sm font-bold text-orange-600">{order.eta_minutes} min</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-emerald-100 bg-emerald-50/50 p-3 space-y-3">
          {/* Customer Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-900">Customer</p>
            </div>
            <div className="pl-6 space-y-1">
              <p className="text-xs text-emerald-800">
                {order.customer_name || 'N/A'}
              </p>
              {order.customer_email && (
                <p className="text-xs text-emerald-600">{order.customer_email}</p>
              )}
              {order.customer_phone && (
                <p className="text-xs text-emerald-600">{order.customer_phone}</p>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          {order.delivery_address && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-900">Delivery Address</p>
              </div>
              <div className="pl-6">
                <p className="text-xs text-emerald-700">{order.delivery_address}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation('apple')}
                    className="h-7 text-xs"
                  >
                    Apple Maps
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation('google')}
                    className="h-7 text-xs"
                  >
                    Google Maps
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-900">Items ({order.items?.length || 0})</p>
            </div>
            <div className="pl-6 space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-white rounded-lg p-2 border border-emerald-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-emerald-900 font-medium truncate">{item.name}</p>
                      <p className="text-emerald-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-emerald-900 font-semibold ml-2">${item.price?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="pl-6 pt-2 border-t border-emerald-200">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-emerald-700">Subtotal:</span>
              <span className="text-emerald-900">${order.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-700">Discount:</span>
                <span className="text-red-600">-${order.discount?.toFixed(2)}</span>
              </div>
            )}
            {order.fees > 0 && (
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-700">Fees:</span>
                <span className="text-emerald-900">${order.fees?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-emerald-200">
              <span className="text-emerald-900">Total:</span>
              <span className="text-emerald-900">${order.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="pl-6 pt-2">
              <p className="text-xs font-semibold text-emerald-900 mb-1">Notes:</p>
              <p className="text-xs text-emerald-700 bg-white rounded p-2 border border-emerald-200">
                {order.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}