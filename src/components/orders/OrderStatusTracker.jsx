import React from 'react';
import { Check, Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const orderSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle }
];

const statusIndex = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: -1
};

export default function OrderStatusTracker({ status, compact = false }) {
  const currentIndex = statusIndex[status] ?? 0;
  const isCancelled = status === 'cancelled';

  if (compact) {
    const currentStep = orderSteps[currentIndex] || orderSteps[0];
    const Icon = isCancelled ? XCircle : currentStep.icon;
    
    return (
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isCancelled ? "bg-red-100" : "bg-emerald-100"
        )}>
          <Icon className={cn(
            "w-4 h-4",
            isCancelled ? "text-red-600" : "text-emerald-600"
          )} />
        </div>
        <span className={cn(
          "font-medium",
          isCancelled ? "text-red-600" : "text-emerald-800"
        )}>
          {isCancelled ? 'Cancelled' : currentStep.label}
        </span>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200">
        <div className="flex items-center gap-3 text-red-600">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-lg">Order Cancelled</p>
            <p className="text-sm text-red-500">This order has been cancelled</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white/60 backdrop-blur border border-white/40">
      <h3 className="font-bold text-emerald-900 mb-6">Order Progress</h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-emerald-100" />
        <div 
          className="absolute left-6 top-6 w-0.5 bg-gradient-to-b from-emerald-400 to-green-500 transition-all duration-500"
          style={{ height: `${(currentIndex / (orderSteps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="space-y-6">
          {orderSteps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-center gap-4"
              >
                <div className={cn(
                  "relative z-10 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  isCompleted 
                    ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30" 
                    : "bg-white border-2 border-emerald-100"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isCompleted ? "text-white" : "text-emerald-300"
                  )} />
                </div>

                <div className="flex-1">
                  <p className={cn(
                    "font-semibold transition-colors",
                    isCompleted ? "text-emerald-900" : "text-emerald-400"
                  )}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-emerald-600 mt-0.5"
                    >
                      In progress...
                    </motion.p>
                  )}
                </div>

                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}