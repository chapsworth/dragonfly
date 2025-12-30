import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Plus, Edit2, Trash2, Eye, Users, Target, Zap, Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import AdminNav from '@/components/admin/AdminNav';

export default function NotificationCenter() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [previewNotification, setPreviewNotification] = useState(null);
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    body: '',
    icon: '🔔',
    trigger: 'manual',
    target_audience: 'all_users',
    group_id: '',
    actions: [],
    is_active: true,
    play_sound: true,
    require_interaction: false
  });

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    user_emails: [],
    tags: []
  });

  const [sendForm, setSendForm] = useState({
    template_id: '',
    recipient_emails: [],
    custom_title: '',
    custom_body: ''
  });

  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: () => base44.entities.NotificationTemplate.list()
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['notification-groups'],
    queryFn: () => base44.entities.NotificationGroup.list()
  });

  const { data: sentNotifications = [] } = useQuery({
    queryKey: ['sent-notifications'],
    queryFn: () => base44.entities.SentNotification.list('-sent_date', 50)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.NotificationTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-templates']);
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
      toast.success('Template created');
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NotificationTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-templates']);
      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
      resetTemplateForm();
      toast.success('Template updated');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.NotificationTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-templates']);
      toast.success('Template deleted');
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.NotificationGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-groups']);
      setIsGroupDialogOpen(false);
      resetGroupForm();
      toast.success('Group created');
    }
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NotificationGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-groups']);
      setIsGroupDialogOpen(false);
      setSelectedGroup(null);
      resetGroupForm();
      toast.success('Group updated');
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id) => base44.entities.NotificationGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-groups']);
      toast.success('Group deleted');
    }
  });

  const sendNotificationMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('sendNotifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sent-notifications']);
      setIsSendDialogOpen(false);
      resetSendForm();
      toast.success('Notifications sent successfully');
    }
  });

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      title: '',
      body: '',
      icon: '🔔',
      trigger: 'manual',
      target_audience: 'all_users',
      group_id: '',
      actions: [],
      is_active: true,
      play_sound: true,
      require_interaction: false
    });
  };

  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      description: '',
      user_emails: [],
      tags: []
    });
  };

  const resetSendForm = () => {
    setSendForm({
      template_id: '',
      recipient_emails: [],
      custom_title: '',
      custom_body: ''
    });
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateForm(template);
    setIsTemplateDialogOpen(true);
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setGroupForm(group);
    setIsGroupDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const handleSaveGroup = () => {
    if (selectedGroup) {
      updateGroupMutation.mutate({ id: selectedGroup.id, data: groupForm });
    } else {
      createGroupMutation.mutate(groupForm);
    }
  };

  const handleAddAction = () => {
    setTemplateForm(prev => ({
      ...prev,
      actions: [...prev.actions, { label: '', action: 'navigate', page: '' }]
    }));
  };

  const handleRemoveAction = (index) => {
    setTemplateForm(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleActionChange = (index, field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const handlePreview = (template) => {
    setPreviewNotification(template);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(template.title, {
        body: template.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: template.require_interaction
      });
    }
  };

  const handleSendNotification = () => {
    let recipients = [];
    
    if (sendForm.recipient_emails.length > 0) {
      recipients = sendForm.recipient_emails;
    } else {
      const template = templates.find(t => t.id === sendForm.template_id);
      if (template) {
        if (template.target_audience === 'all_users') {
          recipients = users.map(u => u.email);
        } else if (template.target_audience === 'admins') {
          recipients = users.filter(u => u.role === 'admin').map(u => u.email);
        } else if (template.target_audience === 'customers') {
          recipients = users.filter(u => u.role !== 'admin').map(u => u.email);
        } else if (template.target_audience === 'specific_group' && template.group_id) {
          const group = groups.find(g => g.id === template.group_id);
          recipients = group?.user_emails || [];
        }
      }
    }

    if (recipients.length === 0) {
      toast.error('No recipients selected');
      return;
    }

    sendNotificationMutation.mutate({
      template_id: sendForm.template_id,
      recipient_emails: recipients,
      custom_title: sendForm.custom_title,
      custom_body: sendForm.custom_body
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
            <p className="text-gray-600">Manage notifications, templates, and groups</p>
          </div>
          <Button onClick={() => setIsSendDialogOpen(true)} className="bg-emerald-600">
            <Send className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates">
              <Bell className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Users className="w-4 h-4 mr-2" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="history">
              <Zap className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Notification Templates</h2>
              <Button onClick={() => setIsTemplateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge className="mt-1">{template.trigger}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handlePreview(template)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleEditTemplate(template)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => {
                            if (confirm('Delete this template?')) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">{template.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{template.body}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">{template.target_audience}</Badge>
                        {template.play_sound && <Badge variant="outline">🔊 Sound</Badge>}
                        {template.is_active && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Notification Groups</h2>
              <Button onClick={() => setIsGroupDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Group
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(group => (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <p className="text-sm text-gray-600">{group.user_emails?.length || 0} members</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEditGroup(group)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => {
                            if (confirm('Delete this group?')) {
                              deleteGroupMutation.mutate(group.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                    {group.tags?.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {group.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <h2 className="text-xl font-bold mb-4">Sent Notifications</h2>
            <div className="space-y-3">
              {sentNotifications.map(notif => (
                <Card key={notif.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{notif.icon}</span>
                          <p className="font-semibold">{notif.title}</p>
                          <Badge>{notif.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notif.body}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>To: {notif.recipient_email}</span>
                          <span>{new Date(notif.sent_date).toLocaleString()}</span>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    placeholder="e.g., New Order Alert"
                  />
                </div>
                <div>
                  <Label>Icon</Label>
                  <Input
                    value={templateForm.icon}
                    onChange={(e) => setTemplateForm({...templateForm, icon: e.target.value})}
                    placeholder="🔔"
                  />
                </div>
              </div>

              <div>
                <Label>Notification Title</Label>
                <Input
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({...templateForm, title: e.target.value})}
                  placeholder="New order received!"
                />
              </div>

              <div>
                <Label>Notification Body</Label>
                <Textarea
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({...templateForm, body: e.target.value})}
                  placeholder="You have a new order from {{customer_name}}"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Trigger</Label>
                  <Select value={templateForm.trigger} onValueChange={(v) => setTemplateForm({...templateForm, trigger: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="new_order">New Order</SelectItem>
                      <SelectItem value="order_confirmed">Order Confirmed</SelectItem>
                      <SelectItem value="order_preparing">Order Preparing</SelectItem>
                      <SelectItem value="order_out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="order_delivered">Order Delivered</SelectItem>
                      <SelectItem value="order_cancelled">Order Cancelled</SelectItem>
                      <SelectItem value="new_message">New Message</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="deal">Deal/Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target Audience</Label>
                  <Select value={templateForm.target_audience} onValueChange={(v) => setTemplateForm({...templateForm, target_audience: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                      <SelectItem value="admins">Admins</SelectItem>
                      <SelectItem value="drivers">Drivers</SelectItem>
                      <SelectItem value="specific_group">Specific Group</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {templateForm.target_audience === 'specific_group' && (
                <div>
                  <Label>Select Group</Label>
                  <Select value={templateForm.group_id} onValueChange={(v) => setTemplateForm({...templateForm, group_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={templateForm.is_active}
                    onChange={(e) => setTemplateForm({...templateForm, is_active: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={templateForm.play_sound}
                    onChange={(e) => setTemplateForm({...templateForm, play_sound: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label>Play Sound</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={templateForm.require_interaction}
                    onChange={(e) => setTemplateForm({...templateForm, require_interaction: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label>Require Interaction (stays on screen)</Label>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Action Buttons</Label>
                  <Button size="sm" onClick={handleAddAction}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Action
                  </Button>
                </div>
                <div className="space-y-2">
                  {templateForm.actions?.map((action, idx) => (
                    <div key={idx} className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                      <Input
                        placeholder="Button Label"
                        value={action.label}
                        onChange={(e) => handleActionChange(idx, 'label', e.target.value)}
                      />
                      <Input
                        placeholder="Page (e.g., Shop)"
                        value={action.page}
                        onChange={(e) => handleActionChange(idx, 'page', e.target.value)}
                      />
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveAction(idx)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsTemplateDialogOpen(false);
                  setSelectedTemplate(null);
                  resetTemplateForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  Save Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Group Dialog */}
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedGroup ? 'Edit Group' : 'Create Group'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Group Name</Label>
                <Input
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                  placeholder="e.g., VIP Customers"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                  placeholder="Group description..."
                  rows={2}
                />
              </div>

              <div>
                <Label>User Emails (comma-separated)</Label>
                <Textarea
                  value={groupForm.user_emails?.join(', ')}
                  onChange={(e) => setGroupForm({...groupForm, user_emails: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="user1@example.com, user2@example.com"
                  rows={3}
                />
              </div>

              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={groupForm.tags?.join(', ')}
                  onChange={(e) => setGroupForm({...groupForm, tags: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="vip, premium, regular"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsGroupDialogOpen(false);
                  setSelectedGroup(null);
                  resetGroupForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGroup}>
                  Save Group
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Notification Dialog */}
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Select Template (Optional)</Label>
                <Select value={sendForm.template_id} onValueChange={(v) => setSendForm({...sendForm, template_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template or create custom" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Custom Title (overrides template)</Label>
                <Input
                  value={sendForm.custom_title}
                  onChange={(e) => setSendForm({...sendForm, custom_title: e.target.value})}
                  placeholder="Leave empty to use template"
                />
              </div>

              <div>
                <Label>Custom Body (overrides template)</Label>
                <Textarea
                  value={sendForm.custom_body}
                  onChange={(e) => setSendForm({...sendForm, custom_body: e.target.value})}
                  placeholder="Leave empty to use template"
                  rows={3}
                />
              </div>

              <div>
                <Label>Recipients (comma-separated emails)</Label>
                <Textarea
                  value={sendForm.recipient_emails.join(', ')}
                  onChange={(e) => setSendForm({...sendForm, recipient_emails: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="Leave empty to use template's target audience"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsSendDialogOpen(false);
                  resetSendForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSendNotification} className="bg-emerald-600">
                  <Send className="w-4 h-4 mr-2" />
                  Send Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}