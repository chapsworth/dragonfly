import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Navigation, MapPin, Clock, User, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom driver icon
const driverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#10b981"/>
      <path d="M12 16v-4"/>
      <path d="M12 8h.01"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Custom destination icon
const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#ef4444"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

export default function LiveMapTracking({ order }) {
  const [map, setMap] = useState(null);

  const driverLocation = order.driver_lat && order.driver_lng 
    ? [order.driver_lat, order.driver_lng] 
    : null;
  
  const deliveryLocation = order.delivery_lat && order.delivery_lng 
    ? [order.delivery_lat, order.delivery_lng] 
    : null;

  // Default center (use driver location, delivery location, or default)
  const center = driverLocation || deliveryLocation || [34.0522, -118.2437];

  useEffect(() => {
    if (map && driverLocation && deliveryLocation) {
      // Fit bounds to show both markers
      const bounds = L.latLngBounds([driverLocation, deliveryLocation]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, driverLocation, deliveryLocation]);

  if (!driverLocation && !deliveryLocation) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
        <MapPin className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
        <p className="text-emerald-700">Location tracking not available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Driver Info */}
      {order.driver_name && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">{order.driver_name}</p>
                {order.driver_phone && (
                  <a href={`tel:${order.driver_phone}`} className="text-sm text-emerald-100 flex items-center gap-1 hover:text-white">
                    <Phone className="w-3 h-3" />
                    {order.driver_phone}
                  </a>
                )}
              </div>
            </div>
            {order.eta_minutes && (
              <div className="text-right">
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Clock className="w-6 h-6" />
                  {order.eta_minutes} min
                </div>
                <p className="text-xs text-emerald-100">Estimated arrival</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border-4 border-white/40 shadow-2xl h-[400px]">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenCreated={setMap}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Driver Marker */}
          {driverLocation && (
            <>
              <Marker position={driverLocation} icon={driverIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-emerald-900">Your Driver</p>
                    {order.driver_name && <p className="text-sm text-emerald-600">{order.driver_name}</p>}
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={driverLocation}
                radius={100}
                pathOptions={{
                  color: '#10b981',
                  fillColor: '#10b981',
                  fillOpacity: 0.2
                }}
              />
            </>
          )}

          {/* Delivery Location Marker */}
          {deliveryLocation && (
            <>
              <Marker position={deliveryLocation} icon={destinationIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-emerald-900">Delivery Address</p>
                    <p className="text-sm text-emerald-600">{order.delivery_address}</p>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={deliveryLocation}
                radius={50}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.2
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-emerald-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span>Driver Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Delivery Address</span>
        </div>
      </div>
    </div>
  );
}