import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Navigation, Package, User, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
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

const customerIcon = makeIcon('🏠', '#10b981');
const driverIcon = makeIcon('🚗', '#3b82f6');

export default function AdminOrdersMap({ orders, onOrderSelect, selectedOrderId }) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [flashingId, setFlashingId] = useState(null);

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
  };

  // Filter orders with valid coordinates
  const activeOrders = orders.filter(o => 
    (o.status === 'out_for_delivery' || o.status === 'preparing') &&
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
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 overflow-hidden shadow-lg mb-6">
      {/* Map Container */}
      <div className="relative h-96">
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

          {activeOrders.map((order) => (
            <React.Fragment key={order.id}>
              {/* Customer/Delivery Location */}
              <Marker 
                position={[order.delivery_lat, order.delivery_lng]} 
                icon={customerIcon}
                eventHandlers={{
                  click: () => handleOrderClick(order)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <p className="font-bold text-emerald-900 mb-1">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">{order.customer_name}</p>
                    <Badge className={statusColors[order.status]}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </Popup>
              </Marker>

              {/* Driver Location (if available) */}
              {order.driver_lat && order.driver_lng && (
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
                        {order.driver_name || 'Driver'}
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
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
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