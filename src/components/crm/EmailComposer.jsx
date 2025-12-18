import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EmailComposer({ isOpen, onClose, contacts, preSelectedContacts = [] }) {
  const [selectedContacts, setSelectedContacts] = useState(preSelectedContacts);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(c => 
    c.email && 
    !selectedContacts.find(sc => sc.id === c.id) &&
    (c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddContact = (contact) => {
    setSelectedContacts([...selectedContacts, contact]);
    setSearchTerm('');
  };

  const handleRemoveContact = (contactId) => {
    setSelectedContacts(selectedContacts.filter(c => c.id !== contactId));
  };

  const handleSend = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      const emailPromises = selectedContacts.map(contact =>
        base44.integrations.Core.SendEmail({
          to: contact.email,
          subject: subject,
          body: message
        })
      );

      await Promise.all(emailPromises);
      
      toast.success(`Email sent to ${selectedContacts.length} contact(s)`);
      setSelectedContacts([]);
      setSubject('');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send email: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            Compose Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Recipients */}
          <div>
            <Label>To</Label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 border rounded-lg border-purple-200">
              {selectedContacts.map(contact => (
                <Badge key={contact.id} className="bg-purple-500 text-white flex items-center gap-1">
                  {contact.full_name} ({contact.email})
                  <button
                    onClick={() => handleRemoveContact(contact.id)}
                    className="hover:bg-purple-600 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="relative">
              <Input
                placeholder="Search contacts by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-purple-200"
              />
              {searchTerm && filteredContacts.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-purple-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredContacts.slice(0, 10).map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => handleAddContact(contact)}
                      className="w-full px-4 py-2 text-left hover:bg-purple-50 transition-colors"
                    >
                      <div className="font-semibold text-sm">{contact.full_name}</div>
                      <div className="text-xs text-gray-600">{contact.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="border-purple-200"
            />
          </div>

          {/* Message */}
          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="h-64 border-purple-200"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={isSending || selectedContacts.length === 0 || !subject.trim() || !message.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send to {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}