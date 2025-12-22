import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      // Get notifications for this user
      const allNotifications = await base44.entities.Notification.list('-created_date');
      
      return allNotifications.filter(n => {
        if (n.recipient_type === 'everyone') return true;
        if (n.recipient_type === 'individual' && n.recipient_email === user.email) return true;
        if (n.recipient_type === 'group' && n.recipient_group_ids?.includes(user.email)) return true;
        return false;
      });
    },
    enabled: !!user,
    refetchInterval: 30000 // Poll every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <button
        onClick={() => setIsPanelOpen(true)}
        className="relative p-2 rounded-xl hover:bg-emerald-50 transition-colors"
      >
        <Bell className="w-6 h-6 text-emerald-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        notifications={notifications}
        user={user}
      />
    </>
  );
}