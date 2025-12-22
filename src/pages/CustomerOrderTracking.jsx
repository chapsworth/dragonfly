import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MessageSquare, MapPin, Clock, Truck, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const deliveryIcon = L.divIcon({
  html: `<div style="width:40px;height:40px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:#10b981;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:24px;">🏠</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -32],
});

const driverIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-12 h-12 rounded-full shadow-xl flex items-center justify-center bg-blue-600 border-4 border-white">
        <span class="text-white text-2xl">🚗</span>
      </div>
      <div class="absolute inset-0 w-full h-full rounded-full animate-ping bg-blue-600 opacity-50"></div>
    </div>
  `,
  className: 'driver-marker',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
});

function MapController({ center, zoom }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function CustomerOrderTracking() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => base44.entities.Order.list().then(orders => orders.find(o => o.id === orderId)),
    enabled: !!orderId,
    refetchInterval: (data) => data?.status === 'out_for_delivery' ? 10000 : false
  });

  const [distance, setDistance] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom] = useState(14);

  // Calculate distance between driver and delivery location
  useEffect(() => {
    if (order?.driver_lat && order?.driver_lng && order?.delivery_lat && order?.delivery_lng) {
      const R = 6371; // km
      const dLat = (order.delivery_lat - order.driver_lat) * Math.PI / 180;
      const dLon = (order.delivery_lng - order.driver_lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(order.driver_lat * Math.PI / 180) * Math.cos(order.delivery_lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distKm = R * c;
      const distMiles = distKm * 0.621371;
      setDistance(distMiles);
      
      // Center map on delivery location
      setMapCenter([order.delivery_lat, order.delivery_lng]);
    } else if (order?.delivery_lat && order?.delivery_lng) {
      setMapCenter([order.delivery_lat, order.delivery_lng]);
    }
  }, [order?.driver_lat, order?.driver_lng, order?.delivery_lat, order?.delivery_lng]);

  const showDriver = distance !== null && distance <= 0.5; // Only show if within 0.5 miles

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-600 font-medium">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">We couldn't find this order. Please check your order number.</p>
          <Button onClick={() => navigate(createPageUrl('Orders'))} className="bg-emerald-600">
            View My Orders
          </Button>
        </Card>
      </div>
    );
  }

  const defaultMapCenter = mapCenter || [34.0522, -118.2437];

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-50">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={defaultMapCenter}
          zoom={mapZoom}
          style={{ height: '100vh', width: '100vw' }}
          zoomControl={false}
          attributionControl={false}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />

          {/* Delivery Location - Always shown */}
          {order.delivery_lat && order.delivery_lng && (
            <Marker position={[order.delivery_lat, order.delivery_lng]} icon={deliveryIcon}>
              <Popup>
                <div className="text-center p-2">
                  <p className="font-bold text-emerald-600">Your Delivery Location</p>
                  <p className="text-sm text-gray-600">{order.delivery_address}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Driver Location - Only shown if within 0.5 miles */}
          {showDriver && order.driver_lat && order.driver_lng && (
            <Marker position={[order.driver_lat, order.driver_lng]} icon={driverIcon}>
              <Popup>
                <div className="text-center p-2">
                  <p className="font-bold text-blue-600">{order.driver_name || 'Your Driver'}</p>
                  {order.eta_minutes && <p className="text-sm">ETA: {order.eta_minutes} min</p>}
                  <p className="text-sm">{distance.toFixed(2)} miles away</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Orders'))}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Track Your Order</h1>
            <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl p-6 max-h-[70vh] overflow-y-auto">
        {order.status === 'out_for_delivery' ? (
          <>
            {showDriver ? (
              <>
                {/* Driver is nearby */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <Truck className="w-10 h-10 text-blue-600" />
                    <div className="absolute inset-0 w-full h-full rounded-full animate-ping bg-blue-400 opacity-50" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Driver Nearby!</h2>
                  <p className="text-gray-600">Your order will arrive soon</p>
                </div>

                {/* Distance & ETA */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
                    <Navigation className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-600 font-medium">Distance</p>
                    <p className="text-2xl font-bold text-blue-900">{distance.toFixed(2)} mi</p>
                  </div>
                  {order.eta_minutes && (
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center">
                      <Clock className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-sm text-emerald-600 font-medium">ETA</p>
                      <p className="text-2xl font-bold text-emerald-900">{order.eta_minutes} min</p>
                    </div>
                  )}
                </div>

                {/* Driver Info */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Your Driver</p>
                  <p className="text-lg font-bold text-gray-900 mb-3">{order.driver_name || 'Driver'}</p>
                  <div className="flex gap-2">
                    {order.driver_phone && (
                      <Button
                        onClick={() => window.location.href = `tel:${order.driver_phone}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call Driver
                      </Button>
                    )}
                    {order.driver_phone && (
                      <Button
                        onClick={() => {
                          const body = encodeURIComponent(`Hi, I'm tracking my order #${order.id.slice(0, 8)}`);
                          window.location.href = `sms:${order.driver_phone}?body=${body}`;
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Text
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Driver on the way but not within 0.5 miles */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">On The Way</h2>
                  <p className="text-gray-600">Your driver is heading to your location</p>
                </div>

                {order.eta_minutes && (
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 text-center mb-6">
                    <Clock className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                    <p className="text-sm text-emerald-600 font-medium mb-1">Estimated Arrival</p>
                    <p className="text-4xl font-bold text-emerald-900">{order.eta_minutes} min</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900">
                    <strong>📍 Tip:</strong> You'll be able to see your driver's live location once they're within half a mile of your address.
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Order not yet out for delivery */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order {order.status.replace(/_/g, ' ')}</h2>
              <p className="text-gray-600">We'll notify you when your order is out for delivery</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-sm text-gray-600 mb-2">Delivery Address</p>
              <p className="text-gray-900 font-medium">{order.delivery_address}</p>
            </div>
          </>
        )}

        {/* Order Items Summary */}
        {order.items && order.items.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 font-medium">Order Summary</p>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.quantity}× {item.name}</span>
                  <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-emerald-600">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}