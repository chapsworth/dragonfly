import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';

function MapController({ center, zoom }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
        Phone, Mail, MapPin, Clock, Package, Truck, CheckCircle2, Loader2, Navigation,
        ArrowLeft, MessageSquare, X, ChevronUp, ChevronDown, Camera, Play, Pause, Square,
        StickyNote, Upload, Trash2, GripHorizontal, FileText, User, Plus, Route
      } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
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

// Custom icons for map markers
const makeEmojiIcon = (bg = '#3b82f6', emoji = '📍') =>
  L.divIcon({
    className: 'custom-emoji-icon',
    html: `<div style="width:32px;height:32px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:${bg};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-size:18px;">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });

const deliveryIcon = makeEmojiIcon('#10b981', '🏠');
const customerIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-12 h-12 rounded-full shadow-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 border-3 border-white">
        <span class="text-white text-xl">📱</span>
      </div>
      <div class="absolute inset-0 w-full h-full rounded-full animate-ping bg-purple-500 opacity-40"></div>
    </div>
  `,
  className: 'customer-marker',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -28],
});
const driverIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-white border-4 border-emerald-400">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6937d9495caf111699370601/2bd4e5c04_IMG_0305.jpeg" 
             alt="Driver" 
             class="w-10 h-10 object-contain" />
      </div>
      <div class="absolute inset-0 w-full h-full rounded-full animate-ping bg-emerald-400 opacity-40"></div>
    </div>
  `,
  className: 'driver-marker',
  iconSize: [56, 56],
  iconAnchor: [28, 28],
  popupAnchor: [0, -28],
});

// Snap-to-Position Delivery Panel Component
const SnapDeliveryPanel = ({ order, onOrderUpdate, onClose, currentUser, onCenterMap }) => {
  const [snapPosition, setSnapPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [activeTab, setActiveTab] = useState('details');
  const [newNote, setNewNote] = useState('');
  const queryClient = useQueryClient();

  const snapPositions = [
    { position: 0, height: 40, label: 'bottom' },
    { position: 1, height: 70, label: 'middle' },
    { position: 2, height: 95, label: 'top' }
  ];

  const currentSnap = snapPositions[snapPosition];
  const panelHeight = `${currentSnap.height}vh`;

  const handleDragStart = (e) => {
    setIsDragging(true);
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragCurrentY(clientY);
    document.body.style.userSelect = 'none';
  };

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragCurrentY(clientY);

    const deltaY = dragStartY - clientY;
    const sensitivity = 50;

    if (deltaY > sensitivity && snapPosition < 2) {
      setSnapPosition(snapPosition + 1);
      setDragStartY(clientY);
    }
    else if (deltaY < -sensitivity && snapPosition > 0) {
      setSnapPosition(snapPosition - 1);
      setDragStartY(clientY);
    }
  }, [isDragging, dragStartY, snapPosition]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e) => handleDragMove(e);
      const handleTouchMove = (e) => {
        e.preventDefault();
        handleDragMove(e);
      };
      const handleMouseUp = () => handleDragEnd();
      const handleTouchEnd = () => handleDragEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  const deliverySteps = [
    { status: 'pending', label: 'Order Received', icon: CheckCircle2, color: 'bg-green-500' },
    { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2, color: 'bg-blue-500' },
    { status: 'preparing', label: 'Preparing', icon: Package, color: 'bg-orange-500' },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-purple-500' },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle2, color: 'bg-green-600' }
  ];

  const currentStepIndex = deliverySteps.findIndex(step => step.status === order.status);

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const noteData = {
        note: newNote.trim(),
        timestamp: new Date().toISOString(),
        author: currentUser?.full_name || currentUser?.email || 'Driver'
      };

      const updatedNotes = [...(order.notes_list || []), noteData];
      await base44.entities.Order.update(order.id, { notes_list: updatedNotes });
      
      onOrderUpdate?.({ ...order, notes_list: updatedNotes });
      toast.success('Note added');
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  return (
    <div
      className="bg-white rounded-t-3xl shadow-2xl border border-gray-200 fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out overflow-hidden"
      style={{ height: panelHeight }}
    >
      {/* Drag Handle */}
      <div
        className="w-full py-3 flex justify-center items-center cursor-grab active:cursor-grabbing bg-gray-50 border-b border-gray-200 relative"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <GripHorizontal className="w-6 h-6 text-gray-400" />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex gap-1">
          {snapPositions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                index === snapPosition ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
              onClick={() => setSnapPosition(index)}
            />
          ))}
        </div>
      </div>

      {/* Order Header */}
      <div className="px-4 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h2>
              <p className="text-sm text-gray-500">{order.customer_name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="truncate max-w-32">{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-32">{order.delivery_address?.split(',')[0] || 'Address'}</span>
            </div>
          </div>

          <Badge className={`${
            order.status === 'delivered' ? 'bg-green-500' :
            order.status === 'out_for_delivery' ? 'bg-purple-500' :
            order.status === 'preparing' ? 'bg-orange-500' :
            order.status === 'confirmed' ? 'bg-blue-500' : 'bg-yellow-500'
          } text-white`}>
            {order.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Button onClick={() => window.location.href = `tel:${order.customer_phone}`} size="sm" variant="outline">
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button onClick={() => {
            const body = encodeURIComponent(`Hi ${order.customer_name}, your order is on the way!`);
            window.location.href = `sms:${order.customer_phone}?body=${body}`;
          }} size="sm" variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS
          </Button>
          <Button onClick={() => {
            const destination = order.delivery_lat && order.delivery_lng
              ? `${order.delivery_lat},${order.delivery_lng}`
              : encodeURIComponent(order.delivery_address);
            window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
          }} size="sm" variant="outline">
            <Navigation className="w-4 h-4 mr-2" />
            Navigate
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="h-full overflow-y-auto pb-32">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'details', label: 'Details', icon: FileText },
              { id: 'steps', label: 'Steps', icon: Clock },
              { id: 'notes', label: 'Notes', icon: StickyNote }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'details' && onCenterMap) {
                    onCenterMap();
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Order Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-emerald-600">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-emerald-900">Total</span>
                  <span className="text-2xl font-bold text-emerald-600">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700">{order.delivery_address}</p>
                </div>
              </div>

              {/* Customer Contact */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Customer Contact</h4>
                <div className="space-y-2">
                  {order.customer_phone && (
                    <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 text-emerald-600">
                      <Phone className="w-4 h-4" />
                      {order.customer_phone}
                    </a>
                  )}
                  {order.customer_email && (
                    <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 text-emerald-600">
                      <Mail className="w-4 h-4" />
                      {order.customer_email}
                    </a>
                  )}
                </div>
              </div>

              {/* Delivery Notes */}
              {order.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Instructions</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-gray-700">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Delivery Progress</h4>
              <div className="space-y-3">
                {deliverySteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isActive = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.status} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive ? step.color : 'bg-gray-300'
                      } text-white transition-colors`}>
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isCurrent ? 'text-emerald-900' : 'text-gray-600'}`}>
                          {step.label}
                        </p>
                        {isCurrent && <p className="text-sm text-emerald-600">Current status</p>}
                      </div>
                      {isActive && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Add Delivery Note</Label>
                <Textarea
                  placeholder="Add note about this delivery..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <StickyNote className="w-3 h-3 mr-2" />
                  Add Note
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Delivery Notes</h4>
                {order.notes_list && order.notes_list.length > 0 ? (
                  order.notes_list.map((note, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-800 text-sm mb-1">{note.note}</p>
                      <p className="text-xs text-gray-500">
                        {note.author} • {format(new Date(note.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No notes yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function OrderTracking() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [distance, setDistance] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showPanel, setShowPanel] = useState(true);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = React.useRef(null);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const { data: allOrders = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      const orders = await base44.entities.Order.list('-created_date');
      return orders.filter(o => ['confirmed', 'preparing', 'out_for_delivery'].includes(o.status));
    },
    refetchInterval: 5000
  });

  const order = orderId ? allOrders.find(o => o.id === orderId) : allOrders[currentOrderIndex] || null;
  const isLoading = isLoadingAll;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Track driver/admin location continuously
  useEffect(() => {
    if (!user || !order) return;
    
    const isDriver = user.email === order.driver_email;
    const isAdmin = user.role === 'admin';
    
    if (isDriver || isAdmin) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
          
          // Update order with driver location
          if (isDriver && order.id) {
            base44.entities.Order.update(order.id, {
              driver_lat: latitude,
              driver_lng: longitude
            }).catch(err => console.error('Failed to update driver location:', err));
          }
        },
        (error) => console.log('Error getting location:', error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user, order?.id, order?.driver_email]);

  // Calculate distance
  useEffect(() => {
    if (order?.driver_lat && order?.driver_lng && order?.delivery_lat && order?.delivery_lng) {
      const R = 6371;
      const dLat = (order.delivery_lat - order.driver_lat) * Math.PI / 180;
      const dLon = (order.delivery_lng - order.driver_lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(order.driver_lat * Math.PI / 180) * Math.cos(order.delivery_lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      setDistance((dist * 0.621371).toFixed(2));
    }
  }, [order?.driver_lat, order?.driver_lng, order?.delivery_lat, order?.delivery_lng]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
      toast.success('Status updated');
    }
  });

  const handleOrderUpdate = (updatedOrder) => {
    queryClient.setQueryData(['order', orderId], updatedOrder);
  };

  const goToPreviousOrder = () => {
    if (currentOrderIndex > 0) {
      setCurrentOrderIndex(currentOrderIndex - 1);
    }
  };

  const goToNextOrder = () => {
    if (currentOrderIndex < allOrders.length - 1) {
      setCurrentOrderIndex(currentOrderIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-emerald-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!order && allOrders.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-emerald-900 mb-2">No Active Deliveries</h1>
          <p className="text-emerald-600 mb-4">There are no orders currently in delivery.</p>
          <Button onClick={() => navigate(createPageUrl('AdminOrders'))} className="bg-emerald-600">
            View All Orders
          </Button>
        </div>
      </div>
    );
  }

  if (!order && allOrders.length > 0) {
    return null;
  }

  const defaultMapCenter = React.useMemo(() => {
    const locations = [];
    if (currentLocation) locations.push(currentLocation);
    if (order?.driver_lat && order?.driver_lng) locations.push([order.driver_lat, order.driver_lng]);
    if (order?.customer_lat && order?.customer_lng) locations.push([order.customer_lat, order.customer_lng]);
    if (order?.delivery_lat && order?.delivery_lng) locations.push([order.delivery_lat, order.delivery_lng]);
    
    if (locations.length === 0) return [34.0522, -118.2437];
    
    const avgLat = locations.reduce((sum, loc) => sum + loc[0], 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + loc[1], 0) / locations.length;
    return [avgLat, avgLng];
  }, [currentLocation, order?.driver_lat, order?.driver_lng, order?.customer_lat, order?.customer_lng, order?.delivery_lat, order?.delivery_lng]);

  const centerOnLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.setView(currentLocation, 15);
    }
  };

  const centerOnOrder = () => {
    if (!order || !mapRef.current) return;
    
    if (order.driver_lat && order.driver_lng && order.delivery_lat && order.delivery_lng) {
      const bounds = [
        [order.driver_lat, order.driver_lng],
        [order.delivery_lat, order.delivery_lng]
      ];
      mapRef.current.fitBounds(bounds, { padding: [80, 80] });
    } else if (order.delivery_lat && order.delivery_lng) {
      mapRef.current.setView([order.delivery_lat, order.delivery_lng], 14);
    }
  };

  // Decode Google polyline format
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

  // Get optimized route
  const getOptimizedRoute = async () => {
    if (!order.delivery_lat || !order.delivery_lng) {
      toast.error('Delivery location not available');
      return;
    }

    setIsLoadingRoute(true);
    try {
      const origin = currentLocation 
        ? `${currentLocation[0]},${currentLocation[1]}`
        : order.driver_lat && order.driver_lng
        ? `${order.driver_lat},${order.driver_lng}`
        : null;

      if (!origin) {
        toast.error('Driver location not available');
        setIsLoadingRoute(false);
        return;
      }

      const response = await base44.functions.invoke('getOptimizedRoute', {
        origin,
        destinations: [`${order.delivery_lat},${order.delivery_lng}`]
      });

      if (response.data?.routes?.[0]) {
        const route = response.data.routes[0];
        const decodedPoints = decodePolyline(route.overview_polyline);
        setRoutePolyline(decodedPoints);
        
        // Fit map to route
        if (mapRef.current && decodedPoints.length > 0) {
          mapRef.current.fitBounds(decodedPoints, { padding: [80, 80] });
        }

        const leg = route.legs[0];
        toast.success(`Route found: ${leg.distance.text}, ${leg.duration.text}`);

        // Open Google Maps for turn-by-turn directions
        const destination = `${order.delivery_lat},${order.delivery_lng}`;
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`, '_blank');
      }
    } catch (error) {
      console.error('Route error:', error);
      toast.error('Failed to get route');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const isDriver = user?.email === order.driver_email;

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-100">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={mapCenter || defaultMapCenter}
          zoom={mapZoom}
          style={{ height: '100vh', width: '100vw' }}
          zoomControl={false}
          attributionControl={false}
          ref={mapRef}
          whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* My Location (Admin/Driver viewing) */}
          {currentLocation && (
            <Marker position={currentLocation} icon={makeEmojiIcon('#3b82f6', '📍')}>
              <Popup>
                <div className="text-center p-2">
                  <p className="font-bold text-blue-600">📍 My Location</p>
                  <p className="text-xs text-gray-500">GPS: {currentLocation[0].toFixed(5)}, {currentLocation[1].toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* All Active Orders */}
          {allOrders.map((activeOrder, idx) => {
            const isCurrentOrder = activeOrder.id === order.id;
            const orderIcon = isCurrentOrder ? deliveryIcon : makeEmojiIcon('#64748b', `${idx + 1}`);
            
            return activeOrder.delivery_lat && activeOrder.delivery_lng && (
              <Marker 
                key={activeOrder.id} 
                position={[activeOrder.delivery_lat, activeOrder.delivery_lng]} 
                icon={orderIcon}
                eventHandlers={{
                  click: () => {
                    const orderIndex = allOrders.findIndex(o => o.id === activeOrder.id);
                    setCurrentOrderIndex(orderIndex);
                  }
                }}
              >
                <Popup>
                  <div className="text-center p-2">
                    <p className="font-bold text-emerald-600">🏠 {isCurrentOrder ? 'Current Delivery' : `Order #${idx + 1}`}</p>
                    <p className="text-sm text-gray-700">{activeOrder.customer_name}</p>
                    <p className="text-sm text-gray-600">{activeOrder.delivery_address}</p>
                    {!isCurrentOrder && (
                      <button 
                        onClick={() => setCurrentOrderIndex(idx)}
                        className="mt-2 text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                      >
                        Switch to this order
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Driver Location - Shown if different from current user */}
          {order.driver_lat && order.driver_lng && (!currentLocation || (order.driver_lat !== currentLocation[0] || order.driver_lng !== currentLocation[1])) && (
            <Marker position={[order.driver_lat, order.driver_lng]} icon={driverIcon}>
              <Popup>
                <div className="text-center p-2">
                  <p className="font-bold text-emerald-600">🐉 {order.driver_name || 'Driver'}</p>
                  {distance && <p className="text-sm font-semibold text-gray-700">📍 {distance} miles away</p>}
                  {order.eta_minutes && <p className="text-sm text-gray-600">⏱️ {order.eta_minutes} min ETA</p>}
                  <p className="text-xs text-gray-500 mt-1">GPS: {order.driver_lat.toFixed(5)}, {order.driver_lng.toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Optimized Route */}
          {routePolyline && routePolyline.length > 0 ? (
            <Polyline
              positions={routePolyline}
              color="#3b82f6"
              weight={5}
              opacity={0.8}
            />
          ) : (
            /* Simple straight line */
            order.driver_lat && order.driver_lng && order.delivery_lat && order.delivery_lng && (
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
            )
          )}
        </MapContainer>
      </div>

      {/* Smart Back Button with Order Navigation */}
      <div className="fixed top-4 left-4 z-30 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white border-0"
          onClick={() => navigate(createPageUrl(isDriver ? 'AdminOrders' : 'Orders'))}
        >
          <ArrowLeft className="w-5 h-5 text-emerald-900" />
        </Button>

        {allOrders.length > 1 && (
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousOrder}
              disabled={currentOrderIndex === 0}
              className="h-8 w-8 rounded-full"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </Button>
            <div className="text-center min-w-[120px]">
              <p className="text-xs text-gray-500">Order {currentOrderIndex + 1} of {allOrders.length}</p>
              <p className="text-sm font-bold text-emerald-900">#{order?.id?.slice(0, 8)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextOrder}
              disabled={currentOrderIndex === allOrders.length - 1}
              className="h-8 w-8 rounded-full"
            >
              <ChevronDown className="w-5 h-5 -rotate-90" />
            </Button>
          </div>
        )}
      </div>

      {/* Map Controls */}
      <div className="fixed top-20 left-4 z-30 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full shadow-lg bg-white/40 backdrop-blur-sm hover:bg-white/60 border-0"
          onClick={centerOnLocation}
          title="Center on my location"
        >
          <Navigation className="w-5 h-5 text-emerald-900" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full shadow-lg bg-white/40 backdrop-blur-sm hover:bg-white/60 border-0"
          onClick={getOptimizedRoute}
          disabled={isLoadingRoute}
          title="Get optimized route"
        >
          {isLoadingRoute ? (
            <Loader2 className="w-5 h-5 text-emerald-900 animate-spin" />
          ) : (
            <Route className="w-5 h-5 text-emerald-900" />
          )}
        </Button>
      </div>

      {/* Delivery Panel */}
      {showPanel && order && (
        <SnapDeliveryPanel
          order={order}
          onOrderUpdate={handleOrderUpdate}
          onClose={() => setShowPanel(false)}
          currentUser={user}
          onCenterMap={centerOnOrder}
        />
      )}

      {/* Show Panel Button */}
      {!showPanel && (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 h-14 w-14"
          onClick={() => setShowPanel(true)}
        >
          <ChevronUp className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}