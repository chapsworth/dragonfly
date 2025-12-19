import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, X, Loader2, FileText, Sparkles, QrCode } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function EmailComposer({ isOpen, onClose, contacts, preSelectedContacts = [] }) {
  const [selectedContacts, setSelectedContacts] = useState(preSelectedContacts);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [includeAppLink, setIncludeAppLink] = useState(true);
  const [includeQR, setIncludeQR] = useState(true);

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.filter({ is_active: true })
  });

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

  const handleUseTemplate = (template) => {
    setSubject(template.subject);
    setMessage(template.body);
    toast.success('Template applied');
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

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
      const appUrl = window.location.origin;
      let qrCodeUrl = '';
      
      if (includeQR) {
        const qrResponse = await base44.functions.invoke('generateQRCode', { 
          text: appUrl, 
          size: 200 
        });
        qrCodeUrl = qrResponse.data.qr_url;
      }

      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
    .logo { color: white; font-size: 28px; font-weight: bold; margin: 0; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .app-link { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .qr-section { text-align: center; margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; }
    .qr-section img { max-width: 200px; height: auto; }
    .qr-section p { color: #6b7280; margin-top: 10px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">🌿 Dragonfly</h1>
    </div>
    <div class="content">
      ${message.replace(/\n/g, '<br>')}
      ${includeAppLink ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}" class="app-link">Visit Dragonfly</a>
      </div>
      ` : ''}
      ${includeQR && qrCodeUrl ? `
      <div class="qr-section">
        <p style="font-weight: bold; color: #111827; margin-bottom: 15px;">Scan to visit our app</p>
        <img src="${qrCodeUrl}" alt="QR Code">
        <p>Scan this QR code with your phone camera</p>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p style="color: #6b7280; margin: 0; font-size: 14px;">
        You're receiving this because you're a valued customer of Dragonfly.
      </p>
      <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
        © 2024 Dragonfly. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

      const emailPromises = selectedContacts.map(contact =>
        base44.integrations.Core.SendEmail({
          from_name: 'Dragonfly',
          to: contact.email,
          subject: subject,
          body: htmlBody
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
          {/* Templates Section */}
          {templates.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-purple-600" />
                <Label className="text-purple-900 font-semibold">Use Template</Label>
              </div>
              
              <div className="flex gap-2 mb-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-white border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    <SelectItem value="outreach">Outreach</SelectItem>
                    <SelectItem value="orders">Orders</SelectItem>
                    <SelectItem value="deals">Deals</SelectItem>
                    <SelectItem value="holidays">Holidays</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleUseTemplate(template)}
                    className="text-left p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-purple-900 truncate">{template.name}</div>
                        <div className="text-xs text-gray-600 truncate">{template.subject}</div>
                      </div>
                      <Badge className="bg-purple-500 text-[10px] shrink-0">
                        {template.category}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {/* HTML Options */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <Label className="text-purple-900 font-semibold mb-3 block">Email Enhancements</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="app-link" 
                  checked={includeAppLink}
                  onCheckedChange={setIncludeAppLink}
                />
                <label htmlFor="app-link" className="text-sm cursor-pointer">
                  Include branded app link button
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="qr-code" 
                  checked={includeQR}
                  onCheckedChange={setIncludeQR}
                />
                <label htmlFor="qr-code" className="text-sm cursor-pointer flex items-center gap-1">
                  <QrCode className="w-4 h-4" />
                  Include QR code for easy mobile access
                </label>
              </div>
            </div>
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