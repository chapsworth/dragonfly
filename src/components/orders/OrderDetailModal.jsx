import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Navigation, MapPin, Package, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';
import NavigationModal from './NavigationModal';

export default function OrderDetailModal({ order, isOpen, onClose }) {
  const [showNavigation, setShowNavigation] = useState(false);

  if (!order) return null;

  const statusColors = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    preparing: 'bg-purple-500',
    out_for_delivery: 'bg-orange-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
  };

  const handleCall = () => {
    if (order.customer_phone) {
      window.location.href = `tel:${order.customer_phone}`;
    } else {
      toast.error('No phone number available');
    }
  };

  const handleEmail = () => {
    if (order.customer_email) {
      window.location.href = `mailto:${order.customer_email}`;
    } else {
      toast.error('No email available');
    }
  };

  const handleSMS = () => {
    if (order.customer_phone) {
      window.location.href = `sms:${order.customer_phone}`;
    } else {
      toast.error('No phone number available');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order #{order.id.slice(0, 8)}</span>
              <Badge className={`${statusColors[order.status]} text-white`}>
                {order.status.replace('_', ' ')}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Info */}
            <div className="p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-900">Customer Information</h3>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-lg">{order.customer_name}</p>
                <div className="flex flex-wrap gap-2">
                  <a 
                    href={`tel:${order.customer_phone}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">{order.customer_phone}</span>
                  </a>
                  <a 
                    href={`mailto:${order.customer_email}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">{order.customer_email}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button onClick={handleCall} className="bg-gradient-to-r from-green-500 to-emerald-500">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button onClick={handleEmail} className="bg-gradient-to-r from-blue-500 to-cyan-500">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button onClick={handleSMS} className="bg-gradient-to-r from-purple-500 to-pink-500">
                <MessageSquare className="w-4 h-4 mr-2" />
                SMS
              </Button>
              <Button 
                onClick={() => setShowNavigation(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>
            </div>

            {/* Delivery Address */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-blue-900">Delivery Address</h3>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {order.delivery_address}
              </a>
            </div>

            {/* Order Items */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-gray-900">Order Items</h3>
              </div>
              <div className="space-y-2">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-600">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-900">Order Total</h3>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${order.subtotal?.toFixed(2) || order.total.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                {order.fees > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Fees</span>
                    <span>${order.fees.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-emerald-600">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-2">Notes</h3>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <NavigationModal
        isOpen={showNavigation}
        onClose={() => setShowNavigation(false)}
        order={order}
      />
    </>
  );
}