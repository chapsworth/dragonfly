import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2, Filter, Calendar, DollarSign, Tag } from 'lucide-react';
import { toast } from 'sonner';
import BiometricGuard from '@/components/auth/BiometricGuard';

export default function CRMContacts() {
  return (
    <BiometricGuard>
      <CRMContactsContent />
    </BiometricGuard>
  );
}

function CRMContactsContent() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [editingContact, setEditingContact] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created');
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated');
      setEditingContact(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    }
  });

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                         c.email?.toLowerCase().includes(search.toLowerCase()) ||
                         c.phone?.includes(search);
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
    return matchesSearch && matchesType && matchesStage;
  });

  const stageColors = {
    new: 'bg-gray-500',
    contacted: 'bg-blue-500',
    qualified: 'bg-yellow-500',
    negotiation: 'bg-orange-500',
    won: 'bg-green-500',
    lost: 'bg-red-500'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-emerald-900 mb-2 flex items-center gap-3">
              <Users className="w-10 h-10" />
              Contacts & Leads
            </h1>
            <p className="text-emerald-600">Manage customer relationships</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-emerald-500 to-green-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white border-emerald-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-emerald-200"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="vendor_contact">Vendor Contacts</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-emerald-600 flex items-center justify-end">
                <Filter className="w-4 h-4 mr-2" />
                {filteredContacts.length} contacts
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <Card key={contact.id} className="bg-white border-emerald-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-900 text-lg mb-1">{contact.full_name}</h3>
                    {contact.company && (
                      <p className="text-sm text-emerald-600">{contact.company}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingContact(contact)}>
                      <Edit2 className="w-4 h-4 text-emerald-600" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this contact?')) {
                          deleteMutation.mutate(contact.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600">
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600">
                      <Phone className="w-4 h-4" />
                      {contact.phone}
                    </a>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {contact.city}, {contact.state}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`${stageColors[contact.stage]} text-white`}>
                    {contact.stage}
                  </Badge>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                    {contact.type}
                  </Badge>
                </div>

                {contact.type === 'customer' && (
                  <div className="pt-4 border-t border-emerald-100 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Orders</p>
                      <p className="font-bold text-emerald-900">{contact.total_orders || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Spent</p>
                      <p className="font-bold text-green-700">${(contact.total_spent || 0).toFixed(0)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <Card className="bg-white border-emerald-200">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
              <p className="text-emerald-600">No contacts found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <ContactDialog
        contact={editingContact}
        isOpen={isCreating || !!editingContact}
        onClose={() => {
          setIsCreating(false);
          setEditingContact(null);
        }}
        onSave={(data) => {
          if (editingContact) {
            updateMutation.mutate({ id: editingContact.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
      />
    </div>
  );
}

function ContactDialog({ contact, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    type: 'lead',
    stage: 'new',
    preferred_strain_type: 'no_preference',
    address: '',
    city: '',
    state: '',
    zip: '',
    birthday: '',
    medical_card_number: '',
    medical_card_expiry: '',
    notes: '',
    source: '',
    tags: []
  });

  React.useEffect(() => {
    if (contact) {
      setFormData({ ...contact, tags: contact.tags || [] });
    } else if (!isOpen) {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        role: '',
        type: 'lead',
        stage: 'new',
        preferred_strain_type: 'no_preference',
        address: '',
        city: '',
        state: '',
        zip: '',
        birthday: '',
        medical_card_number: '',
        medical_card_expiry: '',
        notes: '',
        source: '',
        tags: []
      });
    }
  }, [contact, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'New Contact'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-emerald-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="border-emerald-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="vendor_contact">Vendor Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={formData.stage} onValueChange={(val) => setFormData({ ...formData, stage: val })}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred Strain</Label>
              <Select value={formData.preferred_strain_type} onValueChange={(val) => setFormData({ ...formData, preferred_strain_type: val })}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_preference">No Preference</SelectItem>
                  <SelectItem value="indica">Indica</SelectItem>
                  <SelectItem value="sativa">Sativa</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="cbd">CBD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div>
            <Label>Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="border-emerald-200"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="border-emerald-200"
              />
            </div>
          </div>

          {/* Medical Card Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Medical Card #</Label>
              <Input
                value={formData.medical_card_number}
                onChange={(e) => setFormData({ ...formData, medical_card_number: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>Card Expiry</Label>
              <Input
                type="date"
                value={formData.medical_card_expiry}
                onChange={(e) => setFormData({ ...formData, medical_card_expiry: e.target.value })}
                className="border-emerald-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Birthday</Label>
              <Input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>Source</Label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="How they found us"
                className="border-emerald-200"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="border-emerald-200 h-24"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-emerald-200">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => onSave(formData)}
              className="bg-gradient-to-r from-emerald-500 to-green-500"
            >
              {contact ? 'Update' : 'Create'} Contact
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}