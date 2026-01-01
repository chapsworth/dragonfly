import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function CapacitorPushNotifications() {
  useEffect(() => {
    const registerPushNotifications = async () => {
      try {
        // Check if running in Capacitor
        if (typeof window.Capacitor === 'undefined') {
          console.log('Not running in Capacitor environment');
          return;
        }

        const { PushNotifications } = window.Capacitor.Plugins;
        if (!PushNotifications) {
          console.log('PushNotifications plugin not available');
          return;
        }

        // Check if user is authenticated
        const user = await base44.auth.me().catch(() => null);
        if (!user) {
          console.log('User not authenticated');
          return;
        }

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        
        if (permResult.receive === 'granted') {
          // Register with APNs/FCM
          await PushNotifications.register();
        } else {
          console.log('Push notification permission denied');
        }

        // Handle registration success
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token:', token.value);
          
          // Determine platform
          const platform = window.Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
          
          // Send token to backend
          try {
            await base44.functions.invoke('registerDeviceToken', {
              device_token: token.value,
              platform
            });
            console.log('Device token registered successfully');
          } catch (error) {
            console.error('Failed to register device token:', error);
          }
        });

        // Handle registration error
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration:', error);
        });

        // Handle push notification received (app in foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
          
          // Show in-app notification
          if (notification.data?.type === 'new_order') {
            const event = new CustomEvent('newOrderNotification', {
              detail: {
                order_id: notification.data.order_id,
                order_number: notification.data.order_number,
                customer_name: notification.data.customer_name,
                total: parseFloat(notification.data.total)
              }
            });
            window.dispatchEvent(event);
          }
        });

        // Handle push notification action performed (app in background/closed)
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push notification action performed:', action);
          
          // Navigate to the order page
          if (action.notification.data?.url) {
            window.location.href = action.notification.data.url;
          }
        });

      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    registerPushNotifications();

    // Cleanup listeners on unmount
    return () => {
      if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins.PushNotifications) {
        window.Capacitor.Plugins.PushNotifications.removeAllListeners();
      }
    };
  }, []);

  return null;
}