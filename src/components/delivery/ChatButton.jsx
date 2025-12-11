import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';

export default function ChatButton({ onClick, unreadCount = 0 }) {
  return (
    <Button 
      onClick={onClick}
      className="relative bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Chat
      {unreadCount > 0 && (
        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-1.5 py-0.5 text-xs min-w-[20px] h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}