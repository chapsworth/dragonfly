import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';

export default function MultiDeliveryManager({ 
  orders, 
  currentOrderIndex, 
  completedOrders,
  onOrderSelect,
  onCallCustomer 
}) {
  if (!orders || orders.length === 0) {
    return (
      <Card className="p-4 bg-white">
        <p className="text-sm text-gray-400">No deliveries in queue</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-lg">Delivery Queue</h3>
        </div>
        <Badge variant="secondary">
          {completedOrders.length}/{orders.length} Complete
        </Badge>
      </div>

      <div className="space-y-3">
        {orders.map((order, idx) => {
          const isCompleted = completedOrders.includes(order.id);
          const isCurrent = idx === currentOrderIndex;
          const isPending = idx > currentOrderIndex;

          return (
            <div
              key={order.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                isCompleted
                  ? 'bg-green-50 border-green-300 opacity-75'
                  : isCurrent
                  ? 'bg-emerald-100 border-emerald-500 shadow-lg'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => !isCompleted && onOrderSelect(idx)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm">{order.customer_name}</p>
                      <p className="text-xs text-gray-600">#{order.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">${order.total.toFixed(2)}</p>
                      <Badge className="text-xs mt-1">
                        {order.items?.length || 0} items
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-gray-600 mb-2">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">{order.delivery_address}</p>
                  </div>

                  {order.eta_minutes && !isCompleted && (
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span className="text-blue-600 font-semibold">
                        ETA: {order.eta_minutes} min
                      </span>
                    </div>
                  )}

                  {isCurrent && !isCompleted && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCallCustomer(order);
                        }}
                        className="flex-1"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500"
                      >
                        Navigate
                      </Button>
                    </div>
                  )}

                  {isCompleted && (
                    <Badge className="bg-green-500 text-white text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Delivered
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}