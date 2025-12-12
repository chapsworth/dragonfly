import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Plus, Edit, Trash2, Star, Save, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

export default function Profile() {
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [addressForm, setAddressForm] = useState({});

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => base44.entities.Address.list('-is_default')
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setEditingProfile(false);
      toast.success('Profile updated successfully');
    }
  });

  const createAddressMutation = useMutation({
    mutationFn: (data) => base44.entities.Address.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsAddressDialogOpen(false);
      setAddressForm({});
      toast.success('Address added successfully');
    },
    onError: (error) => {
      console.error('Address creation error:', error);
      toast.error('Failed to add address: ' + (error.message || 'Unknown error'));
    }
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Address.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm({});
      toast.success('Address updated successfully');
    },
    onError: (error) => {
      console.error('Address update error:', error);
      toast.error('Failed to update address: ' + (error.message || 'Unknown error'));
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id) => base44.entities.Address.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted successfully');
    }
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (addressId) => {
      // Remove default from all addresses
      const updatePromises = addresses.map(addr => 
        base44.entities.Address.update(addr.id, { is_default: addr.id === addressId })
      );
      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Default address updated');
    }
  });

  const handleEditProfile = () => {
    setProfileForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      birthday: user.birthday || ''
    });
    setEditingProfile(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      label: '',
      full_address: '',
      is_default: addresses.length === 0,
      delivery_instructions: ''
    });
    setIsAddressDialogOpen(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label,
      full_address: address.full_address,
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || '',
      lat: address.lat,
      lng: address.lng,
      is_default: address.is_default,
      delivery_instructions: address.delivery_instructions || ''
    });
    setIsAddressDialogOpen(true);
  };

  const handleSaveAddress = () => {
    if (!addressForm.label || !addressForm.full_address) {
      toast.error('Label and address are required');
      return;
    }

    // Clean data - remove empty strings for optional fields
    const cleanData = Object.entries(addressForm).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: cleanData });
    } else {
      createAddressMutation.mutate({ ...cleanData, user_email: user.email });
    }
  };

  const handleDeleteAddress = (id) => {
    if (confirm('Delete this address?')) {
      deleteAddressMutation.mutate(id);
    }
  };

  if (userLoading || addressesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-emerald-900">My Profile</h1>

        {/* Profile Details Card */}
        <Card className="bg-white/60 backdrop-blur-xl border-white/40 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-6 h-6 text-emerald-600" />
              Profile Details
            </CardTitle>
            {!editingProfile ? (
              <Button onClick={handleEditProfile} size="sm" className="bg-gradient-to-r from-emerald-500 to-green-500">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setEditingProfile(false)} size="sm" variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} size="sm" className="bg-gradient-to-r from-emerald-500 to-green-500">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!editingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Full Name</Label>
                    <p className="text-lg font-semibold text-emerald-900">{user.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Phone</Label>
                    <p className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {user.phone || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Birthday</Label>
                    <p className="text-lg font-semibold text-emerald-900">{user.birthday || 'Not set'}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Badge className="bg-emerald-500">{user.role}</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label>Birthday</Label>
                    <Input
                      type="date"
                      value={profileForm.birthday}
                      onChange={(e) => setProfileForm({ ...profileForm, birthday: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Addresses Card */}
        <Card className="bg-white/60 backdrop-blur-xl border-white/40 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-600" />
              Delivery Addresses
            </CardTitle>
            <Button onClick={handleAddAddress} size="sm" className="bg-gradient-to-r from-emerald-500 to-green-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </CardHeader>
          <CardContent>
            {addresses.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No addresses saved yet</p>
                <p className="text-sm">Add your first delivery address</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="p-4 rounded-xl bg-white border-2 hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-emerald-900">{address.label}</h3>
                        {address.is_default && (
                          <Badge className="bg-yellow-500 flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditAddress(address)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteAddress(address.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{address.full_address}</p>
                    {address.delivery_instructions && (
                      <p className="text-sm text-gray-600 italic">"{address.delivery_instructions}"</p>
                    )}
                    {!address.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDefaultAddressMutation.mutate(address.id)}
                        className="mt-2"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Set as Default
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Label *</Label>
              <Input
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                placeholder="Home, Work, etc."
              />
            </div>
            <div>
              <Label>Address *</Label>
              <AddressAutocomplete
                value={addressForm.full_address}
                onChange={(val) => setAddressForm({ ...addressForm, full_address: val })}
                placeholder="Start typing address..."
                onPlaceSelect={(details) => {
                  setAddressForm({
                    ...addressForm,
                    full_address: details.address,
                    street: details.street || '',
                    city: details.city || '',
                    state: details.state || '',
                    zip: details.zip || '',
                    lat: details.lat,
                    lng: details.lng
                  });
                }}
              />
            </div>
            <div>
              <Label>Delivery Instructions</Label>
              <Textarea
                value={addressForm.delivery_instructions}
                onChange={(e) => setAddressForm({ ...addressForm, delivery_instructions: e.target.value })}
                placeholder="Leave at door, ring bell, etc."
                rows={3}
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSaveAddress}
                disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingAddress ? 'Update' : 'Add'} Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}