import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ChatModal({ order, isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', order?.id],
    queryFn: async () => {
      if (!order?.id) return [];
      const allMessages = await base44.entities.ChatMessage.filter({ order_id: order.id }, 'created_date');
      
      // Mark messages as read
      const unreadMessages = allMessages.filter(m => !m.is_read && m.sender_email !== currentUser?.email);
      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(msg => 
            base44.entities.ChatMessage.update(msg.id, { is_read: true })
          )
        );
      }
      
      return allMessages;
    },
    enabled: isOpen && !!order?.id,
    refetchInterval: 3000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      const senderType = order.driver_email === currentUser?.email ? 'driver' : 'customer';
      
      await base44.entities.ChatMessage.create({
        order_id: order.id,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        sender_type: senderType,
        message: messageText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', order?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
      setMessage('');
      toast.success('Message sent');
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat with {order.customer_name}</DialogTitle>
          <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</p>
        </DialogHeader>

        <ScrollArea ref={scrollRef} className="flex-1 p-4 bg-gray-50 rounded-lg">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_email === currentUser?.email;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMe 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      <p className={`text-xs font-semibold mb-1 ${isMe ? 'text-emerald-100' : 'text-gray-600'}`}>
                        {msg.sender_name}
                      </p>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                        {format(new Date(msg.created_date), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSend} className="flex gap-2 mt-4">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-emerald-500 to-green-500"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}