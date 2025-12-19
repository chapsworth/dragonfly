import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info, Package, DollarSign, Megaphone, AlertTriangle, ExternalLink } from 'lucide-react';

export default function NotificationDetail({ notification, isOpen, onClose, onAction }) {
  const getNotificationIcon = (type, priority) => {
    if (priority === 'urgent') return <AlertTriangle className="w-8 h-8 text-red-500" />;
    if (priority === 'high') return <AlertCircle className="w-8 h-8 text-orange-500" />;
    
    switch (type) {
      case 'deal': return <DollarSign className="w-8 h-8 text-green-500" />;
      case 'order': return <Package className="w-8 h-8 text-blue-500" />;
      case 'product': return <Package className="w-8 h-8 text-purple-500" />;
      case 'announcement': return <Megaphone className="w-8 h-8 text-indigo-500" />;
      case 'alert': return <AlertCircle className="w-8 h-8 text-orange-500" />;
      default: return <Info className="w-8 h-8 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      urgent: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      normal: 'bg-blue-500 text-white',
      low: 'bg-gray-500 text-white'
    };
    return <Badge className={colors[priority] || colors.normal}>{priority.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type) => {
    const colors = {
      deal: 'bg-green-100 text-green-800',
      order: 'bg-blue-100 text-blue-800',
      product: 'bg-purple-100 text-purple-800',
      announcement: 'bg-indigo-100 text-indigo-800',
      alert: 'bg-orange-100 text-orange-800',
      info: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[type] || colors.info}>{type}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getNotificationIcon(notification.type, notification.priority)}
            <span className="flex-1">{notification.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Badges */}
          <div className="flex gap-2">
            {getPriorityBadge(notification.priority)}
            {getTypeBadge(notification.type)}
            {notification.recipient_type === 'everyone' && (
              <Badge className="bg-emerald-100 text-emerald-800">Everyone</Badge>
            )}
          </div>

          {/* Message */}
          <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-lg border border-emerald-200">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium mb-1">Sent</p>
              <p className="text-gray-900">
                {new Date(notification.created_date).toLocaleString()}
              </p>
            </div>
            {notification.link_type !== 'none' && (
              <div>
                <p className="text-gray-600 font-medium mb-1">Linked To</p>
                <p className="text-gray-900 capitalize">{notification.link_type}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {notification.link_type !== 'none' && (
              <Button 
                onClick={() => {
                  onAction();
                  onClose();
                }}
                className="bg-gradient-to-r from-emerald-500 to-green-500"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Go to {notification.link_type}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}