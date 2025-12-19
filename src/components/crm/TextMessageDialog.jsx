import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Copy, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function TextMessageDialog({ contact, isOpen, onClose }) {
  const [selectedMessage, setSelectedMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['textTemplates'],
    queryFn: () => base44.entities.TextTemplate.filter({ is_active: true })
  });

  const handleTemplateClick = (template) => {
    setSelectedMessage(template.message);
    setCustomMessage(template.message);
  };

  const handleCopyMessage = () => {
    if (customMessage) {
      navigator.clipboard.writeText(customMessage);
      toast.success('Message copied to clipboard');
    } else {
      toast.error('Please select a message first');
    }
  };

  const handleSendSMS = () => {
    if (!contact?.phone) {
      toast.error('Contact has no phone number');
      return;
    }
    if (!customMessage) {
      toast.error('Please select or write a message');
      return;
    }

    // Open SMS app with pre-filled message
    const phoneNumber = contact.phone.replace(/\D/g, '');
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(customMessage)}`;
    window.location.href = smsUrl;
    
    toast.success('Opening messaging app...');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Text {contact?.full_name}
          </DialogTitle>
          {contact?.phone && (
            <p className="text-sm text-gray-600">{contact.phone}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Template Selection */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Pre-written Messages</h3>
            <div className="grid gap-2 max-h-[300px] overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selectedMessage === template.message
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-semibold text-sm text-gray-900">{template.title}</div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{template.message}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Preview/Edit */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Message</h3>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Select a template or write your own message..."
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleCopyMessage}
              variant="outline"
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Message
            </Button>
            <Button
              onClick={handleSendSMS}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Text
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}