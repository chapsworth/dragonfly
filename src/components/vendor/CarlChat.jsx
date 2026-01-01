import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Sparkles, Paperclip, History, MessageSquarePlus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CarlChat({ isOpen, onClose }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch all conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['carl-conversations'],
    queryFn: () => base44.agents.listConversations({ agent_name: 'carl' }),
    enabled: isOpen
  });

  // Create or get conversation
  useEffect(() => {
    if (isOpen && !conversationId) {
      base44.agents.createConversation({
        agent_name: 'carl',
        metadata: { name: 'Product Consultation' }
      }).then(conv => {
        setConversationId(conv.id);
        setMessages(conv.messages || []);
      }).catch(err => {
        console.error('Failed to create conversation:', err);
        toast.error('Failed to start chat');
      });
    }
  }, [isOpen, conversationId]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map(r => r.file_url);
      setUploadedFiles(prev => [...prev, ...fileUrls]);
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async () => {
    if ((!inputMessage.trim() && uploadedFiles.length === 0) || !conversationId || isSending) return;

    const messageContent = inputMessage.trim();
    const filesToSend = [...uploadedFiles];
    setInputMessage('');
    setUploadedFiles([]);
    setIsSending(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: messageContent || 'Analyze these files',
        file_urls: filesToSend.length > 0 ? filesToSend : undefined
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const createNewThread = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'carl',
        metadata: { name: `Consultation ${format(new Date(), 'MMM d, h:mm a')}` }
      });
      setConversationId(conv.id);
      setMessages([]);
      setShowThreads(false);
      toast.success('New thread created');
    } catch (error) {
      toast.error('Failed to create thread');
    }
  };

  const switchThread = async (convId) => {
    try {
      const conv = await base44.agents.getConversation(convId);
      setConversationId(convId);
      setMessages(conv.messages || []);
      setShowThreads(false);
    } catch (error) {
      toast.error('Failed to load conversation');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold">Carl - Product Consultant</p>
                <p className="text-xs text-gray-500 font-normal">AI-powered cannabis product advisor</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={createNewThread}
                className="gap-2"
              >
                <MessageSquarePlus className="w-4 h-4" />
                New Thread
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThreads(!showThreads)}
                className="gap-2"
              >
                <History className="w-4 h-4" />
                History ({conversations.length})
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Thread Selector */}
        {showThreads && (
          <div className="border-b pb-3">
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => switchThread(conv.id)}
                    className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                      conv.id === conversationId ? 'bg-purple-50 border border-purple-200' : ''
                    }`}
                  >
                    <p className="font-semibold text-sm">{conv.metadata?.name || 'Consultation'}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(conv.created_date), 'MMM d, h:mm a')} • {conv.messages?.length || 0} messages
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-300" />
                <p className="font-semibold mb-2">Hi! I'm Carl, your product consultant</p>
                <p className="text-sm">Ask me about products, pricing, trends, or what to order!</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                  {msg.tool_calls?.map((tool, i) => (
                    <div key={i} className="mt-2 text-xs bg-white/50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-purple-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{tool.name?.split('.').pop()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* File Attachments Preview */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2 border-t pt-2">
            {uploadedFiles.map((url, idx) => (
              <div key={idx} className="relative group">
                <img src={url} alt="Attachment" className="w-16 h-16 object-cover rounded-lg border" />
                <button
                  onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </Button>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Carl about products, upload menus, or request orders..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={(!inputMessage.trim() && uploadedFiles.length === 0) || isSending}
            className="bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}