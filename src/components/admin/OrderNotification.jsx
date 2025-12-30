import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, MessageCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function OrderNotification() {
  const [notifications, setNotifications] = useState([]);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
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

  const showBrowserNotification = (title, body, type, id) => {
    if (permissionGranted && document.hidden) {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: type,
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        navigate(createPageUrl('AdminOrders') + (id ? '?order=' + id : ''));
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
              timestamp: Date.now()
            };
            
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

  const handleNotificationClick = (orderId) => {
    navigate(createPageUrl('AdminOrders') + '?order=' + orderId);
    setNotifications(prev => prev.filter(n => n.id !== orderId));
  };

  const handleDismiss = (orderId, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== orderId));
  };

  return (
    <>
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
              onClick={() => handleNotificationClick(notification.id)}
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