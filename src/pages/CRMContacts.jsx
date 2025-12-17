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
import { Users, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2, Filter, Calendar, DollarSign, Tag, ChevronDown, ChevronUp, MessageSquare, Package } from 'lucide-react';
import { toast } from 'sonner';
import BiometricGuard from '@/components/auth/BiometricGuard';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

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
  const [expandedContacts, setExpandedContacts] = useState({});
  const [editingNotes, setEditingNotes] = useState({});
  const [editingProducts, setEditingProducts] = useState({});
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

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.Contact.update(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Notes saved');
    }
  });

  const updateProductsMutation = useMutation({
    mutationFn: ({ id, products }) => base44.entities.Contact.update(id, { vendor_products: products }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Products updated');
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

  // Group by first letter
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const firstLetter = (contact.full_name?.[0] || '?').toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(contact);
    return acc;
  }, {});

  const availableLetters = Object.keys(groupedContacts).sort();

  const toggleExpand = (id) => {
    setExpandedContacts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCall = (phone) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleText = (phone, name) => {
    if (phone) {
      const message = encodeURIComponent(`Hi ${name}, `);
      window.location.href = `sms:${phone}${/iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'}body=${message}`;
    }
  };

  const handleEmail = (email) => {
    if (email) window.location.href = `mailto:${email}`;
  };

  const saveNotes = (id) => {
    const notes = editingNotes[id];
    if (notes !== undefined) {
      updateNotesMutation.mutate({ id, notes });
      setEditingNotes(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const saveProducts = (id) => {
    const products = editingProducts[id];
    if (products !== undefined) {
      updateProductsMutation.mutate({ id, products });
      setEditingProducts(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const stageColors = {
    new: 'bg-gray-500',
    contacted: 'bg-blue-500',
    qualified: 'bg-yellow-500',
    negotiation: 'bg-orange-500',
    won: 'bg-green-500',
    lost: 'bg-red-500'
  };

  const importFromPhone = async () => {
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'email', 'tel', 'address'];
        const opts = { multiple: true };
        const contacts = await navigator.contacts.select(props, opts);
        
        for (const contact of contacts) {
          const contactData = {
            full_name: contact.name?.[0] || 'Unknown',
            email: contact.email?.[0] || '',
            phone: contact.tel?.[0] || '',
            address: contact.address?.[0]?.addressLine || '',
            city: contact.address?.[0]?.city || '',
            state: contact.address?.[0]?.region || '',
            zip: contact.address?.[0]?.postalCode || '',
            type: 'lead',
            stage: 'new'
          };
          await createMutation.mutateAsync(contactData);
        }
        toast.success(`Imported ${contacts.length} contact(s)`);
      } else {
        toast.error('Contact import not supported on this device');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to import contacts');
      }
    }
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
          <div className="flex gap-2">
            <Button onClick={importFromPhone} variant="outline" className="gap-2">
              <Phone className="w-4 h-4" />
              Import from Phone
            </Button>
            <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-emerald-500 to-green-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
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

        {/* Contact List */}
        <div>
          <div>
            {availableLetters.map(letter => (
              <div key={letter} id={`letter-${letter}`} className="mb-6">
                <div className="sticky top-20 bg-gradient-to-r from-emerald-50 to-white py-2 px-4 rounded-lg mb-3 z-10">
                  <h2 className="text-2xl font-bold text-emerald-900">{letter}</h2>
                </div>
                <div className="space-y-2">
                  {groupedContacts[letter].map(contact => {
                    const isExpanded = expandedContacts[contact.id];
                    return (
                      <Card key={contact.id} className="bg-white border-emerald-200">
                        <CardContent className="p-0">
                          {/* Collapsed View */}
                          <button
                            onClick={() => toggleExpand(contact.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-emerald-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold">
                                {contact.full_name?.[0]?.toUpperCase()}
                              </div>
                              <div className="text-left flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-emerald-900">{contact.full_name}</h3>
                                  <Badge className={`${stageColors[contact.stage]} text-white text-xs`}>
                                    {contact.stage}
                                  </Badge>
                                  <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">
                                    {contact.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-emerald-600">
                                  {contact.company && `${contact.company} • `}
                                  {contact.phone || contact.email}
                                </p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-emerald-600" />
                            )}
                          </button>

                          {/* Expanded View */}
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-4 border-t border-emerald-100">
                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-4">
                                {contact.phone && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleCall(contact.phone)}
                                      className="bg-gradient-to-r from-blue-500 to-cyan-500 gap-2"
                                    >
                                      <Phone className="w-4 h-4" />
                                      Call
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleText(contact.phone, contact.full_name)}
                                      className="bg-gradient-to-r from-green-500 to-emerald-500 gap-2"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      Text
                                    </Button>
                                  </>
                                )}
                                {contact.email && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleEmail(contact.email)}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 gap-2"
                                  >
                                    <Mail className="w-4 h-4" />
                                    Email
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingContact(contact)}
                                  className="gap-2 ml-auto"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm('Delete this contact?')) {
                                      deleteMutation.mutate(contact.id);
                                    }
                                  }}
                                  className="gap-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </Button>
                              </div>

                              {/* Contact Details */}
                              <div className="grid grid-cols-2 gap-4">
                                {contact.email && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Email</p>
                                    <p className="text-sm font-medium text-emerald-900">{contact.email}</p>
                                  </div>
                                )}
                                {contact.phone && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Phone</p>
                                    <p className="text-sm font-medium text-emerald-900">{contact.phone}</p>
                                  </div>
                                )}
                                {contact.company && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Company</p>
                                    <p className="text-sm font-medium text-emerald-900">{contact.company}</p>
                                  </div>
                                )}
                                {contact.role && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Role</p>
                                    <p className="text-sm font-medium text-emerald-900">{contact.role}</p>
                                  </div>
                                )}
                              </div>

                              {(contact.address || contact.city) && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Address</p>
                                  <p className="text-sm font-medium text-emerald-900">
                                    {contact.address && `${contact.address}, `}
                                    {contact.city && `${contact.city}, `}
                                    {contact.state} {contact.zip}
                                  </p>
                                </div>
                              )}

                              {contact.preferred_strain_type && contact.preferred_strain_type !== 'no_preference' && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Preferred Strain</p>
                                  <Badge className="bg-purple-500 text-white">{contact.preferred_strain_type}</Badge>
                                </div>
                              )}

                              {contact.type === 'customer' && (
                                <div className="pt-3 border-t border-emerald-100 grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Total Orders</p>
                                    <p className="text-lg font-bold text-emerald-900">{contact.total_orders || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Total Spent</p>
                                    <p className="text-lg font-bold text-green-700">${(contact.total_spent || 0).toFixed(0)}</p>
                                  </div>
                                  {contact.last_order_date && (
                                    <div>
                                      <p className="text-xs text-gray-600 mb-1">Last Order</p>
                                      <p className="text-sm font-medium text-emerald-900">
                                        {new Date(contact.last_order_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Notes Section */}
                              <div className="pt-3 border-t border-emerald-100">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-gray-600 uppercase">Notes</p>
                                  {editingNotes[contact.id] !== undefined && (
                                    <Button size="sm" onClick={() => saveNotes(contact.id)} className="h-7">
                                      Save
                                    </Button>
                                  )}
                                </div>
                                <Textarea
                                  value={editingNotes[contact.id] !== undefined ? editingNotes[contact.id] : contact.notes || ''}
                                  onChange={(e) => setEditingNotes({ ...editingNotes, [contact.id]: e.target.value })}
                                  placeholder="Add notes about this contact..."
                                  className="border-emerald-200 text-sm"
                                  rows={3}
                                />
                              </div>

                              {/* Vendor Products Section */}
                              {contact.type === 'vendor_contact' && (
                                <div className="pt-3 border-t border-emerald-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                                      <Package className="w-4 h-4" />
                                      Vendor Products
                                    </p>
                                    {editingProducts[contact.id] !== undefined && (
                                      <Button size="sm" onClick={() => saveProducts(contact.id)} className="h-7">
                                        Save
                                      </Button>
                                    )}
                                  </div>
                                  <Textarea
                                    value={editingProducts[contact.id] !== undefined ? editingProducts[contact.id] : contact.vendor_products || ''}
                                    onChange={(e) => setEditingProducts({ ...editingProducts, [contact.id]: e.target.value })}
                                    placeholder="List products this vendor supplies..."
                                    className="border-emerald-200 text-sm"
                                    rows={3}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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
    tags: [],
    vendor_products: ''
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
        tags: [],
        vendor_products: ''
      });
    }
  }, [contact, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'New Contact'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4 pb-6">
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
            <AddressAutocomplete
              value={formData.address}
              onChange={(val) => setFormData({ ...formData, address: val })}
              className="border-emerald-200"
              onPlaceSelect={(details) => {
                setFormData({
                  ...formData,
                  address: details.address,
                  city: details.city,
                  state: details.state,
                  zip: details.zip
                });
              }}
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

          {/* Vendor Products */}
          {formData.type === 'vendor_contact' && (
            <div>
              <Label>Vendor Products</Label>
              <Textarea
                value={formData.vendor_products}
                onChange={(e) => setFormData({ ...formData, vendor_products: e.target.value })}
                placeholder="List products this vendor supplies..."
                className="border-emerald-200 h-24"
              />
            </div>
          )}

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