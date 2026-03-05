import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Edit2, Trash2, Mail, Search, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailGroupManager({ isOpen, onClose, allContacts, allVendors = [], onSelectGroup }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ['email-groups'],
    queryFn: () => base44.entities.EmailGroup.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-groups'] });
      toast.success('Email group created');
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-groups'] });
      toast.success('Email group updated');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-groups'] });
      toast.success('Email group deleted');
    }
  });

  const resetForm = () => {
    setIsCreating(false);
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
    setSelectedContacts([]);
    setSearchTerm('');
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    const groupContacts = allContacts.filter(c => group.contact_ids?.includes(c.id));
    setSelectedContacts(groupContacts.map(c => ({ ...c, type: 'contact' })));
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }
    const data = {
      name: groupName,
      description: groupDescription,
      contact_ids: selectedContacts.map(c => c.id)
    };
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Delete this email group?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEmailGroup = (group) => {
    const groupContacts = allContacts.filter(c => group.contact_ids?.includes(c.id) && c.email);
    if (onSelectGroup) {
      onSelectGroup(groupContacts);
      onClose();
    }
  };

  const isSelected = (id) => selectedContacts.some(sc => sc.id === id);

  const toggleContact = (contact, type = 'contact') => {
    if (isSelected(contact.id)) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, { ...contact, type }]);
    }
  };

  const toggleAll = (list, type) => {
    const allSelected = list.every(c => isSelected(c.id));
    if (allSelected) {
      setSelectedContacts(selectedContacts.filter(sc => !list.some(c => c.id === sc.id)));
    } else {
      const toAdd = list.filter(c => !isSelected(c.id)).map(c => ({ ...c, type }));
      setSelectedContacts([...selectedContacts, ...toAdd]);
    }
  };

  const contactsWithEmail = allContacts.filter(c =>
    c.email &&
    (c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const vendorsWithEmail = allVendors.filter(v =>
    v.email &&
    (v.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     v.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Email Groups
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!isCreating ? (
            <>
              <div className="flex justify-end">
                <Button 
                  onClick={() => setIsCreating(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Email Group
                </Button>
              </div>

              {groups.length === 0 ? (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-12 text-center">
                    <Users className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                    <p className="text-purple-600">No email groups yet. Create one to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {groups.map(group => {
                    const groupContacts = allContacts.filter(c => group.contact_ids.includes(c.id) && c.email);
                    return (
                      <Card key={group.id} className="border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-purple-900">{group.name}</h3>
                                <Badge className="bg-purple-500 text-white">
                                  {groupContacts.length} contact{groupContacts.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              {group.description && (
                                <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {groupContacts.slice(0, 5).map(contact => (
                                  <Badge key={contact.id} variant="outline" className="text-xs">
                                    {contact.full_name}
                                  </Badge>
                                ))}
                                {groupContacts.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{groupContacts.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEmailGroup(group)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500"
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(group)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(group.id)}
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
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Group Name *</Label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., VIP Customers, Weekly Newsletter"
                  className="border-purple-200"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="border-purple-200"
                  rows={2}
                />
              </div>

              <div>
                <Label>Selected Contacts ({selectedContacts.length})</Label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[60px] p-3 border rounded-lg border-purple-200 bg-purple-50">
                  {selectedContacts.length === 0 ? (
                    <p className="text-sm text-gray-500">No contacts selected</p>
                  ) : (
                    selectedContacts.map(contact => (
                      <Badge key={contact.id} className="bg-purple-500 text-white flex items-center gap-1">
                        {contact.full_name}
                        <button
                          onClick={() => handleRemoveContact(contact.id)}
                          className="hover:bg-purple-600 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div>
                <Label>Add Contacts</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search contacts by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-purple-200"
                  />
                </div>
                {searchTerm && (availableContacts.length > 0 || availableVendors.length > 0) && (
                  <div className="mt-2 border border-purple-200 rounded-lg max-h-64 overflow-y-auto">
                    {availableContacts.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 bg-purple-50 text-xs font-semibold text-purple-700 sticky top-0">
                          CRM CONTACTS
                        </div>
                        {availableContacts.slice(0, 15).map(contact => (
                          <button
                            key={contact.id}
                            onClick={() => handleAddContact(contact, 'contact')}
                            className="w-full px-4 py-2 text-left hover:bg-purple-50 transition-colors border-b border-purple-100"
                          >
                            <div className="font-semibold text-sm">{contact.full_name}</div>
                            <div className="text-xs text-gray-600">{contact.email}</div>
                          </button>
                        ))}
                      </>
                    )}
                    {availableVendors.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 bg-blue-50 text-xs font-semibold text-blue-700 sticky top-0">
                          VENDORS
                        </div>
                        {availableVendors.slice(0, 15).map(vendor => (
                          <button
                            key={vendor.id}
                            onClick={() => handleAddContact(vendor, 'vendor')}
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors border-b border-purple-100"
                          >
                            <div className="font-semibold text-sm">{vendor.company_name}</div>
                            <div className="text-xs text-gray-600">{vendor.email}</div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  {editingGroup ? 'Update' : 'Create'} Group
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}