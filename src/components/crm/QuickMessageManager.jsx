import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, MessageSquare, Mail, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';

// Global text/email template manager (uses TextTemplate entity)
function GlobalTemplates() {
  const [editingId, setEditingId] = useState(null);
  const [newText, setNewText] = useState({ title: '', message: '' });
  const [showNewText, setShowNewText] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState({});
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['textTemplates'],
    queryFn: () => base44.entities.TextTemplate.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TextTemplate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['textTemplates'] }); setNewText({ title: '', message: '' }); setShowNewText(false); toast.success('Template saved'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TextTemplate.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['textTemplates'] }); setEditingId(null); toast.success('Template updated'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TextTemplate.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['textTemplates'] }); toast.success('Template deleted'); }
  });

  const startEdit = (t) => { setEditingId(t.id); setEditingTemplate({ title: t.title, message: t.message }); };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">These shortcuts appear for ALL contacts.</p>
        <Button size="sm" onClick={() => setShowNewText(true)} className="bg-green-600 gap-1">
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>

      {showNewText && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-3 space-y-2">
          <Input placeholder="Label (e.g. 🛍️ New arrivals)" value={newText.title} onChange={e => setNewText({ ...newText, title: e.target.value })} className="h-8 text-sm" />
          <Textarea placeholder="Message text..." value={newText.message} onChange={e => setNewText({ ...newText, message: e.target.value })} rows={3} className="text-sm resize-none" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => createMutation.mutate({ ...newText, is_active: true })} className="bg-green-600 h-7">Save</Button>
            <Button size="sm" variant="outline" onClick={() => setShowNewText(false)} className="h-7">Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {templates.map(t => (
          <div key={t.id} className="border border-gray-200 rounded-lg p-3 bg-white">
            {editingId === t.id ? (
              <div className="space-y-2">
                <Input value={editingTemplate.title} onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })} className="h-8 text-sm" />
                <Textarea value={editingTemplate.message} onChange={e => setEditingTemplate({ ...editingTemplate, message: e.target.value })} rows={3} className="text-sm resize-none" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: t.id, data: editingTemplate })} className="bg-green-600 h-7 gap-1"><Save className="w-3 h-3" />Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.message}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(t)}><Edit2 className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(t.id); }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {templates.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No global text templates yet</p>}
      </div>
    </div>
  );
}

// Per-contact custom messages editor
export function ContactQuickMessages({ contact, onUpdate }) {
  const [showAddText, setShowAddText] = useState(false);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newText, setNewText] = useState({ label: '', message: '' });
  const [newEmail, setNewEmail] = useState({ label: '', subject: '', body: '' });

  const textMessages = contact.custom_text_messages || [];
  const emailMessages = contact.custom_email_messages || [];

  const saveTextMessages = (msgs) => onUpdate({ custom_text_messages: msgs });
  const saveEmailMessages = (msgs) => onUpdate({ custom_email_messages: msgs });

  const addText = () => {
    if (!newText.label || !newText.message) { toast.error('Fill in label and message'); return; }
    saveTextMessages([...textMessages, newText]);
    setNewText({ label: '', message: '' });
    setShowAddText(false);
    toast.success('Text shortcut added');
  };

  const addEmail = () => {
    if (!newEmail.label || !newEmail.subject || !newEmail.body) { toast.error('Fill in all fields'); return; }
    saveEmailMessages([...emailMessages, newEmail]);
    setNewEmail({ label: '', subject: '', body: '' });
    setShowAddEmail(false);
    toast.success('Email shortcut added');
  };

  const removeText = (idx) => saveTextMessages(textMessages.filter((_, i) => i !== idx));
  const removeEmail = (idx) => saveEmailMessages(emailMessages.filter((_, i) => i !== idx));

  return (
    <div className="pt-3 border-t border-emerald-100 space-y-4">
      <p className="text-xs font-semibold text-gray-600 uppercase">Custom Quick Messages</p>

      {/* Custom Texts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-green-700 font-medium flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Text Shortcuts</p>
          <Button size="sm" variant="ghost" className="h-6 text-xs text-green-700" onClick={() => setShowAddText(true)}><Plus className="w-3 h-3 mr-1" />Add</Button>
        </div>
        {showAddText && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-3 mb-2 space-y-2">
            <Input placeholder="Button label" value={newText.label} onChange={e => setNewText({ ...newText, label: e.target.value })} className="h-7 text-xs" />
            <Textarea placeholder="Message text..." value={newText.message} onChange={e => setNewText({ ...newText, message: e.target.value })} rows={2} className="text-xs resize-none" />
            <div className="flex gap-2">
              <Button size="sm" onClick={addText} className="bg-green-600 h-7 text-xs">Save</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddText(false)} className="h-7 text-xs">Cancel</Button>
            </div>
          </div>
        )}
        {textMessages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {textMessages.map((t, i) => (
              <div key={i} className="group flex items-center gap-1 px-2 py-1 bg-white border border-green-300 rounded-full text-xs text-green-800">
                <span>{t.label}</span>
                <button onClick={() => removeText(i)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Emails */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-purple-700 font-medium flex items-center gap-1"><Mail className="w-3 h-3" /> Email Shortcuts</p>
          <Button size="sm" variant="ghost" className="h-6 text-xs text-purple-700" onClick={() => setShowAddEmail(true)}><Plus className="w-3 h-3 mr-1" />Add</Button>
        </div>
        {showAddEmail && (
          <div className="border border-purple-200 bg-purple-50 rounded-lg p-3 mb-2 space-y-2">
            <Input placeholder="Button label" value={newEmail.label} onChange={e => setNewEmail({ ...newEmail, label: e.target.value })} className="h-7 text-xs" />
            <Input placeholder="Email subject" value={newEmail.subject} onChange={e => setNewEmail({ ...newEmail, subject: e.target.value })} className="h-7 text-xs" />
            <Textarea placeholder="Email body..." value={newEmail.body} onChange={e => setNewEmail({ ...newEmail, body: e.target.value })} rows={3} className="text-xs resize-none" />
            <div className="flex gap-2">
              <Button size="sm" onClick={addEmail} className="bg-purple-600 h-7 text-xs">Save</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddEmail(false)} className="h-7 text-xs">Cancel</Button>
            </div>
          </div>
        )}
        {emailMessages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {emailMessages.map((e, i) => (
              <div key={i} className="group flex items-center gap-1 px-2 py-1 bg-white border border-purple-300 rounded-full text-xs text-purple-800">
                <span>{e.label}</span>
                <button onClick={() => removeEmail(i)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main dialog for managing global shortcuts
export default function QuickMessageManager({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Manage Quick Message Templates
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Tabs defaultValue="text">
            <TabsList className="w-full">
              <TabsTrigger value="text" className="flex-1 gap-2"><MessageSquare className="w-4 h-4" />Text Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-4">
              <GlobalTemplates />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}