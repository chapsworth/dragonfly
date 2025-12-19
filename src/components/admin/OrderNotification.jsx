import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OrderNotification() {
  const [notifications, setNotifications] = useState([]);
  const [lastOrderId, setLastOrderId] = useState(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Create audio element for ding sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZXA0PVK3o6axdFAdCmuT0wXMjBi589+66aBoEMoTV9MyBLQYeYrjw4pRGCxNNqebxtWcaAzyJ0/LVgS0GInO/8OGZTQwPUq7n7rhiFQY9jtLz0oEtBx9tu+/jmE0MCE+v5+y4YhUGO4vP89KBLQcebLvv45hNDAhOsOjrsVsYBjyF0PPSgS0HH2u77+OYTQwIT7Do67FbGAY9htHy0n8tBh5ru+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmu77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmu77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmu77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8t');
    
    // Check for new orders every 10 seconds
    const interval = setInterval(async () => {
      try {
        const orders = await base44.entities.Order.list('-created_date', 1);
        const latestOrder = orders[0];
        
        if (latestOrder && latestOrder.id !== lastOrderId) {
          // New order detected
          if (lastOrderId !== null) { // Don't notify on initial load
            // Play sound
            audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
            
            // Show notification
            const notification = {
              id: latestOrder.id,
              customer: latestOrder.customer_name,
              total: latestOrder.total,
              timestamp: Date.now()
            };
            
            setNotifications(prev => [...prev, notification]);
            
            // Auto-dismiss after 10 seconds
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, 10000);
          }
          
          setLastOrderId(latestOrder.id);
        }
      } catch (error) {
        console.error('Failed to check for orders:', error);
      }
    }, 10000);

    // Initial load
    base44.entities.Order.list('-created_date', 1).then(orders => {
      if (orders[0]) {
        setLastOrderId(orders[0].id);
      }
    });

    return () => clearInterval(interval);
  }, [lastOrderId]);

  const handleNotificationClick = (orderId) => {
    navigate(createPageUrl('AdminOrders') + '?order=' + orderId);
    setNotifications(prev => prev.filter(n => n.id !== orderId));
  };

  const handleDismiss = (orderId, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== orderId));
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={() => handleNotificationClick(notification.id)}
            className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-4 rounded-xl shadow-2xl cursor-pointer hover:shadow-3xl transition-shadow min-w-[320px] max-w-[400px]"
          >
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">New Order! 🎉</div>
                <div className="text-sm text-white/90">
                  <div className="font-semibold">{notification.customer}</div>
                  <div className="text-white/80">${notification.total.toFixed(2)}</div>
                </div>
                <div className="text-xs text-white/70 mt-2">Click to view order</div>
              </div>
              <button
                onClick={(e) => handleDismiss(notification.id, e)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}