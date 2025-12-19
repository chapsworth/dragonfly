import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Edit, Trash2, Send, MessageSquare, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function TextGroupManager({ isOpen, onClose, allContacts }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', contact_ids: [] });
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ['textGroups'],
    queryFn: () => base44.entities.TextGroup.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TextGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textGroups'] });
      toast.success('Group created');
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TextGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textGroups'] });
      toast.success('Group updated');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TextGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textGroups'] });
      toast.success('Group deleted');
    }
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', contact_ids: [] });
    setIsCreating(false);
    setEditingGroup(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({ name: '', description: '', contact_ids: [] });
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      contact_ids: group.contact_ids || []
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Please enter a group name');
      return;
    }
    if (formData.contact_ids.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }

    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (group) => {
    if (confirm(`Delete group "${group.name}"?`)) {
      deleteMutation.mutate(group.id);
    }
  };

  const toggleContact = (contactId) => {
    setFormData(prev => ({
      ...prev,
      contact_ids: prev.contact_ids.includes(contactId)
        ? prev.contact_ids.filter(id => id !== contactId)
        : [...prev.contact_ids, contactId]
    }));
  };

  const selectAll = () => {
    const allIds = allContacts.filter(c => c.phone).map(c => c.id);
    setFormData(prev => ({ ...prev, contact_ids: allIds }));
  };

  const deselectAll = () => {
    setFormData(prev => ({ ...prev, contact_ids: [] }));
  };

  const handleTextGroup = (group) => {
    const groupContacts = allContacts.filter(c => group.contact_ids.includes(c.id));
    const phoneNumbers = groupContacts.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean).join(',');
    
    if (!phoneNumbers) {
      toast.error('No valid phone numbers in this group');
      return;
    }

    const smsUrl = `sms:${phoneNumbers}`;
    window.location.href = smsUrl;
    toast.success(`Opening message to ${groupContacts.length} contacts...`);
  };

  const filteredContacts = allContacts.filter(c => 
    c.phone && (
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    )
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Text Groups
          </DialogTitle>
        </DialogHeader>

        {!isCreating ? (
          <div className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={handleCreate} className="bg-gradient-to-r from-emerald-500 to-green-500">
                <Plus className="w-4 h-4 mr-2" />
                New Group
              </Button>
            </div>

            <div className="grid gap-3">
              {groups.map((group) => {
                const groupContacts = allContacts.filter(c => group.contact_ids.includes(c.id));
                return (
                  <Card key={group.id} className="border-emerald-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold">
                              {group.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-emerald-900">{group.name}</h3>
                              <p className="text-sm text-emerald-600">
                                {groupContacts.length} contact{groupContacts.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          {group.description && (
                            <p className="text-sm text-gray-600 ml-13">{group.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleTextGroup(group)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Text
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(group)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(group)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {groups.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No groups yet. Create your first one!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div>
              <Label>Group Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., VIP Customers, Weekly Newsletter"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Select Contacts ({formData.contact_ids.length} selected)</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border border-emerald-200 rounded-lg max-h-[400px] overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 hover:bg-emerald-50 border-b border-emerald-100 last:border-b-0 cursor-pointer"
                    onClick={() => toggleContact(contact.id)}
                  >
                    <Checkbox
                      checked={formData.contact_ids.includes(contact.id)}
                      onCheckedChange={() => toggleContact(contact.id)}
                    />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-sm font-bold">
                      {contact.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-emerald-900">{contact.full_name}</p>
                      <p className="text-xs text-emerald-600">{contact.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500">
                {editingGroup ? 'Update' : 'Create'} Group
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}