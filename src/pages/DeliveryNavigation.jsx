import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, Navigation, Phone, MessageSquare, CheckCircle, MapPin, 
  Clock, Cloud, Wind, Eye, Droplets, AlertCircle, Navigation2, 
  Package, DollarSign, ListOrdered, Route, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import polyline from 'npm:@mapbox/polyline@1.2.1';
import ChatModal from '@/components/delivery/ChatModal';
import ChatButton from '@/components/delivery/ChatButton';
import DirectionsPanel from '@/components/delivery/DirectionsPanel';
import WeatherWidget from '@/components/delivery/WeatherWidget';
import AirQualityWidget from '@/components/delivery/AirQualityWidget';
import MultiDeliveryManager from '@/components/delivery/MultiDeliveryManager';

export default function DeliveryNavigation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const orderIds = urlParams.get('orderIds')?.split(',') || [];

  const [apiKey, setApiKey] = useState(null);

  useEffect(() => {
    // Fetch API key from backend function
    base44.functions.invoke('getGoogleMapsKey', {})
      .then(res => {
        setApiKey(res.data.key);
      })
      .catch(() => {
        console.error('Failed to load Google Maps API key');
        setApiKey('');
      });
  }, []);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries: ['places', 'geometry'],
    id: 'google-maps-script',
    preventGoogleFontsLoading: true
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [map, setMap] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [optimizeBy, setOptimizeBy] = useState('distance');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [chatOrder, setChatOrder] = useState(null);

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['delivery-orders', orderIds],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.list();
      return allOrders.filter(o => orderIds.includes(o.id));
    },
    enabled: orderIds.length > 0,
    refetchInterval: 5000
  });

  const { data: routeData, isLoading: routeLoading, refetch: refetchRoute } = useQuery({
    queryKey: ['optimized-route', currentLocation, optimizeBy, completedOrders],
    queryFn: async () => {
      if (!currentLocation) return null;
      
      const pendingOrders = orders.filter(o => !completedOrders.includes(o.id));
      if (pendingOrders.length === 0) return null;

      const destinations = pendingOrders.map(order => ({
        orderId: order.id,
        lat: order.delivery_lat,
        lng: order.delivery_lng,
        address: order.delivery_address,
        orderTime: order.created_date
      }));

      // Sort by time if optimizing by time
      if (optimizeBy === 'time') {
        destinations.sort((a, b) => new Date(a.orderTime) - new Date(b.orderTime));
      }

      const response = await base44.functions.invoke('getOptimizedRoute', {
        origin: currentLocation,
        destinations,
        optimizeBy
      });

      return response.data;
    },
    enabled: !!currentLocation && orders.length > 0,
    staleTime: 30000
  });

  const { data: weatherData } = useQuery({
    queryKey: ['weather', currentLocation],
    queryFn: async () => {
      if (!currentLocation) return null;
      try {
        const response = await base44.functions.invoke('getWeatherAndAirQuality', currentLocation);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!currentLocation,
    retry: false,
    refetchInterval: 300000 // 5 minutes
  });

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unread-messages'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        const allMessages = await base44.entities.ChatMessage.list();
        return allMessages.filter(m => !m.is_read && m.sender_email !== user.email);
      } catch {
        return [];
      }
    },
    retry: false,
    refetchInterval: 5000
  });

  const getUnreadCountForOrder = (orderId) => {
    return unreadMessages.filter(m => m.order_id === orderId).length;
  };

  const handleCallCustomer = (order) => {
    if (order.customer_phone) {
      window.location.href = `tel:${order.customer_phone}`;
    }
  };

  const handleOrderSelect = (index) => {
    setCurrentRouteIndex(index);
    setCurrentStepIndex(0);
  };

  const updateLocationMutation = useMutation({
    mutationFn: async (location) => {
      const updatePromises = orders
        .filter(o => !completedOrders.includes(o.id))
        .map(order => 
          base44.entities.Order.update(order.id, {
            driver_lat: location.lat,
            driver_lng: location.lng
          })
        );
      await Promise.all(updatePromises);
    }
  });

  const markDeliveredMutation = useMutation({
    mutationFn: (orderId) => base44.entities.Order.update(orderId, { status: 'delivered' }),
    onSuccess: (_, orderId) => {
      setCompletedOrders(prev => [...prev, orderId]);
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      toast.success('Order marked as delivered!');
      
      // Move to next route
      setCurrentRouteIndex(0);
      setCurrentStepIndex(0);
      
      // Check if all orders are complete
      if (completedOrders.length + 1 === orders.length) {
        toast.success('All deliveries complete!');
        setTimeout(() => navigate(createPageUrl('AdminOrders')), 2000);
      }
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
  }, [isTracking, orders, completedOrders]);

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

  const pendingOrders = useMemo(() => 
    orders.filter(o => !completedOrders.includes(o.id)),
    [orders, completedOrders]
  );

  const currentOrder = useMemo(() => {
    if (!routeData || !routeData.routes || currentRouteIndex >= routeData.routes.length) return null;
    const route = routeData.routes[currentRouteIndex];
    return orders.find(o => o.id === route.orderId);
  }, [routeData, currentRouteIndex, orders]);

  const currentSteps = useMemo(() => {
    if (!routeData || !routeData.routes || currentRouteIndex >= routeData.routes.length) return [];
    return routeData.routes[currentRouteIndex].steps || [];
  }, [routeData, currentRouteIndex]);

  const routePolyline = useMemo(() => {
    if (!routeData || !routeData.polyline) return [];
    try {
      const decoded = polyline.decode(routeData.polyline);
      return decoded.map(([lat, lng]) => ({ lat, lng }));
    } catch (e) {
      console.error('Error decoding polyline:', e);
      return [];
    }
  }, [routeData]);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  useEffect(() => {
    if (map && currentLocation && pendingOrders.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng));
      pendingOrders.forEach(order => {
        bounds.extend(new window.google.maps.LatLng(order.delivery_lat, order.delivery_lng));
      });
      map.fitBounds(bounds, 50);
    }
  }, [map, currentLocation, pendingOrders]);

  const aqiColor = (level) => {
    const colors = {
      'Good': 'bg-green-500',
      'Fair': 'bg-yellow-500',
      'Moderate': 'bg-orange-500',
      'Poor': 'bg-red-500',
      'Very Poor': 'bg-purple-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  if (ordersLoading || !apiKey || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-emerald-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Map */}
      <div className="flex-1 relative">
        {currentLocation && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={{ lat: currentLocation.lat, lng: currentLocation.lng }}
            zoom={13}
            onLoad={onMapLoad}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false
            }}
          >
            {/* Driver location */}
            <Marker 
              position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
              icon={{
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzEwYjk4MSIvPjxwYXRoIGQ9Ik0yMCA4TDI0IDE2SDE2TDIwIDhaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 20)
              }}
              onClick={() => setSelectedMarker('driver')}
            />
            {selectedMarker === 'driver' && (
              <InfoWindow
                position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="text-sm font-semibold">Your Location</div>
              </InfoWindow>
            )}
            
            {/* Delivery destinations */}
            {pendingOrders.map((order, idx) => (
              <React.Fragment key={order.id}>
                <Marker 
                  position={{ lat: order.delivery_lat, lng: order.delivery_lng }}
                  icon={{
                    url: `data:image/svg+xml;base64,${btoa(`<svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 30 20 30s20-16 20-30c0-11.046-8.954-20-20-20z" fill="#ef4444"/><circle cx="20" cy="20" r="10" fill="white"/><text x="20" y="26" text-anchor="middle" font-size="14" font-weight="bold" fill="#ef4444">${idx + 1}</text></svg>`)}`,
                    scaledSize: new window.google.maps.Size(40, 50),
                    anchor: new window.google.maps.Point(20, 50)
                  }}
                  onClick={() => setSelectedMarker(order.id)}
                />
                {selectedMarker === order.id && (
                  <InfoWindow
                    position={{ lat: order.delivery_lat, lng: order.delivery_lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="text-sm">
                      <p className="font-bold">{order.customer_name}</p>
                      <p>{order.delivery_address}</p>
                      <p className="text-emerald-600 font-bold">${order.total.toFixed(2)}</p>
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            ))}

            {/* Route polyline */}
            {routePolyline.length > 0 && (
              <Polyline
                path={routePolyline}
                options={{
                  strokeColor: '#10b981',
                  strokeWeight: 4,
                  strokeOpacity: 0.8
                }}
              />
            )}
          </GoogleMap>
        )}

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-2">
          <Button
            onClick={() => navigate(createPageUrl('AdminOrders'))}
            size="icon"
            className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Select value={optimizeBy} onValueChange={(v) => { setOptimizeBy(v); refetchRoute(); }}>
            <SelectTrigger className="w-[180px] bg-white shadow-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Shortest Route</SelectItem>
              <SelectItem value="time">Order Time Priority</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIsTracking(!isTracking)}
            className={`shadow-lg ${isTracking ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
          >
            <Navigation2 className="w-4 h-4 mr-2" />
            {isTracking ? 'Tracking On' : 'Start Tracking'}
          </Button>

          {weatherData && (
            <div className="ml-auto flex gap-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-500" />
                <div className="text-sm">
                  <p className="font-bold">{weatherData.weather.temp}°F</p>
                  <p className="text-xs text-gray-600">{weatherData.weather.condition}</p>
                </div>
              </div>
              <div className={`${aqiColor(weatherData.airQuality.level)} text-white rounded-lg px-3 py-2 shadow-lg`}>
                <p className="text-xs font-semibold">AQI</p>
                <p className="text-sm font-bold">{weatherData.airQuality.level}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bg-white rounded-t-3xl shadow-2xl border-t-4 border-emerald-500 max-h-[60vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Route Summary */}
          {routeData && (
            <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-2 flex-1">
                <Route className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {(routeData.totalDistance / 1609.34).toFixed(1)} mi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Clock className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Time</p>
                  <p className="text-xl font-bold text-blue-600">
                    {Math.ceil(routeData.totalDuration / 60)} min
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Package className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Deliveries</p>
                  <p className="text-xl font-bold text-purple-600">
                    {completedOrders.length}/{orders.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Delivery Manager */}
          <MultiDeliveryManager
            orders={pendingOrders}
            currentOrderIndex={currentRouteIndex}
            completedOrders={completedOrders}
            onOrderSelect={handleOrderSelect}
            onCallCustomer={handleCallCustomer}
          />

          {/* Current Delivery Details */}
          {currentOrder && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500">Current Stop</Badge>
                  <h3 className="font-bold text-lg">{currentOrder.customer_name}</h3>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${currentOrder.customer_phone}`}>
                    <Button size="icon" className="bg-green-500 hover:bg-green-600 rounded-full">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </a>
                  <a href={`sms:${currentOrder.customer_phone}`}>
                    <Button size="icon" className="bg-blue-500 hover:bg-blue-600 rounded-full">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </a>
                  <ChatButton 
                    onClick={() => setChatOrder(currentOrder)}
                    unreadCount={getUnreadCountForOrder(currentOrder.id)}
                  />
                </div>
              </div>

              {/* Turn-by-Turn Directions */}
              {currentSteps.length > 0 && (
                <DirectionsPanel
                  steps={currentSteps}
                  currentStepIndex={currentStepIndex}
                  onStepChange={setCurrentStepIndex}
                  destination={currentOrder.delivery_address}
                />
              )}

              {/* Order Items */}
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-sm">Order Items</p>
                {currentOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total</span>
                  <span className="text-emerald-600">${currentOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Complete Delivery Button */}
              <Button
                onClick={() => markDeliveredMutation.mutate(currentOrder.id)}
                disabled={markDeliveredMutation.isPending}
                className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-lg font-bold"
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                {markDeliveredMutation.isPending ? 'Completing...' : 'Complete Delivery'}
              </Button>
            </div>
          )}

          {/* Remaining Deliveries */}
          {pendingOrders.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-gray-600" />
                <p className="font-semibold">Upcoming Deliveries</p>
              </div>
              {pendingOrders.slice(1).map((order, idx) => (
                <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm">
                        {idx + 2}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{order.customer_name}</p>
                        <p className="text-xs text-gray-600">{order.delivery_address}</p>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-600">${order.total.toFixed(2)}</p>
                  </div>
                  <ChatButton 
                    onClick={() => setChatOrder(order)}
                    unreadCount={getUnreadCountForOrder(order.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Weather & Air Quality */}
          {weatherData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WeatherWidget weather={weatherData.weather} />
              <AirQualityWidget airQuality={weatherData.airQuality} />
            </div>
          )}
        </div>
        </div>

        <ChatModal 
        order={chatOrder}
        isOpen={!!chatOrder}
        onClose={() => setChatOrder(null)}
        />
        </div>
        );
        }