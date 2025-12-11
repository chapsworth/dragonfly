import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Navigation, Phone, MessageSquare, CheckCircle, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const driverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzEwYjk4MSIvPjxwYXRoIGQ9Ik0yMCA4TDI0IDE2SDE2TDIwIDhaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI2VmNDQ0NCIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function DeliveryNavigation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');

  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.list();
      return orders.find(o => o.id === orderId);
    },
    enabled: !!orderId,
    refetchInterval: 5000
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (location) => {
      return base44.functions.invoke('updateDriverLocation', {
        orderId,
        driver_lat: location.lat,
        driver_lng: location.lng
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    }
  });

  const markDeliveredMutation = useMutation({
    mutationFn: () => base44.entities.Order.update(orderId, { status: 'delivered' }),
    onSuccess: () => {
      toast.success('Order marked as delivered!');
      setTimeout(() => navigate(createPageUrl('AdminOrders')), 2000);
    }
  });

  useEffect(() => {
    if (navigator.geolocation && isTracking) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          updateLocationMutation.mutate(location);
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isTracking]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    }
  }, []);

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-600">Loading delivery...</p>
        </div>
      </div>
    );
  }

  const destination = {
    lat: order.delivery_lat || 0,
    lng: order.delivery_lng || 0
  };

  const mapCenter = currentLocation || destination;

  const calculateDistance = () => {
    if (!currentLocation || !destination.lat) return null;
    const R = 6371; // Earth radius in km
    const dLat = (destination.lat - currentLocation.lat) * Math.PI / 180;
    const dLon = (destination.lng - currentLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(currentLocation.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  const distance = calculateDistance();

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Map */}
      <div className="flex-1 relative">
        {destination.lat !== 0 && (
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapUpdater center={[mapCenter.lat, mapCenter.lng]} zoom={15} />
            
            {currentLocation && (
              <Marker position={[currentLocation.lat, currentLocation.lng]} icon={driverIcon}>
                <Popup>Your Location</Popup>
              </Marker>
            )}
            
            <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
              <Popup>{order.delivery_address}</Popup>
            </Marker>

            {currentLocation && destination.lat && (
              <Polyline
                positions={[
                  [currentLocation.lat, currentLocation.lng],
                  [destination.lat, destination.lng]
                ]}
                color="#10b981"
                weight={4}
                dashArray="10, 10"
              />
            )}
          </MapContainer>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate(createPageUrl('AdminOrders'))}
          className="absolute top-4 left-4 z-[1000] p-3 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Tracking Toggle */}
        <button
          onClick={() => setIsTracking(!isTracking)}
          className={`absolute top-4 right-4 z-[1000] px-4 py-2 rounded-full shadow-lg font-semibold ${
            isTracking 
              ? 'bg-emerald-500 text-white' 
              : 'bg-white text-gray-700'
          }`}
        >
          {isTracking ? '✓ Tracking On' : 'Start Tracking'}
        </button>
      </div>

      {/* Bottom Card */}
      <Card className="rounded-t-3xl shadow-2xl border-t-4 border-emerald-500 max-h-[40vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Distance & ETA */}
          {distance && (
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="text-2xl font-bold text-emerald-600">{distance} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">ETA</p>
                  <p className="text-2xl font-bold text-blue-600">{Math.ceil(parseFloat(distance) * 3)} min</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivering to</p>
                <p className="text-xl font-bold">{order.customer_name}</p>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${order.customer_phone}`}>
                  <Button size="icon" className="bg-green-500 hover:bg-green-600 rounded-full">
                    <Phone className="w-5 h-5" />
                  </Button>
                </a>
                <a href={`sms:${order.customer_phone}`}>
                  <Button size="icon" className="bg-blue-500 hover:bg-blue-600 rounded-full">
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                </a>
              </div>
            </div>
            <p className="text-gray-600 text-sm">{order.delivery_address}</p>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            <p className="font-semibold text-gray-700">Order Items</p>
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded" />
                  )}
                  <span className="text-sm">{item.name} x{item.quantity}</span>
                </div>
                <span className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-emerald-600">${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Complete Delivery Button */}
          {distance && parseFloat(distance) < 0.1 && (
            <Button
              onClick={() => markDeliveredMutation.mutate()}
              disabled={markDeliveredMutation.isPending}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-lg font-bold"
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              {markDeliveredMutation.isPending ? 'Completing...' : 'Complete Delivery'}
            </Button>
          )}

          {order.notes && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800 mb-1">Delivery Notes:</p>
              <p className="text-sm text-yellow-700">{order.notes}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}