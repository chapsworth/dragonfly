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
import { Building2, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2, Filter, Star, Globe } from 'lucide-react';
import { toast } from 'sonner';
import BiometricGuard from '@/components/auth/BiometricGuard';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import CallLogger from '@/components/crm/CallLogger';

export default function CRMVendors() {
  return (
    <BiometricGuard>
      <CRMVendorsContent />
    </BiometricGuard>
  );
}

function CRMVendorsContent() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingVendor, setEditingVendor] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeCallVendor, setActiveCallVendor] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vendor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor created');
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vendor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor updated');
      setEditingVendor(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vendor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor deleted');
    }
  });

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.company_name?.toLowerCase().includes(search.toLowerCase()) ||
                         v.contact_name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || v.vendor_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const statusColors = {
    active: 'bg-green-500',
    contacted: 'bg-blue-500',
    no_answer: 'bg-slate-500',
    sent_message: 'bg-cyan-500',
    no_response: 'bg-amber-600',
    not_interested: 'bg-red-400',
    negotiating: 'bg-orange-500',
    dead: 'bg-gray-700',
    pending: 'bg-yellow-500',
    inactive: 'bg-gray-500'
  };

  const handleCallLogSave = async (callLog) => {
    try {
      // Create call note
      await base44.entities.CRMNote.create({
        title: `Call with ${callLog.contactName} - ${callLog.outcome}`,
        content: callLog.notes,
        note_type: 'call',
        related_vendor_id: callLog.contactId
      });

      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Call logged successfully');
      setActiveCallVendor(null);
    } catch (error) {
      console.error('Failed to log call:', error);
      toast.error('Failed to log call');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2 flex items-center gap-3">
              <Building2 className="w-10 h-10" />
              Vendors
            </h1>
            <p className="text-blue-600">Manage your supplier relationships</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-blue-500 to-cyan-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        <Card className="mb-6 bg-white border-blue-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                <Input
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-blue-200"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="grower">Grower</SelectItem>
                  <SelectItem value="processor">Processor</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="packaging">Packaging</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="sent_message">Sent Message</SelectItem>
                  <SelectItem value="no_response">Haven't Heard Back</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="dead">Dead Contact</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-blue-600 flex items-center justify-end">
                <Filter className="w-4 h-4 mr-2" />
                {filteredVendors.length} vendors
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map(vendor => (
            <Card key={vendor.id} className="bg-white border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 text-lg mb-1">{vendor.company_name}</h3>
                    {vendor.contact_name && (
                      <p className="text-sm text-blue-600">{vendor.contact_name}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingVendor(vendor)}>
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this vendor?')) {
                          deleteMutation.mutate(vendor.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                      <Mail className="w-4 h-4" />
                      {vendor.email}
                    </a>
                  )}
                  {vendor.phone && (
                    <button 
                      onClick={() => {
                        setActiveCallVendor(vendor);
                        window.location.href = `tel:${vendor.phone}`;
                      }}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                      <Phone className="w-4 h-4" />
                      {vendor.phone}
                    </button>
                  )}
                  {vendor.website && (
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                      <Globe className="w-4 h-4" />
                      {vendor.website}
                    </a>
                  )}
                  {vendor.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {vendor.city}, {vendor.state}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <Label className="text-xs font-semibold text-gray-600 mb-2 block">UPDATE STATUS</Label>
                  <Select 
                    value={vendor.status} 
                    onValueChange={(val) => updateMutation.mutate({ id: vendor.id, data: { status: val } })}
                  >
                    <SelectTrigger className="border-blue-200 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="no_answer">No Answer</SelectItem>
                      <SelectItem value="sent_message">Sent Message</SelectItem>
                      <SelectItem value="no_response">Haven't Heard Back</SelectItem>
                      <SelectItem value="not_interested">Not Interested</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                      <SelectItem value="dead">Dead Contact</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`${statusColors[vendor.status]} text-white`}>
                    {vendor.status}
                  </Badge>
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {vendor.vendor_type}
                  </Badge>
                  {vendor.rating && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-bold">{vendor.rating}</span>
                    </div>
                  )}
                </div>

                {vendor.total_purchases > 0 && (
                  <div className="pt-4 border-t border-blue-100 text-sm">
                    <p className="text-gray-600">Total Purchases</p>
                    <p className="font-bold text-green-700">${vendor.total_purchases.toFixed(0)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVendors.length === 0 && (
          <Card className="bg-white border-blue-200">
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <p className="text-blue-600">No vendors found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Call Logger */}
      {activeCallVendor && (
        <CallLogger
          contactId={activeCallVendor.id}
          contactName={activeCallVendor.company_name}
          contactType="vendor"
          onSave={handleCallLogSave}
        />
      )}

      <VendorDialog
        vendor={editingVendor}
        isOpen={isCreating || !!editingVendor}
        onClose={() => {
          setIsCreating(false);
          setEditingVendor(null);
        }}
        onSave={(data) => {
          if (editingVendor) {
            updateMutation.mutate({ id: editingVendor.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
      />
    </div>
  );
}

function VendorDialog({ vendor, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    vendor_type: 'other',
    products_supplied: [],
    license_number: '',
    license_expiry: '',
    payment_terms: '',
    minimum_order: 0,
    rating: 0,
    notes: '',
    status: 'active'
  });

  React.useEffect(() => {
    if (vendor) {
      setFormData({ ...vendor, products_supplied: vendor.products_supplied || [] });
    } else if (!isOpen) {
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        vendor_type: 'other',
        products_supplied: [],
        license_number: '',
        license_expiry: '',
        payment_terms: '',
        minimum_order: 0,
        rating: 0,
        notes: '',
        status: 'active'
      });
    }
  }, [vendor, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vendor ? 'Edit Vendor' : 'New Vendor'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company Name *</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="border-blue-200"
              />
            </div>
            <div>
              <Label>Contact Name</Label>
              <Input
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="border-blue-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-blue-200"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-blue-200"
              />
            </div>
          </div>

          <div>
            <Label>Website</Label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://"
              className="border-blue-200"
            />
          </div>

          <div>
            <Label>Address</Label>
            <AddressAutocomplete
              value={formData.address}
              onChange={(val) => setFormData({ ...formData, address: val })}
              className="border-blue-200"
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
                className="border-blue-200"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="border-blue-200"
              />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="border-blue-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vendor Type</Label>
              <Select value={formData.vendor_type} onValueChange={(val) => setFormData({ ...formData, vendor_type: val })}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grower">Grower</SelectItem>
                  <SelectItem value="processor">Processor</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="packaging">Packaging</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="sent_message">Sent Message</SelectItem>
                  <SelectItem value="no_response">Haven't Heard Back</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="dead">Dead Contact</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>License Number</Label>
              <Input
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="border-blue-200"
              />
            </div>
            <div>
              <Label>License Expiry</Label>
              <Input
                type="date"
                value={formData.license_expiry}
                onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                className="border-blue-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Payment Terms</Label>
              <Input
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="Net 30"
                className="border-blue-200"
              />
            </div>
            <div>
              <Label>Minimum Order</Label>
              <Input
                type="number"
                value={formData.minimum_order}
                onChange={(e) => setFormData({ ...formData, minimum_order: parseFloat(e.target.value) || 0 })}
                className="border-blue-200"
              />
            </div>
            <div>
              <Label>Rating (1-5)</Label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                className="border-blue-200"
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="border-blue-200 h-24"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-blue-200">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => onSave(formData)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              {vendor ? 'Update' : 'Create'} Vendor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}