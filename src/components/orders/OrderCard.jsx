import React from 'react';
import { format } from 'date-fns';
import { Package, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderStatusTracker from './OrderStatusTracker';

export default function OrderCard({ order, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="p-4 sm:p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-emerald-900">Order #{order.id.slice(0, 8)}</p>
            <p className="text-sm text-emerald-600">
              {format(new Date(order.created_date), 'MMM d, yyyy • h:mm a')}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
      </div>

      <div className="mb-4">
        <OrderStatusTracker status={order.status} compact={true} />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-emerald-100">
        <div>
          <p className="text-sm text-emerald-600">{order.items?.length || 0} items</p>
        </div>
        <p className="text-lg font-bold text-emerald-900">${order.total?.toFixed(2)}</p>
      </div>
    </motion.div>
  );
}