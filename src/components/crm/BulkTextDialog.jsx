import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkTextDialog({ contacts, isOpen, onClose }) {
  const [selectedMessage, setSelectedMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  const { data: templates = [] } = useQuery({
    queryKey: ['textTemplates'],
    queryFn: () => base44.entities.TextTemplate.filter({ is_active: true })
  });

  // Group contacts alphabetically in batches of 32
  const contactGroups = useMemo(() => {
    const contactsWithPhone = contacts.filter(c => c.phone);
    const sorted = [...contactsWithPhone].sort((a, b) => 
      (a.full_name || '').localeCompare(b.full_name || '')
    );

    const groups = [];
    for (let i = 0; i < sorted.length; i += 32) {
      const batch = sorted.slice(i, i + 32);
      const firstLetter = batch[0]?.full_name?.[0]?.toUpperCase() || '?';
      const lastLetter = batch[batch.length - 1]?.full_name?.[0]?.toUpperCase() || '?';
      groups.push({
        id: i,
        label: `Group ${Math.floor(i / 32) + 1}: ${firstLetter} - ${lastLetter}`,
        contacts: batch,
        start: firstLetter,
        end: lastLetter
      });
    }
    return groups;
  }, [contacts]);

  const handleTemplateClick = (template) => {
    setSelectedMessage(template.message);
    setCustomMessage(template.message);
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleSendToGroup = (group) => {
    if (!customMessage) {
      toast.error('Please select or write a message first');
      return;
    }

    const phoneNumbers = group.contacts.map(c => c.phone.replace(/\D/g, '')).join(',');
    const smsUrl = `sms:${phoneNumbers}${/iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(customMessage)}`;
    
    window.location.href = smsUrl;
    toast.success(`Opening message to ${group.contacts.length} contacts...`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Bulk Text Messaging
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {contactGroups.length} groups of up to 32 contacts each
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Template Selection */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Select Message Template</h3>
            <div className="grid gap-2 max-h-[200px] overflow-y-auto">
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
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Contact Groups */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Contact Groups (32 per group)</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {contactGroups.map((group) => (
                <Card key={group.id} className="border-emerald-200">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold">
                          {Math.floor(group.id / 32) + 1}
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-emerald-900">{group.label}</h4>
                          <p className="text-sm text-emerald-600">
                            <Users className="w-3 h-3 inline mr-1" />
                            {group.contacts.length} contacts
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendToGroup(group);
                          }}
                          className="bg-gradient-to-r from-emerald-500 to-green-500"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Text Group
                        </Button>
                        {expandedGroups[group.id] ? (
                          <ChevronUp className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                    </button>

                    {expandedGroups[group.id] && (
                      <div className="px-4 pb-4 border-t border-emerald-100">
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {group.contacts.map((contact) => (
                            <div key={contact.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                                {contact.full_name?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{contact.full_name}</p>
                                <p className="text-xs text-gray-600 truncate">{contact.phone}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {contactGroups.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No contacts with phone numbers found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}