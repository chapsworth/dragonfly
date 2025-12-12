import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusSquare, ShoppingCart, Package, Users, Building2, CheckSquare, Calendar, FileText, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickCreateMenu() {
  const [dialogType, setDialogType] = useState(null);
  const [formData, setFormData] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  React.useEffect(() => {
    base44.auth.me().then(user => {
      setIsAdmin(user?.role === 'admin');
    }).catch(() => setIsAdmin(false));
  }, []);

  const createMutation = useMutation({
    mutationFn: async ({ entity, data }) => {
      return await base44.entities[entity].create(data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries();
      toast.success(`${variables.entity} created successfully!`);
      setDialogType(null);
      setFormData({});
    },
  });

  const handleCreate = () => {
    const entityMap = {
      order: { entity: 'Order', data: { items: [], total: 0, status: 'pending', ...formData } },
      product: { entity: 'Product', data: { category: 'flower', in_stock: true, ...formData } },
      contact: { entity: 'Contact', data: { type: 'lead', stage: 'new', ...formData } },
      vendor: { entity: 'Vendor', data: { status: 'active', ...formData } },
      task: { entity: 'CRMTask', data: { status: 'todo', priority: 'medium', ...formData } },
      event: { entity: 'CalendarEvent', data: { status: 'scheduled', ...formData } },
      note: { entity: 'CRMNote', data: { note_type: 'general', ...formData } },
      bookmark: { entity: 'Bookmark', data: { category: 'other', ...formData } },
    };

    const config = entityMap[dialogType];
    if (config) {
      createMutation.mutate(config);
    }
  };

  const renderDialog = () => {
    switch (dialogType) {
      case 'order':
        return (
          <>
            <Label>Customer Name</Label>
            <Input value={formData.customer_name || ''} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} />
            <Label>Customer Email</Label>
            <Input type="email" value={formData.customer_email || ''} onChange={(e) => setFormData({...formData, customer_email: e.target.value})} />
            <Label>Delivery Address</Label>
            <Input value={formData.delivery_address || ''} onChange={(e) => setFormData({...formData, delivery_address: e.target.value})} />
          </>
        );
      case 'product':
        return (
          <>
            <Label>Product Name *</Label>
            <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <Label>Price *</Label>
            <Input type="number" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} required />
            <Label>Description</Label>
            <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </>
        );
      case 'contact':
        return (
          <>
            <Label>Full Name *</Label>
            <Input value={formData.full_name || ''} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required />
            <Label>Email</Label>
            <Input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <Label>Phone</Label>
            <Input value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          </>
        );
      case 'vendor':
        return (
          <>
            <Label>Company Name *</Label>
            <Input value={formData.company_name || ''} onChange={(e) => setFormData({...formData, company_name: e.target.value})} required />
            <Label>Contact Name</Label>
            <Input value={formData.contact_name || ''} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} />
            <Label>Email</Label>
            <Input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </>
        );
      case 'task':
        return (
          <>
            <Label>Task Title *</Label>
            <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            <Label>Description</Label>
            <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <Label>Due Date</Label>
            <Input type="date" value={formData.due_date || ''} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
          </>
        );
      case 'event':
        return (
          <>
            <Label>Event Title *</Label>
            <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            <Label>Start Date *</Label>
            <Input type="datetime-local" value={formData.start_date || ''} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required />
            <Label>Location</Label>
            <Input value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} />
          </>
        );
      case 'note':
        return (
          <>
            <Label>Title</Label>
            <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            <Label>Content *</Label>
            <Textarea value={formData.content || ''} onChange={(e) => setFormData({...formData, content: e.target.value})} rows={4} required />
          </>
        );
      case 'bookmark':
        return (
          <>
            <Label>Title *</Label>
            <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            <Label>URL *</Label>
            <Input type="url" value={formData.url || ''} onChange={(e) => setFormData({...formData, url: e.target.value})} required />
            <Label>Description</Label>
            <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </>
        );
      default:
        return null;
    }
  };

  const dialogTitles = {
    order: 'New Order',
    product: 'New Product',
    contact: 'New Contact',
    vendor: 'New Vendor',
    task: 'New Task',
    event: 'New Event',
    note: 'New Note',
    bookmark: 'New Bookmark',
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded-xl hover:bg-emerald-50 transition-colors">
            <PlusSquare className="w-6 h-6 text-emerald-700" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setDialogType('order')}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            New Order
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogType('product')}>
            <Package className="w-4 h-4 mr-2" />
            New Product
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogType('contact')}>
            <Users className="w-4 h-4 mr-2" />
            New Contact
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogType('vendor')}>
            <Building2 className="w-4 h-4 mr-2" />
            New Vendor
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogType('task')}>
            <CheckSquare className="w-4 h-4 mr-2" />
            New Task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogType('event')}>
            <Calendar className="w-4 h-4 mr-2" />
            New Event
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogType('note')}>
            <FileText className="w-4 h-4 mr-2" />
            New Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogType('bookmark')}>
            <Bookmark className="w-4 h-4 mr-2" />
            New Bookmark
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!dialogType} onOpenChange={() => { setDialogType(null); setFormData({}); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitles[dialogType]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {renderDialog()}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreate} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500">
                Create
              </Button>
              <Button variant="outline" onClick={() => { setDialogType(null); setFormData({}); }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}