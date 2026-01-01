import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Phone, Mail, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function VendorOrderMap({ order, onClose }) {
  const [mapCenter] = useState([34.0522, -118.2437]); // Default to LA
  const [mapZoom] = useState(12);

  // Get customer location from order
  const customerLat = order.delivery_lat || order.customer_lat;
  const customerLng = order.delivery_lng || order.customer_lng;
  const hasLocation = customerLat && customerLng;

  const center = hasLocation ? [customerLat, customerLng] : mapCenter;

  const openInMaps = () => {
    if (hasLocation) {
      const url = `https://www.google.com/maps/search/?api=1&query=${customerLat},${customerLng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Order Location
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-3">
            {/* Map */}
            <div className="lg:col-span-2 h-96 lg:h-[600px]">
              {hasLocation ? (
                <MapContainer
                  center={center}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[customerLat, customerLng]} icon={customerIcon}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{order.customer_name || 'Customer'}</p>
                        <p className="text-gray-600">{order.delivery_address || order.customer_address}</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-semibold">No location available</p>
                    <p className="text-sm">Customer location not set for this order</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="p-6 bg-gray-50 overflow-y-auto max-h-96 lg:max-h-[600px]">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <p className="font-bold text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Badge>{order.status}</Badge>
                </div>

                {order.customer_name && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Customer</p>
                    <p className="font-semibold text-sm">{order.customer_name}</p>
                  </div>
                )}

                {order.customer_phone && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Phone className="w-3 h-3" />
                      {order.customer_phone}
                    </a>
                  </div>
                )}

                {order.customer_email && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Mail className="w-3 h-3" />
                      {order.customer_email}
                    </a>
                  </div>
                )}

                {(order.delivery_address || order.customer_address) && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                    <p className="text-sm">{order.delivery_address || order.customer_address}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 mb-2">Order Items</p>
                  <div className="space-y-1">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="text-sm flex justify-between">
                        <span className="text-gray-600">
                          {item.quantity}× {item.product_name}
                          {item.variant && ` - ${item.variant}`}
                        </span>
                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold text-emerald-600">${order.total?.toFixed(2)}</span>
                  </div>
                </div>

                {hasLocation && (
                  <Button
                    onClick={openInMaps}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Open in Google Maps
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}