import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '@/components/admin/AdminNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { LayoutDashboard, Package, ShoppingCart, Users, ArrowLeft, Grid3x3, List, Edit2, User } from 'lucide-react';

export default function AdminUsers() {
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    }
  });

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      loyalty_points: user.loyalty_points || 0,
      loyalty_tier: user.loyalty_tier || 'bronze',
      role: user.role || 'user'
    });
  };

  const handleSave = () => {
    updateMutation.mutate({ 
      id: editingUser.id, 
      data: {
        ...formData,
        loyalty_points: parseFloat(formData.loyalty_points) || 0
      }
    });
  };

  const tierColors = {
    bronze: 'bg-amber-100 text-amber-700',
    silver: 'bg-slate-200 text-slate-700',
    gold: 'bg-yellow-100 text-yellow-700',
    platinum: 'bg-purple-100 text-purple-700'
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'AdminDashboard' },
    { id: 'products', label: 'Products', icon: Package, page: 'AdminProducts' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, page: 'AdminOrders' },
    { id: 'users', label: 'Users', icon: Users, page: 'AdminUsers' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Mobile Header with Tabs */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/40">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-emerald-900">Admin</h1>
        </div>
        <div className="overflow-x-auto scrollbar-hide px-4 pb-2">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === 'users';
              return (
                <Link key={tab.id} to={createPageUrl(tab.page)}>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                        : 'bg-white/60 text-emerald-700 hover:bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Nav */}
        <div className="hidden lg:block">
          <AdminNav currentPage="AdminUsers" />
        </div>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 sm:pt-24 lg:pt-8 pb-20 lg:pb-8">
          <div className="flex flex-col gap-4 mb-6 lg:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-900 mb-1 sm:mb-2">Users</h1>
              <p className="text-sm sm:text-base text-emerald-600">Manage user accounts and loyalty</p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-white/60 backdrop-blur-xl p-1 rounded-xl w-fit">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''}
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {users.map((user) => (
                <div key={user.id} className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-emerald-900 text-sm line-clamp-1">{user.full_name || 'Anonymous'}</h3>
                      <p className="text-xs text-emerald-600 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">{user.role}</Badge>
                    <Badge className={tierColors[user.loyalty_tier || 'bronze'] + ' text-xs'}>{user.loyalty_tier || 'bronze'}</Badge>
                    <span className="text-xs text-emerald-600">{user.loyalty_points || 0} pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-600">Joined {format(new Date(user.created_date), 'MMM d, yyyy')}</span>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(user)} className="h-7 text-xs">
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-emerald-900 text-sm line-clamp-1">{user.full_name || 'Anonymous'}</h3>
                          <p className="text-xs text-emerald-600 truncate">{user.email}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(user)} className="h-7 text-xs flex-shrink-0">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">{user.role}</Badge>
                        <Badge className={tierColors[user.loyalty_tier || 'bronze'] + ' text-xs'}>{user.loyalty_tier || 'bronze'}</Badge>
                        <span className="text-xs text-emerald-600">{user.loyalty_points || 0} pts</span>
                        <span className="text-xs text-emerald-600">• {format(new Date(user.created_date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Dialog open={!!editingUser} onOpenChange={() => { setEditingUser(null); setFormData({}); }}>
            <DialogContent className="max-w-2xl bg-white/90 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm text-emerald-900">{editingUser?.full_name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-emerald-600">{editingUser?.email}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={formData.role || 'user'} onValueChange={(v) => setFormData({...formData, role: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Loyalty Points</Label>
                  <Input 
                    type="number" 
                    value={formData.loyalty_points || 0} 
                    onChange={(e) => setFormData({...formData, loyalty_points: e.target.value})} 
                  />
                </div>
                <div>
                  <Label>Loyalty Tier</Label>
                  <Select value={formData.loyalty_tier || 'bronze'} onValueChange={(v) => setFormData({...formData, loyalty_tier: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => { setEditingUser(null); setFormData({}); }} className="flex-1">Cancel</Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500">
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}