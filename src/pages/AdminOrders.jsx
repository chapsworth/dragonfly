import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminNav from '@/components/admin/AdminNav';
import DataTable from '@/components/admin/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const statusOptions = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const order = await base44.entities.Order.update(id, data);
      
      // Send status update email if status changed
      if (data.status && data.status !== editingOrder?.status) {
        try {
          await base44.functions.invoke('sendOrderEmail', {
            orderId: id,
            status: data.status,
            customerEmail: order.customer_email,
            customerName: order.customer_name
          });
        } catch (e) {
          console.error('Email error:', e);
        }
      }
      
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setEditingOrder(null);
      setFormData({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      status: order.status,
      driver_name: order.driver_name || '',
      driver_phone: order.driver_phone || '',
      delivery_lat: order.delivery_lat || '',
      delivery_lng: order.delivery_lng || ''
    });
  };

  const handleSave = () => {
    const updateData = { 
      status: formData.status,
      driver_name: formData.driver_name,
      driver_phone: formData.driver_phone
    };
    
    if (formData.delivery_lat) {
      updateData.delivery_lat = parseFloat(formData.delivery_lat);
    }
    if (formData.delivery_lng) {
      updateData.delivery_lng = parseFloat(formData.delivery_lng);
    }
    
    updateMutation.mutate({ id: editingOrder.id, data: updateData });
  };

  const columns = [
    { 
      header: 'Order ID', 
      key: 'id',
      render: (row) => `#${row.id.slice(0, 8)}`
    },
    { 
      header: 'Customer', 
      key: 'customer_name'
    },
    { 
      header: 'Date', 
      key: 'created_date',
      render: (row) => format(new Date(row.created_date), 'MMM d, yyyy')
    },
    { 
      header: 'Total', 
      key: 'total',
      render: (row) => `$${row.total?.toFixed(2)}`
    },
    { 
      header: 'Status', 
      key: 'status',
      render: (row) => {
        const colors = {
          pending: 'bg-yellow-100 text-yellow-700',
          confirmed: 'bg-blue-100 text-blue-700',
          preparing: 'bg-purple-100 text-purple-700',
          out_for_delivery: 'bg-cyan-100 text-cyan-700',
          delivered: 'bg-green-100 text-green-700',
          cancelled: 'bg-red-100 text-red-700',
        };
        return <Badge className={colors[row.status]}>{row.status.replace('_', ' ')}</Badge>;
      }
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <AdminNav currentPage="AdminOrders" />
      
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">Orders</h1>
          <p className="text-emerald-600">Manage customer orders</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={orders}
            onEdit={handleEdit}
            onDelete={(o) => {
              if (confirm('Delete this order?')) deleteMutation.mutate(o.id);
            }}
          />
        )}

        <Dialog open={!!editingOrder} onOpenChange={() => { setEditingOrder(null); setFormData({}); }}>
          <DialogContent className="max-w-2xl bg-white/90 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Update Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order ID</Label>
                  <p className="text-sm text-emerald-600">#{editingOrder?.id.slice(0, 8)}</p>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p className="text-sm text-emerald-900">{editingOrder?.customer_name}</p>
                </div>
              </div>
              
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-emerald-100 pt-4">
                <Label className="text-base font-semibold mb-3 block">Delivery Tracking Info</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Driver Name</Label>
                    <Input 
                      value={formData.driver_name || ''} 
                      onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Driver Phone</Label>
                    <Input 
                      value={formData.driver_phone || ''} 
                      onChange={(e) => setFormData({...formData, driver_phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label>Delivery Latitude</Label>
                    <Input 
                      type="number"
                      step="0.000001"
                      value={formData.delivery_lat || ''} 
                      onChange={(e) => setFormData({...formData, delivery_lat: e.target.value})}
                      placeholder="34.0522"
                    />
                  </div>
                  <div>
                    <Label>Delivery Longitude</Label>
                    <Input 
                      type="number"
                      step="0.000001"
                      value={formData.delivery_lng || ''} 
                      onChange={(e) => setFormData({...formData, delivery_lng: e.target.value})}
                      placeholder="-118.2437"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => { setEditingOrder(null); setFormData({}); }} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500">
                  {updateMutation.isPending ? 'Updating...' : 'Update Order'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}