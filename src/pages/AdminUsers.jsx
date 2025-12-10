import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminNav from '@/components/admin/AdminNav';
import DataTable from '@/components/admin/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({});
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

  const columns = [
    { 
      header: 'Name', 
      key: 'full_name'
    },
    { 
      header: 'Email', 
      key: 'email'
    },
    { 
      header: 'Role', 
      key: 'role',
      render: (row) => <Badge variant={row.role === 'admin' ? 'default' : 'secondary'}>{row.role}</Badge>
    },
    { 
      header: 'Points', 
      key: 'loyalty_points',
      render: (row) => row.loyalty_points || 0
    },
    { 
      header: 'Tier', 
      key: 'loyalty_tier',
      render: (row) => {
        const colors = {
          bronze: 'bg-amber-100 text-amber-700',
          silver: 'bg-slate-200 text-slate-700',
          gold: 'bg-yellow-100 text-yellow-700',
          platinum: 'bg-purple-100 text-purple-700'
        };
        return <Badge className={colors[row.loyalty_tier || 'bronze']}>{row.loyalty_tier || 'bronze'}</Badge>;
      }
    },
    { 
      header: 'Joined', 
      key: 'created_date',
      render: (row) => format(new Date(row.created_date), 'MMM d, yyyy')
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <AdminNav currentPage="AdminUsers" />
      
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">Users</h1>
          <p className="text-emerald-600">Manage user accounts and loyalty status</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            onEdit={handleEdit}
            onDelete={() => alert('User deletion must be done through user management settings')}
          />
        )}

        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="bg-white/90 backdrop-blur-xl">
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
                <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">Cancel</Button>
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