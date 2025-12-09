import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, MapPin, User, Mail, Phone, MessageSquare } from 'lucide-react';
import OrderStatusTracker from './OrderStatusTracker';

export default function OrderDetailModal({ order, isOpen, onClose }) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-xl border-white/40">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-900">
            Order Details
          </DialogTitle>
          <p className="text-emerald-600">
            Order #{order.id.slice(0, 8)} • {format(new Date(order.created_date), 'MMMM d, yyyy')}
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status Tracker */}
          <OrderStatusTracker status={order.status} />

          {/* Customer Information */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <h3 className="font-bold text-emerald-900 mb-3">Customer Information</h3>
            <div className="space-y-2">
              {order.customer_name && (
                <div className="flex items-center gap-2 text-emerald-700">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{order.customer_name}</span>
                </div>
              )}
              {order.customer_email && (
                <div className="flex items-center gap-2 text-emerald-700">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{order.customer_email}</span>
                </div>
              )}
              {order.customer_phone && (
                <div className="flex items-center gap-2 text-emerald-700">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{order.customer_phone}</span>
                </div>
              )}
              {order.delivery_address && (
                <div className="flex items-start gap-2 text-emerald-700">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{order.delivery_address}</span>
                </div>
              )}
              {order.notes && (
                <div className="flex items-start gap-2 text-emerald-700 mt-3 pt-3 border-t border-emerald-200">
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-emerald-500 mb-1">Notes</p>
                    <span className="text-sm">{order.notes}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-bold text-emerald-900 mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-xl bg-white/60 border border-white/40"
                >
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=100'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-900 text-sm">{item.name}</p>
                    <p className="text-emerald-600 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-700">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-emerald-500">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">${order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}