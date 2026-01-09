import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, Send, Users, FileText, Zap, Plus, Edit2, Trash2, 
  Copy, Loader2, Check, X, Search, Sparkles, Clock, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmailCenter() {
  const [activeTab, setActiveTab] = useState('send');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isTriggerDialogOpen, setIsTriggerDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const [emailForm, setEmailForm] = useState({
    recipient_type: 'individual',
    recipient_email: '',
    recipient_group_id: '',
    subject: '',
    body: '',
    template_id: '',
    schedule_date: '',
    schedule_time: ''
  });
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.list()
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['email-groups'],
    queryFn: () => base44.entities.EmailGroup.list()
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ['email-triggers'],
    queryFn: () => base44.entities.EmailTrigger.list()
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-templates']);
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      toast.success('Template created');
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-templates']);
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      toast.success('Template updated');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-templates']);
      toast.success('Template deleted');
    }
  });

  // Group mutations
  const createGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-groups']);
      setIsGroupDialogOpen(false);
      setEditingGroup(null);
      toast.success('Group created');
    }
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-groups']);
      setIsGroupDialogOpen(false);
      setEditingGroup(null);
      toast.success('Group updated');
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-groups']);
      toast.success('Group deleted');
    }
  });

  // Trigger mutations
  const createTriggerMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailTrigger.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-triggers']);
      setIsTriggerDialogOpen(false);
      setEditingTrigger(null);
      toast.success('Trigger created');
    }
  });

  const updateTriggerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailTrigger.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-triggers']);
      setIsTriggerDialogOpen(false);
      setEditingTrigger(null);
      toast.success('Trigger updated');
    }
  });

  const deleteTriggerMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTrigger.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-triggers']);
      toast.success('Trigger deleted');
    }
  });

  const handleSendEmail = async () => {
    if (!emailForm.subject || !emailForm.body) {
      toast.error('Subject and body are required');
      return;
    }

    setSendingEmail(true);
    try {
      let recipients = [];
      
      if (emailForm.recipient_type === 'individual') {
        if (!emailForm.recipient_email) {
          toast.error('Please enter recipient email');
          return;
        }
        recipients = [emailForm.recipient_email];
      } else if (emailForm.recipient_type === 'group') {
        const group = groups.find(g => g.id === emailForm.recipient_group_id);
        recipients = group?.member_emails || [];
      } else if (emailForm.recipient_type === 'all_users') {
        recipients = users.map(u => u.email);
      } else if (emailForm.recipient_type === 'all_contacts') {
        recipients = contacts.map(c => c.email).filter(Boolean);
      }

      // Check if scheduled
      if (emailForm.schedule_date && emailForm.schedule_time) {
        toast.info('Scheduled emails coming soon - sending immediately for now');
      }

      for (const email of recipients) {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: emailForm.subject,
          body: emailForm.body
        });
      }

      toast.success(`Email sent to ${recipients.length} recipient(s)`);
      setEmailForm({
        recipient_type: 'individual',
        recipient_email: '',
        recipient_group_id: '',
        subject: '',
        body: '',
        template_id: '',
        schedule_date: '',
        schedule_time: ''
      });
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt) {
      toast.error('Please enter a prompt');
      return;
    }

    setGeneratingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional email based on this prompt: ${aiPrompt}\n\nReturn JSON with "subject" and "body" fields. The body should be well-formatted HTML with proper spacing and professional tone.`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" }
          }
        }
      });

      setEmailForm({
        ...emailForm,
        subject: result.subject,
        body: result.body
      });
      setIsAIAssistantOpen(false);
      setAiPrompt('');
      toast.success('Email generated!');
    } catch (error) {
      toast.error('Failed to generate email');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAIImprove = async () => {
    if (!emailForm.body) {
      toast.error('Please write some content first');
      return;
    }

    setGeneratingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Improve this email to be more professional, clear, and engaging:\n\nSubject: ${emailForm.subject}\n\nBody: ${emailForm.body}\n\nReturn improved version as JSON with "subject" and "body" fields.`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" }
          }
        }
      });

      setEmailForm({
        ...emailForm,
        subject: result.subject,
        body: result.body
      });
      toast.success('Email improved!');
    } catch (error) {
      toast.error('Failed to improve email');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleUseTemplate = (template) => {
    setEmailForm({
      ...emailForm,
      subject: template.subject,
      body: template.body,
      template_id: template.id
    });
    toast.success('Template loaded');
  };

  const filteredTemplates = templates.filter(t => 
    !searchQuery || 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Email Center</h1>
          <p className="text-gray-600">Send emails, manage templates, groups, and automated triggers</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="send">
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              Templates ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Users className="w-4 h-4 mr-2" />
              Groups ({groups.length})
            </TabsTrigger>
            <TabsTrigger value="triggers">
              <Zap className="w-4 h-4 mr-2" />
              Triggers ({triggers.length})
            </TabsTrigger>
          </TabsList>

          {/* Send Email Tab */}
          <TabsContent value="send">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Compose Email</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Recipient Type</Label>
                      <Select
                        value={emailForm.recipient_type}
                        onValueChange={(v) => setEmailForm({ ...emailForm, recipient_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="group">Group</SelectItem>
                          <SelectItem value="all_users">All Users</SelectItem>
                          <SelectItem value="all_contacts">All Contacts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {emailForm.recipient_type === 'individual' && (
                      <div>
                        <Label>Recipient Email</Label>
                        <Input
                          type="email"
                          value={emailForm.recipient_email}
                          onChange={(e) => setEmailForm({ ...emailForm, recipient_email: e.target.value })}
                          placeholder="user@example.com"
                        />
                      </div>
                    )}

                    {emailForm.recipient_type === 'group' && (
                      <div>
                        <Label>Select Group</Label>
                        <Select
                          value={emailForm.recipient_group_id}
                          onValueChange={(v) => setEmailForm({ ...emailForm, recipient_group_id: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose group..." />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map(group => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name} ({group.member_emails?.length || 0} members)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label>Subject</Label>
                      <Input
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        placeholder="Email subject..."
                      />
                    </div>

                    <div>
                      <Label>Message</Label>
                      <Textarea
                        value={emailForm.body}
                        onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                        placeholder="Email body..."
                        rows={10}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setIsAIAssistantOpen(true)}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Generate
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleAIImprove}
                          disabled={generatingAI || !emailForm.body}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Improve
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Schedule Date (Optional)</Label>
                        <Input
                          type="date"
                          value={emailForm.schedule_date}
                          onChange={(e) => setEmailForm({ ...emailForm, schedule_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Schedule Time (Optional)</Label>
                        <Input
                          type="time"
                          value={emailForm.schedule_time}
                          onChange={(e) => setEmailForm({ ...emailForm, schedule_time: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="w-full bg-indigo-600"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : emailForm.schedule_date ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Schedule Email
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {templates.slice(0, 10).map(template => (
                        <div
                          key={template.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <p className="font-semibold text-sm">{template.name}</p>
                          <p className="text-xs text-gray-500 truncate">{template.subject}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="flex justify-between items-center mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => {
                  setEditingTemplate({ name: '', subject: '', body: '', category: 'general' });
                  setIsTemplateDialogOpen(true);
                }}
                className="bg-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <Card key={template.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                        <Badge variant="outline" className="mt-2">{template.category}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-3">{template.body}</p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Use
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingTemplate(template);
                          setIsTemplateDialogOpen(true);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Delete this template?')) {
                            deleteTemplateMutation.mutate(template.id);
                          }
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  setEditingGroup({ name: '', description: '', member_emails: [] });
                  setIsGroupDialogOpen(true);
                }}
                className="bg-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Group
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(group => (
                <Card key={group.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        <Badge className="mt-2">{group.member_emails?.length || 0} members</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingGroup(group);
                          setIsGroupDialogOpen(true);
                        }}
                        className="flex-1"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Delete this group?')) {
                            deleteGroupMutation.mutate(group.id);
                          }
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Triggers Tab */}
          <TabsContent value="triggers">
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={async () => {
                  try {
                    await base44.functions.invoke('setupEmailTriggers', {});
                    queryClient.invalidateQueries(['email-templates']);
                    queryClient.invalidateQueries(['email-triggers']);
                    toast.success('Email system setup complete!');
                  } catch (error) {
                    toast.error('Setup failed');
                  }
                }}
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Auto-Setup Triggers & Templates
              </Button>
              <Button
                onClick={() => {
                  setEditingTrigger({ 
                    name: '', 
                    description: '', 
                    trigger_type: 'order_placed', 
                    recipient_type: 'customer',
                    is_active: true 
                  });
                  setIsTriggerDialogOpen(true);
                }}
                className="bg-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Trigger
              </Button>
            </div>

            <div className="space-y-4">
              {triggers.map(trigger => (
                <Card key={trigger.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{trigger.name}</h3>
                          <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
                            {trigger.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{trigger.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Trigger: {trigger.trigger_type}</Badge>
                          <Badge variant="outline">Sent to: {trigger.recipient_type}</Badge>
                          {trigger.send_count > 0 && (
                            <Badge variant="outline">Sent: {trigger.send_count} times</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTrigger(trigger);
                            setIsTriggerDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Delete this trigger?')) {
                              deleteTriggerMutation.mutate(trigger.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate?.id ? 'Edit Template' : 'New Template'}</DialogTitle>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="e.g., Welcome Email"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={editingTemplate.category}
                    onValueChange={(v) => setEditingTemplate({ ...editingTemplate, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    placeholder="Email subject line..."
                  />
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                    placeholder="Email body text..."
                    rows={10}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsTemplateDialogOpen(false);
                      setEditingTemplate(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingTemplate.id) {
                        updateTemplateMutation.mutate({ id: editingTemplate.id, data: editingTemplate });
                      } else {
                        createTemplateMutation.mutate(editingTemplate);
                      }
                    }}
                    className="flex-1 bg-indigo-600"
                  >
                    {editingTemplate.id ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Group Dialog */}
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGroup?.id ? 'Edit Group' : 'New Group'}</DialogTitle>
            </DialogHeader>
            {editingGroup && (
              <div className="space-y-4">
                <div>
                  <Label>Group Name</Label>
                  <Input
                    value={editingGroup.name}
                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                    placeholder="e.g., VIP Customers"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingGroup.description}
                    onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                    placeholder="Brief description..."
                  />
                </div>
                <div>
                  <Label>Member Emails (one per line)</Label>
                  <Textarea
                    value={(editingGroup.member_emails || []).join('\n')}
                    onChange={(e) => setEditingGroup({ 
                      ...editingGroup, 
                      member_emails: e.target.value.split('\n').filter(Boolean) 
                    })}
                    placeholder="email1@example.com&#10;email2@example.com"
                    rows={6}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsGroupDialogOpen(false);
                      setEditingGroup(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingGroup.id) {
                        updateGroupMutation.mutate({ id: editingGroup.id, data: editingGroup });
                      } else {
                        createGroupMutation.mutate(editingGroup);
                      }
                    }}
                    className="flex-1 bg-indigo-600"
                  >
                    {editingGroup.id ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Trigger Dialog */}
        <Dialog open={isAIAssistantOpen} onOpenChange={setIsAIAssistantOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>AI Email Assistant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>What kind of email do you want to write?</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., Welcome email for new customers, order confirmation with tracking details, promotional email for holiday sale..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAIAssistantOpen(false);
                    setAiPrompt('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAIGenerate}
                  disabled={generatingAI}
                  className="flex-1 bg-indigo-600"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isTriggerDialogOpen} onOpenChange={setIsTriggerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTrigger?.id ? 'Edit Trigger' : 'New Trigger'}</DialogTitle>
            </DialogHeader>
            {editingTrigger && (
              <div className="space-y-4">
                <div>
                  <Label>Trigger Name</Label>
                  <Input
                    value={editingTrigger.name}
                    onChange={(e) => setEditingTrigger({ ...editingTrigger, name: e.target.value })}
                    placeholder="e.g., Order Confirmation"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingTrigger.description}
                    onChange={(e) => setEditingTrigger({ ...editingTrigger, description: e.target.value })}
                    placeholder="What this trigger does..."
                  />
                </div>
                <div>
                  <Label>Trigger Type</Label>
                  <Select
                    value={editingTrigger.trigger_type}
                    onValueChange={(v) => setEditingTrigger({ ...editingTrigger, trigger_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order_placed">Order Placed</SelectItem>
                      <SelectItem value="order_status_change">Order Status Change</SelectItem>
                      <SelectItem value="user_registered">User Registered</SelectItem>
                      <SelectItem value="points_earned">Points Earned</SelectItem>
                      <SelectItem value="reward_redeemed">Reward Redeemed</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recipient Type</Label>
                  <Select
                    value={editingTrigger.recipient_type}
                    onValueChange={(v) => setEditingTrigger({ ...editingTrigger, recipient_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="group">Specific Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingTrigger.recipient_type === 'group' && (
                  <div>
                    <Label>Select Group</Label>
                    <Select
                      value={editingTrigger.recipient_group_id}
                      onValueChange={(v) => setEditingTrigger({ ...editingTrigger, recipient_group_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Email Template</Label>
                  <Select
                    value={editingTrigger.template_id}
                    onValueChange={(v) => setEditingTrigger({ ...editingTrigger, template_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingTrigger.is_active}
                    onChange={(e) => setEditingTrigger({ ...editingTrigger, is_active: e.target.checked })}
                    id="active"
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsTriggerDialogOpen(false);
                      setEditingTrigger(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingTrigger.id) {
                        updateTriggerMutation.mutate({ id: editingTrigger.id, data: editingTrigger });
                      } else {
                        createTriggerMutation.mutate(editingTrigger);
                      }
                    }}
                    className="flex-1 bg-indigo-600"
                  >
                    {editingTrigger.id ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}