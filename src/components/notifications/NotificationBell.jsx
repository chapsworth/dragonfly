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
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsPanelOpen(true)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 min-w-[20px] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        notifications={notifications}
        user={user}
      />
    </>
  );
}