import React, { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Phone, MessageSquare, Navigation, Package, User, MapPin } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

export default function InteractiveOrderCard({ order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus) => base44.entities.Order.update(order.id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  const handleCall = () => {
    if (order.customer_phone) {
      window.location.href = `tel:${order.customer_phone}`;
    } else {
      toast.error('No phone number available');
    }
  };

  const handleText = () => {
    if (order.customer_phone) {
      const message = encodeURIComponent(`Hi ${order.customer_name || 'there'}, this is about your order #${order.id.slice(-8)}. Your order is ${order.status.replace('_', ' ')}. We'll keep you updated!`);
      window.location.href = `sms:${order.customer_phone}${/iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'}body=${message}`;
    } else {
      toast.error('No phone number available');
    }
  };

  const handleNavigation = (type) => {
    if (!order.delivery_address && !order.delivery_lat) {
      toast.error('No delivery address available');
      return;
    }

    if (order.delivery_lat && order.delivery_lng) {
      if (type === 'apple') {
        window.open(`http://maps.apple.com/?daddr=${order.delivery_lat},${order.delivery_lng}`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`, '_blank');
      }
    } else if (order.delivery_address) {
      const encoded = encodeURIComponent(order.delivery_address);
      if (type === 'apple') {
        window.open(`http://maps.apple.com/?daddr=${encoded}`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
      }
    }
  };

  return (
    <div className="rounded-xl bg-white border border-emerald-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-emerald-900 text-sm">Order #{order.id.slice(-8)}</p>
              <Badge className={statusColors[order.status]}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-emerald-600">
              {format(new Date(order.created_date + 'Z'), 'MMM d, h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <p className="font-bold text-emerald-900">${order.total?.toFixed(2)}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Status Update */}
        <div className="mb-2">
          <Select
            value={order.status}
            onValueChange={(value) => updateStatusMutation.mutate(value)}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger className="h-8 text-xs bg-emerald-50 border-emerald-200">
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCall}
            className="flex-1 h-8 text-xs"
            disabled={!order.customer_phone}
          >
            <Phone className="w-3 h-3 mr-1" />
            Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleText}
            className="flex-1 h-8 text-xs"
            disabled={!order.customer_phone}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
              handleNavigation(isMac ? 'apple' : 'google');
            }}
            className="flex-1 h-8 text-xs"
            disabled={!order.delivery_address && !order.delivery_lat}
          >
            <Navigation className="w-3 h-3 mr-1" />
            Nav
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-emerald-100 bg-emerald-50/50 p-3 space-y-3">
          {/* Customer Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-900">Customer</p>
            </div>
            <div className="pl-6 space-y-1">
              <p className="text-xs text-emerald-800">
                {order.customer_name || 'N/A'}
              </p>
              {order.customer_email && (
                <p className="text-xs text-emerald-600">{order.customer_email}</p>
              )}
              {order.customer_phone && (
                <p className="text-xs text-emerald-600">{order.customer_phone}</p>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          {order.delivery_address && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-900">Delivery Address</p>
              </div>
              <div className="pl-6">
                <p className="text-xs text-emerald-700">{order.delivery_address}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation('apple')}
                    className="h-7 text-xs"
                  >
                    Apple Maps
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation('google')}
                    className="h-7 text-xs"
                  >
                    Google Maps
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-900">Items ({order.items?.length || 0})</p>
            </div>
            <div className="pl-6 space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-white rounded-lg p-2 border border-emerald-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-emerald-900 font-medium truncate">{item.name}</p>
                      <p className="text-emerald-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-emerald-900 font-semibold ml-2">${item.price?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="pl-6 pt-2 border-t border-emerald-200">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-emerald-700">Subtotal:</span>
              <span className="text-emerald-900">${order.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-700">Discount:</span>
                <span className="text-red-600">-${order.discount?.toFixed(2)}</span>
              </div>
            )}
            {order.fees > 0 && (
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-700">Fees:</span>
                <span className="text-emerald-900">${order.fees?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-emerald-200">
              <span className="text-emerald-900">Total:</span>
              <span className="text-emerald-900">${order.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="pl-6 pt-2">
              <p className="text-xs font-semibold text-emerald-900 mb-1">Notes:</p>
              <p className="text-xs text-emerald-700 bg-white rounded p-2 border border-emerald-200">
                {order.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}