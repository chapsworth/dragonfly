import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, MapPin, Clock, Phone, Navigation, ChevronRight } from 'lucide-react';

export default function MultiDeliveryManager({ 
  orders, 
  currentOrderIndex, 
  onSelectOrder, 
  onCompleteDelivery,
  onNavigateToOrder 
}) {
  if (!orders || orders.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Delivery Route</h3>
            <p className="text-sm text-white/80">
              {orders.filter(o => o.status === 'delivered').length} of {orders.length} completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {currentOrderIndex + 1}/{orders.length}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3">
          {orders.map((order, index) => {
            const isCompleted = order.status === 'delivered';
            const isCurrent = index === currentOrderIndex;

            return (
              <div
                key={order.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50'
                    : isCompleted
                    ? 'border-green-300 bg-green-50 opacity-70'
                    : 'border-gray-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-900 mb-1">
                        {order.customer_name}
                      </p>
                      <div className="flex items-start gap-1 text-sm text-emerald-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="line-clamp-2">{order.delivery_address}</p>
                      </div>
                    </div>
                  </div>
                  {isCurrent && (
                    <Badge className="bg-emerald-500">Current</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-600 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>ETA: {order.eta_minutes || '—'} min</span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">${order.total?.toFixed(2)}</span>
                </div>

                <div className="flex gap-2">
                  {!isCompleted && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateToOrder(order)}
                        className="flex-1"
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Navigate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`tel:${order.customer_phone}`)}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {isCurrent && !isCompleted && (
                    <Button
                      size="sm"
                      onClick={() => onCompleteDelivery(order)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  {isCompleted && (
                    <Badge variant="outline" className="w-full justify-center py-2 text-green-600 border-green-300">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Delivered
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}