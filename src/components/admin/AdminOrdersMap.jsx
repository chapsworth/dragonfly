import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Navigation, Package, User, MapPin, Clock, ChevronDown, ChevronUp, Route, Zap, X, Maximize2, Minimize2 } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const makeIcon = (emoji, bg = '#3b82f6') =>
  L.divIcon({
    className: 'custom-emoji-icon',
    html: `<div style="width:32px;height:32px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:${bg};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-size:18px;">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });

const deliveryIcon = makeIcon('🏠', '#10b981');
const driverIcon = makeIcon('🚗', '#3b82f6');
const customerIcon = makeIcon('📱', '#8b5cf6');

export default function AdminOrdersMap({ orders, onOrderSelect, selectedOrderId }) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [flashingId, setFlashingId] = useState(null);
  const [routeMode, setRouteMode] = useState('single'); // 'single', 'multiple'
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routeLines, setRouteLines] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showCustomers, setShowCustomers] = useState(true);
  const [showDeliveryLocations, setShowDeliveryLocations] = useState(true);

  // Update selected order when external selection changes
  React.useEffect(() => {
    if (selectedOrderId) {
      const order = activeOrders.find(o => o.id === selectedOrderId);
      if (order) {
        setSelectedOrder(order);
        setFlashingId(selectedOrderId);
        setTimeout(() => setFlashingId(null), 600);
      }
    }
  }, [selectedOrderId]);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setFlashingId(order.id);
    setTimeout(() => setFlashingId(null), 600);
    onOrderSelect?.(order.id);
    
    // If in single mode, fetch route for this order
    if (routeMode === 'single' && order.driver_lat && order.driver_lng) {
      fetchSingleRoute(order);
    }
  };

  // Fetch single order route
  const fetchSingleRoute = async (order) => {
    if (!order.driver_lat || !order.driver_lng || !order.delivery_lat || !order.delivery_lng) return;
    
    setIsOptimizing(true);
    try {
      const response = await base44.functions.invoke('getOptimizedRoute', {
        origin: `${order.driver_lat},${order.driver_lng}`,
        destinations: [`${order.delivery_lat},${order.delivery_lng}`]
      });
      
      if (response.data?.routes?.[0]) {
        const route = response.data.routes[0];
        setRouteLines([{
          coordinates: decodePolyline(route.overview_polyline),
          color: '#3b82f6',
          order: order
        }]);
      }
    } catch (error) {
      console.error('Route fetch error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Optimize route for multiple deliveries
  const optimizeMultipleRoute = async () => {
    const deliveryOrders = activeOrders.filter(o => o.driver_lat && o.driver_lng && o.delivery_lat && o.delivery_lng);
    
    if (deliveryOrders.length === 0) {
      toast.error('No orders with driver locations available');
      return;
    }

    setIsOptimizing(true);
    try {
      // Use first driver's location as origin
      const origin = `${deliveryOrders[0].driver_lat},${deliveryOrders[0].driver_lng}`;
      const destinations = deliveryOrders.map(o => `${o.delivery_lat},${o.delivery_lng}`);
      
      const response = await base44.functions.invoke('getOptimizedRoute', {
        origin,
        destinations
      });
      
      if (response.data?.routes) {
        const routes = response.data.routes.map((route, idx) => ({
          coordinates: decodePolyline(route.overview_polyline),
          color: `hsl(${idx * 60}, 70%, 50%)`,
          order: deliveryOrders[idx]
        }));
        setRouteLines(routes);
        setOptimizedRoute(response.data);
        toast.success(`Optimized route for ${deliveryOrders.length} deliveries`);
      }
    } catch (error) {
      console.error('Route optimization error:', error);
      toast.error('Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Decode Google polyline
  const decodePolyline = (encoded) => {
    if (!encoded) return [];
    const points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  };

  // Auto-fetch route when mode changes
  useEffect(() => {
    if (routeMode === 'single' && selectedOrder) {
      fetchSingleRoute(selectedOrder);
    } else if (routeMode === 'multiple') {
      optimizeMultipleRoute();
    } else {
      setRouteLines([]);
    }
  }, [routeMode]);

  // Filter orders with valid coordinates
  const activeOrders = orders.filter(o => 
    o.delivery_lat && o.delivery_lng
  );

  if (activeOrders.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/40">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No active deliveries to display on map</p>
      </div>
    );
  }

  // Calculate map center (average of all delivery locations)
  const avgLat = activeOrders.reduce((sum, o) => sum + o.delivery_lat, 0) / activeOrders.length;
  const avgLng = activeOrders.reduce((sum, o) => sum + o.delivery_lng, 0) / activeOrders.length;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className={`bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 overflow-hidden shadow-lg mb-6 ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : ''}`}>
      {/* Route Controls */}
      <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-emerald-900">Route View:</span>
          </div>
          <Select value={routeMode} onValueChange={setRouteMode}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Routes</SelectItem>
              <SelectItem value="single">Single Order Route</SelectItem>
              <SelectItem value="multiple">Multi-Delivery Optimization</SelectItem>
            </SelectContent>
          </Select>
          
          {routeMode === 'multiple' && (
            <Button
              onClick={optimizeMultipleRoute}
              disabled={isOptimizing}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              <Zap className="w-4 h-4 mr-1" />
              {isOptimizing ? 'Optimizing...' : 'Re-optimize'}
            </Button>
          )}

          {routeMode === 'single' && selectedOrder && (
            <Button
              onClick={() => fetchSingleRoute(selectedOrder)}
              disabled={isOptimizing}
              size="sm"
              variant="outline"
            >
              <Navigation className="w-4 h-4 mr-1" />
              {isOptimizing ? 'Loading...' : 'Refresh Route'}
            </Button>
          )}

          {routeLines.length > 0 && (
            <Badge variant="secondary">
              {routeLines.length} route{routeLines.length > 1 ? 's' : ''} shown
            </Badge>
          )}

          <div className="ml-auto flex items-center gap-3">
            <div className="flex gap-2 bg-white/80 rounded-lg px-3 py-1 border">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDeliveryLocations}
                  onChange={(e) => setShowDeliveryLocations(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="text-sm">🏠 Delivery</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDrivers}
                  onChange={(e) => setShowDrivers(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">🚗 Drivers</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCustomers}
                  onChange={(e) => setShowCustomers(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span className="text-sm">📱 Customers</span>
              </label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="gap-2"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  Fullscreen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className={`relative ${isFullscreen ? 'h-[calc(100vh-73px)]' : 'h-[600px]'}`}>
        <MapContainer
          center={[avgLat, avgLng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Route Lines */}
          {routeLines.map((route, idx) => (
            <Polyline
              key={idx}
              positions={route.coordinates}
              color={route.color}
              weight={4}
              opacity={0.7}
            />
          ))}

          {activeOrders.map((order) => (
            <React.Fragment key={order.id}>
              {/* Delivery Location */}
              {showDeliveryLocations && (
                <Marker 
                  position={[order.delivery_lat, order.delivery_lng]} 
                  icon={deliveryIcon}
                  eventHandlers={{
                    click: () => handleOrderClick(order)
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <p className="font-bold text-emerald-900 mb-1">
                        🏠 Delivery Location
                      </p>
                      <p className="text-sm text-gray-700 mb-1">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-700 mb-2">{order.customer_name}</p>
                      <Badge className={statusColors[order.status]}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Driver Location (if available) */}
              {showDrivers && order.driver_lat && order.driver_lng && (
                <Marker 
                  position={[order.driver_lat, order.driver_lng]} 
                  icon={driverIcon}
                  eventHandlers={{
                    click: () => handleOrderClick(order)
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <p className="font-bold text-blue-900 mb-1">
                        🚗 {order.driver_name || 'Driver'}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        Delivering to {order.customer_name}
                      </p>
                      {order.eta_minutes && (
                        <p className="text-xs text-gray-600">ETA: {order.eta_minutes} min</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Customer Real-time Location (if available) */}
              {showCustomers && order.customer_lat && order.customer_lng && (
                <Marker 
                  position={[order.customer_lat, order.customer_lng]} 
                  icon={customerIcon}
                  eventHandlers={{
                    click: () => handleOrderClick(order)
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <p className="font-bold text-purple-900 mb-1">
                        📱 {order.customer_name}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">Customer Location (Live)</p>
                      <Badge className={statusColors[order.status]}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          ))}
        </MapContainer>

        {/* Dropdown Panel */}
        <div className="absolute top-4 right-4 z-[1000] w-80 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/40 overflow-hidden">
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold"
          >
            <span>Active Deliveries ({activeOrders.length})</span>
            {isPanelOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {isPanelOpen && (
            <div className="max-h-96 overflow-y-auto">
              {activeOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className={`w-full p-3 border-b border-gray-100 hover:bg-emerald-50 transition-all text-left ${
                    selectedOrder?.id === order.id ? 'bg-emerald-50' : ''
                  } ${flashingId === order.id ? 'animate-pulse bg-emerald-100' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-emerald-900 text-sm truncate">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{order.customer_name}</p>
                    </div>
                    <Badge className={`${statusColors[order.status]} text-xs`}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {order.driver_name && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3 h-3" />
                      <span className="truncate">{order.driver_name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Order Details Panel */}
        {selectedOrder && (
          <div className="absolute bottom-4 left-4 z-[1000] w-96 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/40 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-emerald-900 text-lg">
                  Order #{selectedOrder.id.slice(0, 8)}
                </h3>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedOrder.created_date), 'MMM d, h:mm a')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedOrder(null)}
                className="h-8 w-8 rounded-full hover:bg-gray-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Customer Info */}
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs font-semibold text-emerald-700 mb-1">Customer</p>
                <p className="font-semibold text-emerald-900">{selectedOrder.customer_name}</p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  {selectedOrder.customer_phone && (
                    <a href={`tel:${selectedOrder.customer_phone}`} className="flex items-center gap-1 text-emerald-600 hover:underline">
                      <Phone className="w-3 h-3" />
                      {selectedOrder.customer_phone}
                    </a>
                  )}
                  {selectedOrder.customer_email && (
                    <a href={`mailto:${selectedOrder.customer_email}`} className="flex items-center gap-1 text-emerald-600 hover:underline">
                      <Mail className="w-3 h-3" />
                      Email
                    </a>
                  )}
                </div>
              </div>

              {/* Driver Info */}
              {selectedOrder.driver_name && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Driver</p>
                  <p className="font-semibold text-blue-900">{selectedOrder.driver_name}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    {selectedOrder.driver_phone && (
                      <a href={`tel:${selectedOrder.driver_phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Phone className="w-3 h-3" />
                        {selectedOrder.driver_phone}
                      </a>
                    )}
                    {selectedOrder.eta_minutes && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Clock className="w-3 h-3" />
                        ETA: {selectedOrder.eta_minutes} min
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-1">Delivery Address</p>
                <p className="text-sm text-gray-900">{selectedOrder.delivery_address}</p>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Items ({selectedOrder.items?.length || 0})</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.quantity}x {item.name}</span>
                      <span className="font-semibold text-emerald-600">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-emerald-600">${selectedOrder.total.toFixed(2)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const destination = selectedOrder.delivery_lat && selectedOrder.delivery_lng
                      ? `${selectedOrder.delivery_lat},${selectedOrder.delivery_lng}`
                      : encodeURIComponent(selectedOrder.delivery_address);
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                  }}
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Navigate
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500"
                  onClick={() => {
                    window.location.href = `/OrderTracking?id=${selectedOrder.id}`;
                  }}
                >
                  View Tracking
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}