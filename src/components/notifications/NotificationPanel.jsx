import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCheck, Trash2, X, AlertCircle, Info, Package, DollarSign, Megaphone, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NotificationDetail from './NotificationDetail';

export default function NotificationPanel({ isOpen, onClose, notifications, user }) {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    setSelectedNotification(notification);
  };

  const handleNotificationAction = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.link_type === 'none') return;

    onClose();

    switch (notification.link_type) {
      case 'page':
        navigate(createPageUrl(notification.link_value));
        break;
      case 'product':
        navigate(createPageUrl('ProductDetail') + `?id=${notification.link_value}`);
        break;
      case 'deal':
        navigate(createPageUrl('CRMDeals'));
        break;
      case 'order':
        navigate(createPageUrl('Orders'));
        break;
      case 'url':
        window.open(notification.link_value, '_blank');
        break;
    }
  };

  const getNotificationIcon = (type, priority) => {
    if (priority === 'urgent') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (priority === 'high') return <AlertCircle className="w-5 h-5 text-orange-500" />;
    
    switch (type) {
      case 'deal': return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'order': return <Package className="w-5 h-5 text-blue-500" />;
      case 'product': return <Package className="w-5 h-5 text-purple-500" />;
      case 'announcement': return <Megaphone className="w-5 h-5 text-indigo-500" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300';
      case 'high': return 'bg-orange-100 border-orange-300';
      case 'normal': return 'bg-white border-gray-200';
      case 'low': return 'bg-gray-50 border-gray-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAllReadMutation.mutate()}
                  className="gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-2">
            {notifications.length === 0 ? (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No notifications</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    getPriorityColor(notification.priority)
                  } ${!notification.is_read ? 'border-l-4 border-l-emerald-500' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      <div 
                        className="flex-1 min-w-0"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-bold text-sm ${!notification.is_read ? 'text-emerald-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this notification?')) {
                                deleteMutation.mutate(notification.id);
                              }
                            }}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_date).toLocaleString()}
                          </span>
                          {notification.link_type !== 'none' && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationAction(notification);
                              }}
                              className="h-7 text-xs bg-gradient-to-r from-emerald-500 to-green-500"
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {selectedNotification && (
        <NotificationDetail
          notification={selectedNotification}
          isOpen={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onAction={() => handleNotificationAction(selectedNotification)}
        />
      )}
    </>
  );
}