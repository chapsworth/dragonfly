import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminNav from '@/components/admin/AdminNav';
import DataTable from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const categories = ['flower', 'pre-rolls', 'edibles', 'concentrates', 'vapes', 'tinctures', 'topicals', 'accessories'];
const strainTypes = ['indica', 'sativa', 'hybrid', 'cbd', 'n/a'];

export default function AdminProducts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingProduct) {
        return base44.entities.Product.update(editingProduct.id, data);
      }
      return base44.entities.Product.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingProduct(null);
    setFormData({ in_stock: true, category: 'flower', strain_type: 'hybrid' });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      price: parseFloat(formData.price) || 0,
      thc_level: parseFloat(formData.thc_level) || 0,
      cbd_level: parseFloat(formData.cbd_level) || 0,
    });
  };

  const columns = [
    { header: 'Name', key: 'name' },
    { 
      header: 'Category', 
      key: 'category',
      render: (row) => <Badge variant="secondary">{row.category}</Badge>
    },
    { 
      header: 'Price', 
      key: 'price',
      render: (row) => `$${row.price?.toFixed(2)}` 
    },
    { 
      header: 'THC/CBD', 
      key: 'thc',
      render: (row) => `${row.thc_level}% / ${row.cbd_level}%`
    },
    { 
      header: 'Stock', 
      key: 'in_stock',
      render: (row) => row.in_stock ? '✓' : '✗'
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <AdminNav currentPage="AdminProducts" />
      
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-emerald-900 mb-2">Products</h1>
            <p className="text-emerald-600">Manage your product catalog</p>
          </div>
          <Button onClick={handleNew} className="bg-gradient-to-r from-emerald-500 to-green-500">
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={products}
            onEdit={handleEdit}
            onDelete={(p) => deleteMutation.mutate(p.id)}
          />
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category || 'flower'} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Strain Type</Label>
                  <Select value={formData.strain_type || 'hybrid'} onValueChange={(v) => setFormData({...formData, strain_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {strainTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Price ($)</Label>
                  <Input type="number" step="0.01" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <Label>THC (%)</Label>
                  <Input type="number" step="0.1" value={formData.thc_level || ''} onChange={(e) => setFormData({...formData, thc_level: e.target.value})} />
                </div>
                <div>
                  <Label>CBD (%)</Label>
                  <Input type="number" step="0.1" value={formData.cbd_level || ''} onChange={(e) => setFormData({...formData, cbd_level: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Weight/Size</Label>
                  <Input value={formData.weight || ''} onChange={(e) => setFormData({...formData, weight: e.target.value})} placeholder="e.g. 3.5g" />
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input value={formData.image_url || ''} onChange={(e) => setFormData({...formData, image_url: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500">
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}