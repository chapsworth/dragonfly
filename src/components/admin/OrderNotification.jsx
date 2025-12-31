import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, MessageCircle, Bell, MapPin, Eye, List, Navigation, Phone, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function OrderNotification() {
  const [notifications, setNotifications] = useState([]);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [detailedOrder, setDetailedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if browser notifications are supported
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission === 'default') {
        setShowPermissionPrompt(true);
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === 'granted');
      setShowPermissionPrompt(false);
    }
  };

  const showBrowserNotification = (title, body, type, id, actions = []) => {
    if (permissionGranted) {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: type + (id || ''),
        requireInteraction: type === 'order',
        silent: false,
        vibrate: [200, 100, 200]
      });

      notification.onclick = () => {
        window.focus();
        if (type === 'order' && id) {
          navigate(createPageUrl('AdminOrders') + '?order=' + id);
        } else {
          navigate(createPageUrl('AdminOrders'));
        }
        notification.close();
      };
    }
  };

  useEffect(() => {
    // Create audio element for ding sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZXA0PVK3o6axdFAdCmuT0wXMjBi589+66aBoEMoTV9MyBLQYeYrjw4pRGCxNNqebxtWcaAzyJ0/LVgS0GInO/8OGZTQwPUq7n7rhiFQY9jtLz0oEtBx9tu+/jmE0MCE+v5+y4YhUGO4vP89KBLQcebLvv45hNDAhOsOjrsVsYBjyF0PPSgS0HH2u77+OYTQwIT7Do67FbGAY9htHy0n8tBh5ru+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmu77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmu77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmu77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8tBx5qu+/jmE0MCE6w6OutWxcGPIXQ89J/LQcearvv45hNDAhOsOjrrVsXBjyF0PPSfy0HHmq77+OYTQwITrDo661bFwY8hdDz0n8t');
    
    // Check for new orders and messages every 5 seconds
    const interval = setInterval(async () => {
      try {
        // Check for new orders
        const orders = await base44.entities.Order.list('-created_date', 1);
        const latestOrder = orders[0];
        
        if (latestOrder && latestOrder.id !== lastOrderId) {
          if (lastOrderId !== null) {
            audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
            
            const notification = {
              id: latestOrder.id,
              type: 'order',
              customer: latestOrder.customer_name,
              total: latestOrder.total,
              timestamp: Date.now(),
              order: latestOrder
            };
            
            // Show detailed modal
            setDetailedOrder(latestOrder);
            setShowDetailModal(true);
            
            showBrowserNotification(
              '🛍️ New Order Received!',
              `${latestOrder.customer_name} ordered $${latestOrder.total.toFixed(2)}`,
              'order',
              latestOrder.id
            );
            
            setNotifications(prev => [...prev, notification]);
            
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, 10000);
          }
          
          setLastOrderId(latestOrder.id);
        }

        // Check for new messages
        const messages = await base44.entities.ChatMessage.filter({ is_read: false }, '-created_date', 1);
        const latestMessage = messages[0];
        
        if (latestMessage && latestMessage.id !== lastMessageId) {
          if (lastMessageId !== null) {
            audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
            
            const notification = {
              id: latestMessage.id,
              type: 'message',
              sender: latestMessage.sender_name,
              message: latestMessage.message,
              timestamp: Date.now()
            };
            
            showBrowserNotification(
              '💬 New Message',
              `${latestMessage.sender_name}: ${latestMessage.message.substring(0, 50)}${latestMessage.message.length > 50 ? '...' : ''}`,
              'message'
            );
            
            setNotifications(prev => [...prev, notification]);
            
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, 10000);
          }
          
          setLastMessageId(latestMessage.id);
        }
      } catch (error) {
        console.error('Failed to check for notifications:', error);
      }
    }, 5000);

    // Initial load
    base44.entities.Order.list('-created_date', 1).then(orders => {
      if (orders[0]) {
        setLastOrderId(orders[0].id);
      }
    });

    base44.entities.ChatMessage.filter({ is_read: false }, '-created_date', 1).then(messages => {
      if (messages[0]) {
        setLastMessageId(messages[0].id);
      }
    }).catch(() => {});

    return () => clearInterval(interval);
  }, [lastOrderId, lastMessageId, permissionGranted, navigate]);

  const handleNotificationClick = (notification) => {
    if (notification.type === 'order' && notification.order) {
      setDetailedOrder(notification.order);
      setShowDetailModal(true);
    } else if (notification.type === 'order') {
      navigate(createPageUrl('AdminOrders') + '?order=' + notification.id);
    }
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  const handleDismiss = (orderId, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== orderId));
  };

  const handleViewTracker = () => {
    if (detailedOrder) {
      navigate(`${createPageUrl('CustomerOrderTracking')}?id=${detailedOrder.id}`);
      setShowDetailModal(false);
    }
  };

  const handleViewOrders = () => {
    navigate(createPageUrl('AdminOrders'));
    setShowDetailModal(false);
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
    preparing: 'bg-purple-100 text-purple-800 border-purple-300',
    out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-300',
    delivered: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <>
      {/* Detailed Order Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <ShoppingBag className="w-6 h-6 text-emerald-600" />
              New Order Received!
            </DialogTitle>
          </DialogHeader>
          
          {detailedOrder && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[detailedOrder.status]}`}>
                  {detailedOrder.status.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${detailedOrder.total.toFixed(2)}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    {detailedOrder.customer_name || 'Customer'}
                  </span>
                </div>
                {detailedOrder.customer_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${detailedOrder.customer_phone}`} className="hover:text-emerald-600">
                      {detailedOrder.customer_phone}
                    </a>
                  </div>
                )}
                {detailedOrder.delivery_address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{detailedOrder.delivery_address}</span>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Order Items ({detailedOrder.items?.length || 0})
                </h4>
                <div className="space-y-2">
                  {detailedOrder.items?.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {detailedOrder.items?.length > 3 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{detailedOrder.items.length - 3} more items
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={handleViewTracker}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Track Order
                </Button>
                <Button
                  onClick={handleViewOrders}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View in Orders
                </Button>
              </div>

              <Button
                onClick={() => setShowDetailModal(false)}
                variant="outline"
                className="w-full"
              >
                Dismiss
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Permission Prompt */}
      <AnimatePresence>
        {showPermissionPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 w-80 border-2 border-blue-500"
          >
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1 text-gray-900">Enable Notifications?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get notified of orders & messages even when the app is in the background
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={requestNotificationPermission} className="bg-blue-600">
                    Enable
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowPermissionPrompt(false)}>
                    Later
                  </Button>
                </div>
              </div>
              <button
                onClick={() => setShowPermissionPrompt(false)}
                className="hover:bg-gray-100 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={() => handleNotificationClick(notification)}
              className={`text-white p-4 rounded-xl shadow-2xl cursor-pointer hover:shadow-3xl transition-shadow min-w-[320px] max-w-[400px] ${
                notification.type === 'order' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  {notification.type === 'order' ? <ShoppingBag className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg mb-1">
                    {notification.type === 'order' ? 'New Order! 🎉' : 'New Message 💬'}
                  </div>
                  <div className="text-sm text-white/90">
                    {notification.type === 'order' ? (
                      <>
                        <div className="font-semibold">{notification.customer}</div>
                        <div className="text-white/80">${notification.total.toFixed(2)}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold">{notification.sender}</div>
                        <div className="text-white/80 line-clamp-2">{notification.message}</div>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-white/70 mt-2">Click to view</div>
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
    </>
  );
}