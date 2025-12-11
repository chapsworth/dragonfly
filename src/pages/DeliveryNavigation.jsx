import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Navigation, Phone, MessageSquare, CheckCircle, Play, Pause, Route, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import DirectionsPanel from '@/components/delivery/DirectionsPanel.jsx';
import WeatherWidget from '@/components/delivery/WeatherWidget.jsx';
import AirQualityWidget from '@/components/delivery/AirQualityWidget.jsx';
import MultiDeliveryManager from '@/components/delivery/MultiDeliveryManager.jsx';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
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
}

export default function DeliveryNavigation() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [optimizeBy, setOptimizeBy] = useState('distance');
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [routeData, setRouteData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Fetch driver's orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['driverOrders'],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.list('-created_date');
      return allOrders.filter(o => 
        o.driver_email === user?.email && 
        (o.status === 'out_for_delivery' || o.status === 'preparing')
      );
    },
    enabled: !!user,
    refetchInterval: 30000
  });

  // Optimize route when orders change
  useEffect(() => {
    if (orders.length > 0 && driverLocation && !routeData) {
      optimizeRoute();
    }
  }, [orders, driverLocation]);

  // Fetch weather and air quality for current location
  useEffect(() => {
    if (driverLocation) {
      fetchWeatherAndAirQuality(driverLocation.lat, driverLocation.lng);
    }
  }, [driverLocation]);

  const optimizeRoute = async () => {
    if (!driverLocation || orders.length === 0) return;

    try {
      const destinations = orders.map(order => ({
        lat: order.delivery_lat,
        lng: order.delivery_lng,
        orderId: order.id
      }));

      const response = await base44.functions.invoke('optimizeRoute', {
        origin: driverLocation,
        destinations,
        optimizeBy
      });

      if (response.data.status === 'success') {
        setRouteData(response.data);
        toast.success('Route optimized!');
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
      toast.error('Failed to optimize route');
    }
  };

  const fetchWeatherAndAirQuality = async (lat, lng) => {
    try {
      const response = await base44.functions.invoke('getWeatherAndAirQuality', { lat, lng });
      if (response.data.status === 'success') {
        setWeatherData(response.data.weather);
        setAirQualityData(response.data.airQuality);
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  const updateLocationMutation = useMutation({
    mutationFn: async ({ orderId, lat, lng }) => {
      return base44.functions.invoke('updateDriverLocation', {
        orderId,
        driverLat: lat,
        driverLng: lng
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverOrders'] });
    }
  });

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setDriverLocation(newLocation);

        const currentOrder = orders[currentOrderIndex];
        if (currentOrder) {
          updateLocationMutation.mutate({
            orderId: currentOrder.id,
            lat: newLocation.lat,
            lng: newLocation.lng
          });
        }
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Failed to get location');
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    setWatchId(id);
    setIsTracking(true);
    toast.success('Location tracking started');
  };

  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    toast.success('Location tracking stopped');
  };

  const completeDeliveryMutation = useMutation({
    mutationFn: async (order) => {
      await base44.entities.Order.update(order.id, { 
        status: 'delivered',
        driver_lat: driverLocation?.lat,
        driver_lng: driverLocation?.lng
      });
      
      await base44.functions.invoke('sendOrderEmail', {
        orderId: order.id,
        status: 'delivered',
        customerEmail: order.customer_email,
        customerName: order.customer_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverOrders'] });
      toast.success('Delivery completed!');
      
      // Move to next order
      if (currentOrderIndex < orders.length - 1) {
        setCurrentOrderIndex(currentOrderIndex + 1);
        setCurrentStepIndex(0);
      }
    }
  });

  const handleCompleteDelivery = (order) => {
    if (confirm(`Mark delivery for ${order.customer_name} as completed?`)) {
      completeDeliveryMutation.mutate(order);
    }
  };

  const handleNavigateToOrder = (order) => {
    const index = orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      setCurrentOrderIndex(index);
      setCurrentStepIndex(0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">No Active Deliveries</h2>
          <p className="text-emerald-600">You don't have any deliveries assigned at the moment.</p>
        </Card>
      </div>
    );
  }

  const currentOrder = orders[currentOrderIndex];
  const mapCenter = driverLocation || (currentOrder ? [currentOrder.delivery_lat, currentOrder.delivery_lng] : [40.7128, -74.0060]);
  const routePolyline = routeData?.polyline ? decodePolyline(routeData.polyline) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Delivery Navigation</h1>
            <p className="text-sm text-emerald-600">
              {orders.filter(o => o.status === 'delivered').length} of {orders.length} deliveries completed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={optimizeBy === 'distance' ? 'default' : 'outline'}
              onClick={() => {
                setOptimizeBy('distance');
                setRouteData(null);
              }}
            >
              <Route className="w-4 h-4 mr-1" />
              Shortest
            </Button>
            <Button
              size="sm"
              variant={optimizeBy === 'time' ? 'default' : 'outline'}
              onClick={() => {
                setOptimizeBy('time');
                setRouteData(null);
              }}
            >
              <Clock className="w-4 h-4 mr-1" />
              By Order
            </Button>
            <Button
              size="sm"
              variant={isTracking ? 'destructive' : 'default'}
              onClick={isTracking ? stopTracking : startTracking}
            >
              {isTracking ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isTracking ? 'Stop' : 'Start'} Tracking
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-[500px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater center={mapCenter} zoom={13} />

              {driverLocation && (
                <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                  <Popup>Your Location</Popup>
                </Marker>
              )}

              {orders.map((order, index) => (
                <Marker
                  key={order.id}
                  position={[order.delivery_lat, order.delivery_lng]}
                  icon={destinationIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-bold">{index + 1}. {order.customer_name}</p>
                      <p className="text-sm">{order.delivery_address}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {routePolyline.length > 0 && (
                <Polyline positions={routePolyline} color="#10b981" weight={4} opacity={0.7} />
              )}
            </MapContainer>
          </div>

          {/* Directions Panel */}
          <DirectionsPanel
            directions={routeData?.directions}
            currentLegIndex={currentOrderIndex}
            currentStepIndex={currentStepIndex}
          />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-4">
          {/* Weather & Air Quality */}
          <div className="grid grid-cols-1 gap-4">
            <WeatherWidget weather={weatherData} isLoading={!weatherData && !!driverLocation} />
            <AirQualityWidget airQuality={airQualityData} isLoading={!airQualityData && !!driverLocation} />
          </div>

          {/* Multi-Delivery Manager */}
          <MultiDeliveryManager
            orders={orders}
            currentOrderIndex={currentOrderIndex}
            onSelectOrder={handleNavigateToOrder}
            onCompleteDelivery={handleCompleteDelivery}
            onNavigateToOrder={handleNavigateToOrder}
          />
        </div>
      </div>
    </div>
  );
}