import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, DollarSign, Clock, Navigation2, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

export default function CustomerOrderDetailModal({ order, isOpen, onClose, apiKey }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries: ['places'],
    id: 'customer-order-map'
  });

  if (!order) return null;

  const statusColors = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    preparing: 'bg-purple-500',
    out_for_delivery: 'bg-orange-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
  };

  const statusLabels = {
    pending: 'Order Placed',
    confirmed: 'Confirmed',
    preparing: 'Being Prepared',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };

  const showMap = order.status === 'out_for_delivery' && order.driver_lat && order.driver_lng && order.delivery_lat && order.delivery_lng;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-2xl">Order #{order.id.slice(0, 8).toUpperCase()}</span>
            <Badge className={`${statusColors[order.status]} text-white text-sm`}>
              {statusLabels[order.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Timeline/Status */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">Order placed</p>
              <p className="text-sm font-semibold text-emerald-900">
                {format(new Date(order.created_date), 'MMM d, h:mm a')}
              </p>
            </div>
            {order.eta_minutes && order.status === 'out_for_delivery' && (
              <div className="flex items-center gap-2 p-3 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-900">Estimated Arrival</p>
                  <p className="text-lg font-bold text-blue-600">{order.eta_minutes} minutes</p>
                </div>
              </div>
            )}
          </div>

          {/* Live Map for Out for Delivery */}
          {showMap && isLoaded && (
            <div className="rounded-xl overflow-hidden border-2 border-emerald-200">
              <div className="bg-emerald-500 text-white px-4 py-2 flex items-center gap-2">
                <Navigation2 className="w-5 h-5" />
                <span className="font-semibold">Live Tracking</span>
              </div>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '300px' }}
                center={{ lat: order.driver_lat, lng: order.driver_lng }}
                zoom={14}
                options={{
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false
                }}
              >
                {/* Driver location */}
                <Marker 
                  position={{ lat: order.driver_lat, lng: order.driver_lng }}
                  icon={{
                    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzEwYjk4MSIvPjxwYXRoIGQ9Ik0yMCA4TDI0IDE2SDE2TDIwIDhaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
                    scaledSize: new window.google.maps.Size(40, 40)
                  }}
                  title="Your driver"
                />
                {/* Delivery destination */}
                <Marker 
                  position={{ lat: order.delivery_lat, lng: order.delivery_lng }}
                  icon={{
                    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA0MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEM4Ljk1NCAwIDAgOC45NTQgMCAyMGMwIDE0IDIwIDMwIDIwIDMwczIwLTE2IDIwLTMwYzAtMTEuMDQ2LTguOTU0LTIwLTIwLTIweiIgZmlsbD0iI2VmNDQ0NCIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+',
                    scaledSize: new window.google.maps.Size(40, 50)
                  }}
                  title="Your address"
                />
              </GoogleMap>
            </div>
          )}

          {/* Driver Info (if out for delivery) */}
          {order.status === 'out_for_delivery' && order.driver_name && (
            <div className="p-4 bg-cyan-50 rounded-xl">
              <p className="text-sm text-cyan-900 mb-2 font-semibold">Your Driver</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg text-cyan-900">{order.driver_name}</p>
                  {order.driver_phone && (
                    <a 
                      href={`tel:${order.driver_phone}`}
                      className="text-sm text-cyan-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {order.driver_phone}
                    </a>
                  )}
                </div>
                {order.driver_phone && (
                  <a 
                    href={`tel:${order.driver_phone}`}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Call Driver
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-900">Delivery Address</h3>
            </div>
            <p className="text-blue-800">{order.delivery_address}</p>
          </div>

          {/* Order Items */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900">Order Items</h3>
            </div>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      {item.variant && (
                        <p className="text-xs text-gray-600">{item.variant}</p>
                      )}
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-600">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-900">Order Total</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">${order.subtotal?.toFixed(2) || order.total.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span className="font-semibold">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.fees > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fees</span>
                  <span className="font-semibold">${order.fees.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl border-t-2 border-emerald-200 pt-3">
                <span>Total</span>
                <span className="text-emerald-600">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="p-4 bg-amber-50 rounded-xl">
              <h3 className="font-bold text-amber-900 mb-2">Delivery Notes</h3>
              <p className="text-amber-800">{order.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}