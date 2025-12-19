import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Send, Edit2, Trash2, Users, User, Globe, Search, X } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date')
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    }
  });

  const filteredNotifications = notifications.filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.message?.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white pt-24 pb-32 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-red-900 mb-4">Access Denied</h1>
          <p className="text-red-600">Only administrators can manage notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-emerald-900 mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8 sm:w-10 sm:h-10" />
              Notification Manager
            </h1>
            <p className="text-emerald-600">Send notifications to customers</p>
          </div>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-emerald-500 to-green-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Notification
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-white border-emerald-200">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-emerald-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-white border-emerald-200">
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                <p className="text-emerald-600">No notifications found</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card key={notification.id} className="bg-white border-emerald-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-emerald-900">{notification.title}</h3>
                        <Badge className="bg-emerald-500 text-white">{notification.type}</Badge>
                        <Badge className="bg-purple-500 text-white">{notification.priority}</Badge>
                        {notification.recipient_type === 'everyone' && (
                          <Badge className="bg-blue-500 text-white flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Everyone
                          </Badge>
                        )}
                        {notification.recipient_type === 'individual' && (
                          <Badge className="bg-orange-500 text-white flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Individual
                          </Badge>
                        )}
                        {notification.recipient_type === 'group' && (
                          <Badge className="bg-pink-500 text-white flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Group ({notification.recipient_group_ids?.length || 0})
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{new Date(notification.created_date).toLocaleString()}</span>
                        {notification.link_type !== 'none' && (
                          <span className="text-emerald-600">
                            Links to: {notification.link_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNotification(notification);
                          setIsCreating(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Delete this notification?')) {
                            deleteMutation.mutate(notification.id);
                          }
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <NotificationDialog
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false);
          setEditingNotification(null);
        }}
        notification={editingNotification}
        contacts={contacts}
      />
    </div>
  );
}

function NotificationDialog({ isOpen, onClose, notification, contacts }) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    link_type: 'none',
    link_value: '',
    recipient_type: 'everyone',
    recipient_email: '',
    recipient_group_ids: [],
    priority: 'normal',
    icon: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (notification) {
      setFormData(notification);
      if (notification.recipient_group_ids) {
        const selected = contacts.filter(c => notification.recipient_group_ids.includes(c.id));
        setSelectedContacts(selected);
      }
    } else if (!isOpen) {
      setFormData({
        title: '',
        message: '',
        type: 'info',
        link_type: 'none',
        link_value: '',
        recipient_type: 'everyone',
        recipient_email: '',
        recipient_group_ids: [],
        priority: 'normal',
        icon: ''
      });
      setSelectedContacts([]);
    }
  }, [notification, isOpen, contacts]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification sent');
      onClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Notification.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification updated');
      onClose();
    }
  });

  const handleSave = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.recipient_type === 'individual' && !formData.recipient_email) {
      toast.error('Please select a recipient');
      return;
    }

    if (formData.recipient_type === 'group' && selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }

    const data = {
      ...formData,
      recipient_group_ids: formData.recipient_type === 'group' ? selectedContacts.map(c => c.id) : []
    };

    if (notification) {
      updateMutation.mutate({ id: notification.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const availableContacts = contacts.filter(c =>
    !selectedContacts.find(sc => sc.id === c.id) &&
    (c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            {notification ? 'Edit Notification' : 'Create Notification'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Notification title..."
              className="border-emerald-200"
            />
          </div>

          {/* Message */}
          <div>
            <Label>Message *</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Notification message..."
              className="h-32 border-emerald-200"
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Link Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Link Type</Label>
              <Select value={formData.link_type} onValueChange={(val) => setFormData({ ...formData, link_type: val, link_value: '' })}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Link</SelectItem>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="url">Custom URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.link_type !== 'none' && (
              <div>
                <Label>Link Value</Label>
                <Input
                  value={formData.link_value}
                  onChange={(e) => setFormData({ ...formData, link_value: e.target.value })}
                  placeholder={
                    formData.link_type === 'page' ? 'PageName' :
                    formData.link_type === 'url' ? 'https://...' :
                    'ID'
                  }
                  className="border-emerald-200"
                />
              </div>
            )}
          </div>

          {/* Recipient Settings */}
          <div>
            <Label>Send To *</Label>
            <Select value={formData.recipient_type} onValueChange={(val) => setFormData({ ...formData, recipient_type: val })}>
              <SelectTrigger className="border-emerald-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="individual">Individual Contact</SelectItem>
                <SelectItem value="group">Custom Group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Individual Selection */}
          {formData.recipient_type === 'individual' && (
            <div>
              <Label>Select Contact</Label>
              <Select value={formData.recipient_email} onValueChange={(val) => setFormData({ ...formData, recipient_email: val })}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue placeholder="Choose a contact..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.email}>
                      {contact.full_name} ({contact.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Group Selection */}
          {formData.recipient_type === 'group' && (
            <div>
              <Label>Selected Contacts ({selectedContacts.length})</Label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[60px] p-3 border rounded-lg border-emerald-200 bg-emerald-50">
                {selectedContacts.length === 0 ? (
                  <p className="text-sm text-gray-500">No contacts selected</p>
                ) : (
                  selectedContacts.map(contact => (
                    <Badge key={contact.id} className="bg-emerald-500 text-white flex items-center gap-1">
                      {contact.full_name}
                      <button
                        onClick={() => setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id))}
                        className="hover:bg-emerald-600 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-emerald-200"
                />
              </div>
              {searchTerm && availableContacts.length > 0 && (
                <div className="mt-2 border border-emerald-200 rounded-lg max-h-48 overflow-y-auto">
                  {availableContacts.slice(0, 20).map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setSelectedContacts([...selectedContacts, contact]);
                        setSearchTerm('');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors border-b border-emerald-100 last:border-b-0"
                    >
                      <div className="font-semibold text-sm">{contact.full_name}</div>
                      <div className="text-xs text-gray-600">{contact.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-emerald-500 to-green-500"
            >
              <Send className="w-4 h-4 mr-2" />
              {notification ? 'Update' : 'Send'} Notification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}