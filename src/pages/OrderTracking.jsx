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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
        Phone, Mail, MapPin, Clock, Package, Truck, CheckCircle2, Loader2, Navigation,
        ArrowLeft, MessageSquare, X, ChevronUp, ChevronDown, Camera, Play, Pause, Square,
        StickyNote, Upload, Trash2, GripHorizontal, FileText, User, Plus, Route, Edit, Save,
        PackageCheck, XCircle
      } from 'lucide-react';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import ProductSelector from '@/components/orders/ProductSelector';
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
const customerLocationIcon = makeEmojiIcon('#8b5cf6', '📱');
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
  const [isEditing, setIsEditing] = useState(false);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [editData, setEditData] = useState({});
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

  const startEditing = () => {
    setEditData({
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      customer_email: order.customer_email || '',
      delivery_address: order.delivery_address || '',
      delivery_lat: order.delivery_lat || '',
      delivery_lng: order.delivery_lng || '',
      status: order.status,
      items: [...(order.items || [])],
      notes: order.notes || '',
      subtotal: order.subtotal || 0,
      discount: order.discount || 0,
      fees: order.fees || 0,
      total: order.total || 0
    });
    setIsEditing(true);
    setActiveTab('edit');
  };

  const handleAddProducts = (products) => {
    const newItems = [...editData.items, ...products];
    const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - (editData.discount || 0) + (editData.fees || 0);
    setEditData({ ...editData, items: newItems, subtotal, total });
  };

  const handleRemoveItem = (index) => {
    const newItems = editData.items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - (editData.discount || 0) + (editData.fees || 0);
    setEditData({ ...editData, items: newItems, subtotal, total });
  };

  const handleUpdateItemQuantity = (index, quantity) => {
    const newItems = editData.items.map((item, i) => 
      i === index ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) } : item
    );
    const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - (editData.discount || 0) + (editData.fees || 0);
    setEditData({ ...editData, items: newItems, subtotal, total });
  };

  const saveOrder = async () => {
    try {
      let updateData = { ...editData };

      // Auto-geocode address if coordinates not set
      if (editData.delivery_address && (!editData.delivery_lat || !editData.delivery_lng)) {
        try {
          const response = await base44.functions.invoke('googlePlacesAutocomplete', {
            input: editData.delivery_address,
            types: 'address'
          });

          if (response.data.status === 'success' && response.data.predictions?.[0]) {
            const detailsResponse = await base44.functions.invoke('googlePlaceDetails', {
              place_id: response.data.predictions[0].place_id
            });

            if (detailsResponse.data.status === 'success') {
              updateData.delivery_lat = detailsResponse.data.details.lat;
              updateData.delivery_lng = detailsResponse.data.details.lng;
            }
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }

      await base44.entities.Order.update(order.id, updateData);
      onOrderUpdate?.({ ...order, ...updateData });
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
      toast.success('Order updated successfully');
      setIsEditing(false);
      setActiveTab('details');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
    setActiveTab('details');
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await base44.entities.Order.update(order.id, { status: newStatus });
      onOrderUpdate?.({ ...order, status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                size="icon"
                onClick={startEditing}
                className="text-emerald-600 hover:text-emerald-700"
              >
                <Edit className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
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

        {/* Quick Status Actions */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {order.status === 'pending' && (
            <Button size="sm" onClick={() => handleStatusChange('confirmed')} className="bg-blue-500 hover:bg-blue-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Confirm
            </Button>
          )}
          {order.status === 'confirmed' && (
            <Button size="sm" onClick={() => handleStatusChange('preparing')} className="bg-orange-500 hover:bg-orange-600">
              <PackageCheck className="w-3 h-3 mr-1" />
              Start Preparing
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button size="sm" onClick={() => handleStatusChange('out_for_delivery')} className="bg-purple-500 hover:bg-purple-600">
              <Truck className="w-3 h-3 mr-1" />
              Out for Delivery
            </Button>
          )}
          {order.status === 'out_for_delivery' && (
            <Button size="sm" onClick={() => handleStatusChange('delivered')} className="bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Mark Delivered
            </Button>
          )}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('cancelled')} className="text-red-600 border-red-300 hover:bg-red-50">
              <XCircle className="w-3 h-3 mr-1" />
              Cancel Order
            </Button>
          )}
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
      <div className="h-full overflow-y-auto pb-64">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'details', label: 'Details', icon: FileText },
              { id: 'steps', label: 'Steps', icon: Clock },
              { id: 'notes', label: 'Notes', icon: StickyNote },
              ...(isEditing ? [{ id: 'edit', label: 'Edit', icon: Edit }] : [])
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
                  const canAdvance = idx === currentStepIndex + 1;

                  return (
                    <button
                      key={step.status}
                      onClick={() => canAdvance && handleStatusChange(step.status)}
                      disabled={!canAdvance}
                      className={`flex items-center gap-4 w-full text-left p-3 rounded-lg transition-all ${
                        canAdvance ? 'hover:bg-emerald-50 cursor-pointer' : ''
                      }`}
                    >
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
                        {canAdvance && <p className="text-xs text-blue-600">Click to advance</p>}
                      </div>
                      {isActive && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </button>
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

          {activeTab === 'edit' && (
            <div className="space-y-4">
              {/* Order Status */}
              <div>
                <Label>Order Status</Label>
                <Select value={editData.status} onValueChange={(v) => setEditData({...editData, status: v})}>
                  <SelectTrigger>
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

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Customer Information</h4>
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={editData.customer_name}
                    onChange={(e) => setEditData({...editData, customer_name: e.target.value})}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editData.customer_phone}
                    onChange={(e) => setEditData({...editData, customer_phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editData.customer_email}
                    onChange={(e) => setEditData({...editData, customer_email: e.target.value})}
                    placeholder="Email address"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <Label>Delivery Address</Label>
                <AddressAutocomplete
                  value={editData.delivery_address}
                  onChange={(val) => setEditData({...editData, delivery_address: val})}
                  placeholder="Enter delivery address"
                  onPlaceSelect={(details) => {
                    setEditData({
                      ...editData,
                      delivery_address: details.address,
                      delivery_lat: details.lat,
                      delivery_lng: details.lng
                    });
                  }}
                />
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Order Items</h4>
                  <Button
                    size="sm"
                    onClick={() => setIsProductSelectorOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Products
                  </Button>
                </div>
                {editData.items?.length > 0 ? (
                  <div className="space-y-2">
                    {editData.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">Qty:</span>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(idx, e.target.value)}
                              className="h-7 w-16 text-xs"
                            />
                          </div>
                        </div>
                        <p className="font-semibold text-emerald-600">${(item.price * item.quantity).toFixed(2)}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveItem(idx)}
                          className="h-8 w-8 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No items added</p>
                  </div>
                )}
              </div>

              {/* Order Total */}
              <div className="bg-emerald-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${editData.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Discount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.discount || 0}
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0;
                      const total = editData.subtotal - discount + (editData.fees || 0);
                      setEditData({...editData, discount, total});
                    }}
                    className="h-8 w-24 text-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Fees</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.fees || 0}
                    onChange={(e) => {
                      const fees = parseFloat(e.target.value) || 0;
                      const total = editData.subtotal - (editData.discount || 0) + fees;
                      setEditData({...editData, fees, total});
                    }}
                    className="h-8 w-24 text-right"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-emerald-600">${editData.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {/* Delivery Notes */}
              <div>
                <Label>Delivery Instructions</Label>
                <Textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({...editData, notes: e.target.value})}
                  placeholder="Add special delivery instructions..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveOrder}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Selector Modal */}
      <ProductSelector
        isOpen={isProductSelectorOpen}
        onClose={() => setIsProductSelectorOpen(false)}
        onAddProducts={handleAddProducts}
      />
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
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [createOrderData, setCreateOrderData] = useState({});
  const [showDrivers, setShowDrivers] = useState(true);
  const [showCustomers, setShowCustomers] = useState(true);
  const [showDeliveryLocations, setShowDeliveryLocations] = useState(true);
  const [orderFilter, setOrderFilter] = useState('active');

  // Fetch specific order if ID provided
  const { data: specificOrder, isLoading: isLoadingSpecific } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const orders = await base44.entities.Order.list();
      return orders.find(o => o.id === orderId) || null;
    },
    enabled: !!orderId,
    refetchInterval: 5000
  });

  const { data: allOrders = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      const orders = await base44.entities.Order.list('-created_date');
      return orders;
    },
    refetchInterval: 5000,
    enabled: !orderId
  });

  const filteredOrders = React.useMemo(() => {
    if (orderFilter === 'active') {
      return allOrders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    } else if (orderFilter === 'past') {
      return allOrders.filter(o => ['delivered', 'cancelled'].includes(o.status));
    }
    return allOrders;
  }, [allOrders, orderFilter]);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const order = await base44.entities.Order.create(orderData);
      
      // Update or create contact record
      if (orderData.customer_id) {
        const contact = contacts.find(c => c.id === orderData.customer_id);
        if (contact) {
          await base44.entities.Contact.update(contact.id, {
            type: 'customer',
            total_orders: (contact.total_orders || 0) + 1,
            total_spent: (contact.total_spent || 0) + orderData.total,
            last_order_date: new Date().toISOString().split('T')[0]
          });
        }
      } else if (orderData.customer_email) {
        const existingContact = contacts.find(c => c.email === orderData.customer_email);
        if (!existingContact) {
          await base44.entities.Contact.create({
            full_name: orderData.customer_name,
            email: orderData.customer_email,
            phone: orderData.customer_phone,
            type: 'customer',
            total_orders: 1,
            total_spent: orderData.total,
            last_order_date: new Date().toISOString().split('T')[0]
          });
        }
      }
      
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
      setIsCreateOrderOpen(false);
      setCreateOrderData({});
      toast.success('Order created successfully');
    },
    onError: () => {
      toast.error('Failed to create order');
    }
  });

  const order = orderId ? specificOrder : filteredOrders[currentOrderIndex] || null;
  const isLoading = orderId ? isLoadingSpecific : isLoadingAll;

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

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Track location continuously
  useEffect(() => {
    if (!user) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);

        // Update order with driver location if user is the driver
        if (order?.id && user.email === order.driver_email) {
          base44.entities.Order.update(order.id, {
            driver_lat: latitude,
            driver_lng: longitude
          }).catch(err => console.error('Failed to update driver location:', err));
        }
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Please enable location permissions');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
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
      const newIndex = currentOrderIndex - 1;
      setCurrentOrderIndex(newIndex);
      const newOrder = filteredOrders[newIndex];
      if (newOrder?.delivery_lat && newOrder?.delivery_lng && mapRef.current) {
        mapRef.current.setView([newOrder.delivery_lat, newOrder.delivery_lng], 15);
      }
    }
  };

  const goToNextOrder = () => {
    if (currentOrderIndex < filteredOrders.length - 1) {
      const newIndex = currentOrderIndex + 1;
      setCurrentOrderIndex(newIndex);
      const newOrder = filteredOrders[newIndex];
      if (newOrder?.delivery_lat && newOrder?.delivery_lng && mapRef.current) {
        mapRef.current.setView([newOrder.delivery_lat, newOrder.delivery_lng], 15);
      }
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

  if (!order && !orderId && filteredOrders.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-emerald-900 mb-2">No {orderFilter === 'past' ? 'Past' : orderFilter === 'active' ? 'Active' : ''} Orders</h1>
          <p className="text-emerald-600 mb-4">There are no {orderFilter === 'past' ? 'past' : orderFilter === 'active' ? 'active' : ''} orders to display.</p>
          <Button onClick={() => setOrderFilter('all')} className="bg-emerald-600">
            View All Orders
          </Button>
        </div>
      </div>
    );
  }

  if (!order && orderId) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">This order could not be found.</p>
          <Button onClick={() => navigate(createPageUrl('AdminOrders'))} className="bg-emerald-600">
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  if (!order && filteredOrders.length > 0) {
    return null;
  }

  const centerOnLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.setView(currentLocation, 15);
    } else {
      // Get current location if not already available
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = [latitude, longitude];
          setCurrentLocation(newLocation);
          if (mapRef.current) {
            mapRef.current.setView(newLocation, 15);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
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

  const handleCreateOrder = () => {
    setCreateOrderData({
      items: [],
      subtotal: 0,
      discount: 0,
      fees: 0,
      total: 0,
      status: 'pending',
      delivery_address: '',
      customer_id: '',
      customer_selection: 'existing',
      driver_selection: 'none'
    });
    setIsCreateOrderOpen(true);
  };

  const handleAddProductsToNewOrder = (products) => {
    const newItems = [...(createOrderData.items || []), ...products];
    const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - (createOrderData.discount || 0) + (createOrderData.fees || 0);
    setCreateOrderData({ ...createOrderData, items: newItems, subtotal, total });
  };

  const handleRemoveItemFromNewOrder = (index) => {
    const newItems = createOrderData.items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - (createOrderData.discount || 0) + (createOrderData.fees || 0);
    setCreateOrderData({ ...createOrderData, items: newItems, subtotal, total });
  };

  const handleUpdateNewOrderItemQuantity = (index, quantity) => {
    const newItems = createOrderData.items.map((item, i) => 
      i === index ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) } : item
    );
    const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - (createOrderData.discount || 0) + (createOrderData.fees || 0);
    setCreateOrderData({ ...createOrderData, items: newItems, subtotal, total });
  };

  const handleSubmitNewOrder = async () => {
    if (createOrderData.customer_selection === 'new' && !createOrderData.new_customer_name) {
      toast.error('Please enter customer name');
      return;
    }
    if (createOrderData.customer_selection === 'existing' && !createOrderData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (!createOrderData.items || createOrderData.items.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const selectedContact = createOrderData.customer_selection === 'existing' 
      ? contacts.find(c => c.id === createOrderData.customer_id) 
      : null;

    let delivery_lat = createOrderData.delivery_lat;
    let delivery_lng = createOrderData.delivery_lng;

    // Auto-geocode address if coordinates not set
    if (createOrderData.delivery_address && (!delivery_lat || !delivery_lng)) {
      try {
        const response = await base44.functions.invoke('googlePlacesAutocomplete', {
          input: createOrderData.delivery_address,
          types: 'address'
        });

        if (response.data.status === 'success' && response.data.predictions?.[0]) {
          const detailsResponse = await base44.functions.invoke('googlePlaceDetails', {
            place_id: response.data.predictions[0].place_id
          });

          if (detailsResponse.data.status === 'success') {
            delivery_lat = detailsResponse.data.details.lat;
            delivery_lng = detailsResponse.data.details.lng;
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }

    const orderData = {
      items: createOrderData.items,
      subtotal: createOrderData.subtotal,
      discount: createOrderData.discount || 0,
      fees: createOrderData.fees || 0,
      total: createOrderData.total,
      status: createOrderData.status,
      delivery_address: createOrderData.delivery_address,
      delivery_lat: delivery_lat,
      delivery_lng: delivery_lng,
      customer_name: createOrderData.customer_selection === 'existing' 
        ? selectedContact?.full_name 
        : createOrderData.new_customer_name,
      customer_phone: createOrderData.customer_selection === 'existing' 
        ? selectedContact?.phone 
        : createOrderData.new_customer_phone,
      customer_email: createOrderData.customer_selection === 'existing' 
        ? selectedContact?.email 
        : createOrderData.new_customer_email,
      customer_id: createOrderData.customer_selection === 'existing' 
        ? createOrderData.customer_id 
        : undefined,
      notes: createOrderData.notes
    };

    if (createOrderData.driver_selection === 'self') {
      orderData.driver_name = user?.full_name;
      orderData.driver_phone = user?.phone || '';
      orderData.driver_email = user?.email;
      orderData.status = 'out_for_delivery';
    } else if (createOrderData.driver_selection === 'other') {
      orderData.driver_name = createOrderData.driver_name;
      orderData.driver_phone = createOrderData.driver_phone;
      orderData.driver_email = createOrderData.driver_email;
    }

    createOrderMutation.mutate(orderData);
  };

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
          ref={(map) => { if (map) mapRef.current = map; }}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* My Location (Admin/Driver viewing) */}
          {currentLocation && (
            <Marker position={currentLocation} icon={driverIcon}>
              <Popup>
                <div className="text-center p-2">
                  <p className="font-bold text-emerald-600">🐉 My Location</p>
                  <p className="text-xs text-gray-500">GPS: {currentLocation[0].toFixed(5)}, {currentLocation[1].toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* All Filtered Orders */}
          {filteredOrders.map((activeOrder, idx) => {
            const isCurrentOrder = activeOrder.id === order.id;
            const orderIcon = isCurrentOrder ? deliveryIcon : makeEmojiIcon('#64748b', `${idx + 1}`);

            return activeOrder.delivery_lat && activeOrder.delivery_lng && showDeliveryLocations && (
              <Marker 
                key={activeOrder.id} 
                position={[activeOrder.delivery_lat, activeOrder.delivery_lng]} 
                icon={orderIcon}
                eventHandlers={{
                  click: () => {
                    const orderIndex = filteredOrders.findIndex(o => o.id === activeOrder.id);
                    setCurrentOrderIndex(orderIndex);
                  }
                }}
              >
               <Popup>
                 <div className="text-center p-2 min-w-[220px]">
                   <p className="font-bold text-emerald-600 mb-1">🏠 {isCurrentOrder ? 'Current Delivery' : `Order #${idx + 1}`}</p>
                   <p className="text-sm text-gray-700">{activeOrder.customer_name}</p>
                   <p className="text-sm text-gray-600 mb-2">{activeOrder.delivery_address}</p>
                   <Badge className={`${
                     activeOrder.status === 'delivered' ? 'bg-green-500' :
                     activeOrder.status === 'out_for_delivery' ? 'bg-purple-500' :
                     activeOrder.status === 'preparing' ? 'bg-orange-500' :
                     activeOrder.status === 'confirmed' ? 'bg-blue-500' : 'bg-yellow-500'
                   } text-white mb-2`}>
                     {activeOrder.status.replace(/_/g, ' ')}
                   </Badge>
                   <div className="flex flex-col gap-1 mt-2">
                     {activeOrder.status === 'pending' && (
                       <button 
                         onClick={() => updateStatusMutation.mutate({ id: activeOrder.id, status: 'confirmed' })}
                         className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                       >
                         Confirm Order
                       </button>
                     )}
                     {activeOrder.status === 'confirmed' && (
                       <button 
                         onClick={() => updateStatusMutation.mutate({ id: activeOrder.id, status: 'preparing' })}
                         className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                       >
                         Start Preparing
                       </button>
                     )}
                     {activeOrder.status === 'preparing' && (
                       <button 
                         onClick={() => updateStatusMutation.mutate({ id: activeOrder.id, status: 'out_for_delivery' })}
                         className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                       >
                         Out for Delivery
                       </button>
                     )}
                     {activeOrder.status === 'out_for_delivery' && (
                       <button 
                         onClick={() => updateStatusMutation.mutate({ id: activeOrder.id, status: 'delivered' })}
                         className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                       >
                         Mark Delivered
                       </button>
                     )}
                     {!isCurrentOrder && (
                       <button 
                         onClick={() => {
                           const orderIndex = filteredOrders.findIndex(o => o.id === activeOrder.id);
                           setCurrentOrderIndex(orderIndex);
                         }}
                         className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700"
                       >
                         Switch to this order
                       </button>
                     )}
                   </div>
                 </div>
               </Popup>
              </Marker>
            );
          })}

          {/* Driver Location - Shown if different from current user */}
          {showDrivers && order.driver_lat && order.driver_lng && (!currentLocation || (order.driver_lat !== currentLocation[0] || order.driver_lng !== currentLocation[1])) && (
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

          {/* Customer Real-time Location */}
          {showCustomers && order.customer_lat && order.customer_lng && (
            <Marker position={[order.customer_lat, order.customer_lng]} icon={customerLocationIcon}>
              <Popup>
                <div className="text-center p-2">
                  <p className="font-bold text-purple-600">📱 {order.customer_name}</p>
                  <p className="text-sm text-gray-700">Customer Location (Live)</p>
                  <p className="text-xs text-gray-500 mt-1">GPS: {order.customer_lat.toFixed(5)}, {order.customer_lng.toFixed(5)}</p>
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
          onClick={() => navigate(createPageUrl((isDriver || user?.role === 'admin') ? 'AdminOrders' : 'Orders'))}
        >
          <ArrowLeft className="w-5 h-5 text-emerald-900" />
        </Button>
        <Button
          size="icon"
          onClick={handleCreateOrder}
          className="rounded-full shadow-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
        >
          <Plus className="w-5 h-5" />
        </Button>

        {filteredOrders.length > 1 && (
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
            <div className="text-center min-w-[180px]">
              <p className="text-xs text-gray-500">Order {currentOrderIndex + 1} of {filteredOrders.length}</p>
              <p className="text-sm font-bold text-emerald-900">{order?.customer_name}</p>
              <button
                onClick={centerOnOrder}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate max-w-full"
                title={order?.delivery_address}
              >
                {order?.delivery_address?.split(',')[0]}
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextOrder}
              disabled={currentOrderIndex === filteredOrders.length - 1}
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

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex flex-col gap-1">
          <label className="flex items-center gap-1 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={showDeliveryLocations}
              onChange={(e) => setShowDeliveryLocations(e.target.checked)}
              className="rounded text-emerald-600"
            />
            <span>🏠</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={showDrivers}
              onChange={(e) => setShowDrivers(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>🚗</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={showCustomers}
              onChange={(e) => setShowCustomers(e.target.checked)}
              className="rounded text-purple-600"
            />
            <span>📱</span>
          </label>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex flex-col gap-1">
          <button
            onClick={() => setOrderFilter('active')}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              orderFilter === 'active' ? 'bg-emerald-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setOrderFilter('all')}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              orderFilter === 'all' ? 'bg-emerald-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setOrderFilter('past')}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              orderFilter === 'past' ? 'bg-emerald-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            Past
          </button>
        </div>
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

      {/* Create Order Dialog */}
      <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Customer Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Customer *</Label>
              <div className="space-y-2">
                <div 
                  onClick={() => setCreateOrderData({...createOrderData, customer_selection: 'existing'})}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-emerald-50 ${
                    createOrderData.customer_selection === 'existing' ? 'border-emerald-500 bg-emerald-50' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    createOrderData.customer_selection === 'existing' ? 'border-emerald-500' : 'border-gray-300'
                  }`}>
                    {createOrderData.customer_selection === 'existing' && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <Label className="flex-1 cursor-pointer">Select existing customer</Label>
                </div>
                <div 
                  onClick={() => setCreateOrderData({...createOrderData, customer_selection: 'new'})}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-emerald-50 ${
                    createOrderData.customer_selection === 'new' ? 'border-emerald-500 bg-emerald-50' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    createOrderData.customer_selection === 'new' ? 'border-emerald-500' : 'border-gray-300'
                  }`}>
                    {createOrderData.customer_selection === 'new' && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <Label className="flex-1 cursor-pointer">Create new customer</Label>
                </div>
              </div>
            </div>

            {createOrderData.customer_selection === 'existing' && (
              <div>
                <Label>Select Customer *</Label>
                <Select 
                  value={createOrderData.customer_id} 
                  onValueChange={(v) => {
                    const selectedContact = contacts.find(c => c.id === v);
                    if (selectedContact) {
                      const address = selectedContact.address ? 
                        `${selectedContact.address}${selectedContact.city ? ', ' + selectedContact.city : ''}${selectedContact.state ? ', ' + selectedContact.state : ''}${selectedContact.zip ? ' ' + selectedContact.zip : ''}` 
                        : '';
                      setCreateOrderData({
                        ...createOrderData, 
                        customer_id: v,
                        delivery_address: address
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.filter(c => c.type === 'customer' || c.email).map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.full_name} ({contact.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {createOrderData.customer_selection === 'new' && (
              <div className="space-y-3 p-4 border rounded-lg bg-emerald-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  <Label className="font-semibold">New Customer Details</Label>
                </div>
                <div>
                  <Label>Full Name *</Label>
                  <Input 
                    value={createOrderData.new_customer_name || ''} 
                    onChange={(e) => setCreateOrderData({...createOrderData, new_customer_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    value={createOrderData.new_customer_email || ''} 
                    onChange={(e) => setCreateOrderData({...createOrderData, new_customer_email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    value={createOrderData.new_customer_phone || ''} 
                    onChange={(e) => setCreateOrderData({...createOrderData, new_customer_phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            )}

            {/* Driver Assignment */}
            <div className="border-t border-emerald-100 pt-4">
              <Label className="text-base font-semibold mb-3 block">Delivery Driver</Label>
              <div className="space-y-2">
                <div 
                  onClick={() => setCreateOrderData({...createOrderData, driver_selection: 'none'})}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-emerald-50 ${
                    createOrderData.driver_selection === 'none' ? 'border-emerald-500 bg-emerald-50' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    createOrderData.driver_selection === 'none' ? 'border-emerald-500' : 'border-gray-300'
                  }`}>
                    {createOrderData.driver_selection === 'none' && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <Label className="flex-1 cursor-pointer">No driver assigned yet</Label>
                </div>
                <div 
                  onClick={() => setCreateOrderData({...createOrderData, driver_selection: 'self'})}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-emerald-50 ${
                    createOrderData.driver_selection === 'self' ? 'border-emerald-500 bg-emerald-50' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    createOrderData.driver_selection === 'self' ? 'border-emerald-500' : 'border-gray-300'
                  }`}>
                    {createOrderData.driver_selection === 'self' && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <Label className="flex-1 cursor-pointer">I'll deliver this ({user?.email})</Label>
                </div>
                <div 
                  onClick={() => setCreateOrderData({...createOrderData, driver_selection: 'other'})}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-emerald-50 ${
                    createOrderData.driver_selection === 'other' ? 'border-emerald-500 bg-emerald-50' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    createOrderData.driver_selection === 'other' ? 'border-emerald-500' : 'border-gray-300'
                  }`}>
                    {createOrderData.driver_selection === 'other' && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <Label className="flex-1 cursor-pointer">Assign to another driver</Label>
                </div>
              </div>
            </div>

            {createOrderData.driver_selection === 'other' && (
              <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50">
                <Label className="font-semibold">Driver Details</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Driver Name</Label>
                    <Input 
                      value={createOrderData.driver_name || ''} 
                      onChange={(e) => setCreateOrderData({...createOrderData, driver_name: e.target.value})}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <Label>Driver Phone</Label>
                    <Input 
                      value={createOrderData.driver_phone || ''} 
                      onChange={(e) => setCreateOrderData({...createOrderData, driver_phone: e.target.value})}
                      placeholder="(555) 987-6543"
                    />
                  </div>
                </div>
                <div>
                  <Label>Driver Email</Label>
                  <Input 
                    type="email"
                    value={createOrderData.driver_email || ''} 
                    onChange={(e) => setCreateOrderData({...createOrderData, driver_email: e.target.value})}
                    placeholder="driver@example.com"
                  />
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="border-t border-emerald-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Order Items</Label>
                <Button 
                  type="button"
                  size="sm"
                  onClick={() => setIsProductSelectorOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Products
                </Button>
              </div>

              {(!createOrderData.items || createOrderData.items.length === 0) ? (
                <p className="text-gray-400 text-center py-4 border rounded-lg">No products added yet</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {createOrderData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs">Qty:</span>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateNewOrderItemQuantity(index, e.target.value)}
                            className="h-7 w-16 text-xs"
                          />
                          <span className="text-xs font-bold text-emerald-600">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveItemFromNewOrder(index)}
                        className="h-8 w-8 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Pricing Summary */}
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">${(createOrderData.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Discount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createOrderData.discount || 0}
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0;
                      const total = createOrderData.subtotal - discount + (createOrderData.fees || 0);
                      setCreateOrderData({...createOrderData, discount, total});
                    }}
                    className="h-8 w-24 text-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Fees</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createOrderData.fees || 0}
                    onChange={(e) => {
                      const fees = parseFloat(e.target.value) || 0;
                      const total = createOrderData.subtotal - (createOrderData.discount || 0) + fees;
                      setCreateOrderData({...createOrderData, fees, total});
                    }}
                    className="h-8 w-24 text-right"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-emerald-600">${(createOrderData.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="border-t border-emerald-100 pt-4">
              <Label className="text-base font-semibold mb-3 block">Order Details</Label>
              <div>
                <Label>Status</Label>
                <Select 
                  value={createOrderData.status} 
                  onValueChange={(v) => setCreateOrderData({...createOrderData, status: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3">
                <Label>Delivery Address</Label>
                <AddressAutocomplete
                  value={createOrderData.delivery_address || ''} 
                  onChange={(val) => setCreateOrderData({...createOrderData, delivery_address: val})}
                  placeholder="123 Main St, City, State"
                  onPlaceSelect={(details) => {
                    setCreateOrderData({
                      ...createOrderData, 
                      delivery_address: details.address,
                      delivery_lat: details.lat,
                      delivery_lng: details.lng
                    });
                  }}
                />
              </div>
              <div className="mt-3">
                <Label>Notes</Label>
                <Textarea 
                  value={createOrderData.notes || ''} 
                  onChange={(e) => setCreateOrderData({...createOrderData, notes: e.target.value})}
                  placeholder="Special instructions..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateOrderOpen(false);
                  setCreateOrderData({});
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitNewOrder} 
                disabled={createOrderMutation.isPending} 
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500"
              >
                {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Selector */}
      <ProductSelector
        isOpen={isProductSelectorOpen}
        onClose={() => setIsProductSelectorOpen(false)}
        onAddProducts={handleAddProductsToNewOrder}
      />
      </div>
      );
      }