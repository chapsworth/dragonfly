import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, Send, Inbox, Trash2, Archive, Search, 
  Plus, Reply, Mail, User
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Messages() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeForm, setComposeForm] = useState({
    to_user_email: '',
    subject: '',
    body: ''
  });
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['all-messages'],
    queryFn: () => base44.entities.Message.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const inboxMessages = allMessages.filter(m => m.to_user_email === currentUser?.email);
  const sentMessages = allMessages.filter(m => m.from_user_email === currentUser?.email);
  const unreadCount = inboxMessages.filter(m => !m.is_read).length;

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-messages']);
      setIsComposeOpen(false);
      setComposeForm({ to_user_email: '', subject: '', body: '' });
      toast.success('Message sent');
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-messages']);
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-messages']);
      setSelectedMessage(null);
      toast.success('Message deleted');
    }
  });

  const handleSendMessage = async () => {
    if (!composeForm.to_user_email || !composeForm.body) {
      toast.error('Please fill in recipient and message');
      return;
    }

    sendMessageMutation.mutate({
      from_user_email: currentUser.email,
      to_user_email: composeForm.to_user_email,
      subject: composeForm.subject || 'No Subject',
      body: composeForm.body,
      is_read: false
    });
  };

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    if (!message.is_read && message.to_user_email === currentUser?.email) {
      markReadMutation.mutate(message.id);
    }
  };

  const handleReply = (message) => {
    setComposeForm({
      to_user_email: message.from_user_email,
      subject: `Re: ${message.subject}`,
      body: ''
    });
    setIsComposeOpen(true);
    setSelectedMessage(null);
  };

  const filteredInbox = inboxMessages.filter(m => 
    !searchQuery || 
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.from_user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSent = sentMessages.filter(m => 
    !searchQuery || 
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.to_user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">Internal messaging system</p>
          </div>
          <Button
            onClick={() => setIsComposeOpen(true)}
            className="bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical">
                  <TabsList className="flex flex-col h-auto w-full gap-2">
                    <TabsTrigger value="inbox" className="justify-start w-full">
                      <Inbox className="w-4 h-4 mr-2" />
                      Inbox
                      {unreadCount > 0 && (
                        <Badge className="ml-auto">{unreadCount}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="justify-start w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Sent
                      <Badge variant="outline" className="ml-auto">{sentMessages.length}</Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Messages List */}
            {activeTab === 'inbox' && (
              <div className="space-y-2">
                {filteredInbox.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No messages in inbox</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredInbox.map(message => (
                    <Card 
                      key={message.id} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${!message.is_read ? 'bg-blue-50' : ''}`}
                      onClick={() => handleViewMessage(message)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm">{message.from_user_email}</p>
                                {!message.is_read && (
                                  <Badge className="bg-blue-600">New</Badge>
                                )}
                              </div>
                              <p className="font-medium text-sm text-gray-900 truncate">{message.subject}</p>
                              <p className="text-xs text-gray-600 line-clamp-1">{message.body}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {format(new Date(message.created_date), 'MMM d')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === 'sent' && (
              <div className="space-y-2">
                {filteredSent.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No sent messages</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredSent.map(message => (
                    <Card 
                      key={message.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedMessage(message)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm mb-1">To: {message.to_user_email}</p>
                              <p className="font-medium text-sm text-gray-900 truncate">{message.subject}</p>
                              <p className="text-xs text-gray-600 line-clamp-1">{message.body}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {format(new Date(message.created_date), 'MMM d')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compose Dialog */}
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>To</Label>
                <select
                  value={composeForm.to_user_email}
                  onChange={(e) => setComposeForm({ ...composeForm, to_user_email: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select recipient...</option>
                  {users.filter(u => u.email !== currentUser?.email).map(user => (
                    <option key={user.id} value={user.email}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="Message subject..."
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  placeholder="Type your message..."
                  rows={8}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsComposeOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1 bg-blue-600"
                >
                  {sendMessageMutation.isPending ? 'Sending...' : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Message Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {activeTab === 'inbox' ? selectedMessage.from_user_email : `To: ${selectedMessage.to_user_email}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(selectedMessage.created_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  {activeTab === 'inbox' && (
                    <Button
                      onClick={() => handleReply(selectedMessage)}
                      className="flex-1 bg-blue-600"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm('Delete this message?')) {
                        deleteMessageMutation.mutate(selectedMessage.id);
                      }
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
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