import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, TrendingUp, Clock, Target, Edit2, Trash2, Search, User, ChevronDown, ChevronUp, History } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import BiometricGuard from '@/components/auth/BiometricGuard';

export default function CRMDeals() {
  return (
    <BiometricGuard>
      <CRMDealsContent />
    </BiometricGuard>
  );
}

function CRMDealsContent() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('kanban');
  const queryClient = useQueryClient();

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-last_activity')
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const now = new Date().toISOString();
      const stageObj = stages.find(s => s.id === data.stage) || { label: data.stage };
      return base44.entities.Deal.create({
        ...data,
        last_activity: now,
        stage_history: [{ stage: data.stage, label: stageObj.label, timestamp: now, changed_by: '' }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created');
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const now = new Date().toISOString();
      const existing = deals.find(d => d.id === id);
      const stageObj = stages.find(s => s.id === data.stage) || { label: data.stage };
      const history = existing?.stage_history || [];
      const stageChanged = existing?.stage !== data.stage;
      return base44.entities.Deal.update(id, {
        ...data,
        last_activity: now,
        stage_history: stageChanged
          ? [...history, { stage: data.stage, label: stageObj.label, timestamp: now, changed_by: '' }]
          : history
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal updated');
      setEditingDeal(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Deal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal deleted');
    }
  });

  const moveDealMutation = useMutation({
    mutationFn: ({ id, stage, deal, stageLabel }) => {
      const now = new Date().toISOString();
      const history = deal.stage_history || [];
      const newEntry = { stage, label: stageLabel, timestamp: now, changed_by: '' };
      return base44.entities.Deal.update(id, {
        stage,
        last_activity: now,
        stage_history: [...history, newEntry]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const dealId = result.draggableId;
    const newStage = result.destination.droppableId;
    const deal = deals.find(d => d.id === dealId);
    const stageObj = stages.find(s => s.id === newStage);
    moveDealMutation.mutate({ id: dealId, stage: newStage, deal, stageLabel: stageObj?.label || newStage });
  };

  const filteredDeals = deals.filter(d => 
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stages = [
    { id: 'new', label: 'New', color: 'bg-gray-400' },
    { id: 'existing', label: 'Existing', color: 'bg-blue-400' },
    { id: 'waiting_for_delivery', label: 'Waiting for Delivery', color: 'bg-yellow-500' },
    { id: 'order_delivered', label: 'Order Delivered', color: 'bg-green-500' },
    { id: 'returning_customer', label: 'Returning Customer', color: 'bg-teal-500' },
    { id: 'vip_customer', label: 'VIP Customer', color: 'bg-purple-500' },
    { id: 'og_customer', label: 'OG Customer', color: 'bg-amber-600' },
    { id: 'special_needs', label: 'Special Needs', color: 'bg-pink-500' },
    { id: 'orders_weekly', label: 'Orders Weekly', color: 'bg-indigo-500' },
    { id: 'orders_daily', label: 'Orders Daily', color: 'bg-rose-500' }
  ];

  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(d => d.stage === stage.id);
    return acc;
  }, {});

  const totalValue = filteredDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedValue = filteredDeals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0);
  const wonDeals = deals.filter(d => d.stage === 'order_delivered');
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-indigo-900 mb-2 flex items-center gap-3">
              <Target className="w-10 h-10" />
              Deal Pipeline
            </h1>
            <p className="text-indigo-600">Manage your sales pipeline</p>
          </div>
          <Button 
            onClick={() => setIsCreating(true)} 
            className="bg-gradient-to-r from-indigo-500 to-purple-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Pipeline Value</p>
                  <p className="text-xl font-bold text-indigo-900">${totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Weighted Value</p>
                  <p className="text-xl font-bold text-blue-900">${weightedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Won This Month</p>
                  <p className="text-xl font-bold text-green-900">${wonValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Active Deals</p>
                  <p className="text-xl font-bold text-purple-900">{deals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
            <Input
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-indigo-200"
            />
          </div>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minWidth: 0 }}>
            {stages.map(stage => (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[600px] rounded-xl p-4 shrink-0 w-64 ${
                      snapshot.isDraggingOver ? 'bg-indigo-100' : 'bg-white/60'
                    } backdrop-blur border-2 border-indigo-200`}
                  >
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                        <h3 className="font-bold text-indigo-900">{stage.label}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{dealsByStage[stage.id].length} customers</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                      {dealsByStage[stage.id].map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                            >
                              <DealCard
                                deal={deal}
                                onEdit={() => setEditingDeal(deal)}
                                onDelete={() => { if (confirm('Delete this customer record?')) deleteMutation.mutate(deal.id); }}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Deal Form Dialog */}
      <DealDialog
        deal={editingDeal}
        isOpen={isCreating || !!editingDeal}
        contacts={contacts}
        onClose={() => {
          setIsCreating(false);
          setEditingDeal(null);
        }}
        onSave={(data) => {
          if (editingDeal) {
            updateMutation.mutate({ id: editingDeal.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
      />
    </div>
  );
}

function DealCard({ deal, onEdit, onDelete }) {
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const history = deal.stage_history || [];

  return (
    <Card className="bg-white border-indigo-200 hover:shadow-md transition-shadow cursor-move">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-bold text-indigo-900 text-sm leading-tight">{deal.title}</h4>
          <div className="flex gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onEdit}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        {deal.contact_name && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
            <User className="w-3 h-3" />
            {deal.contact_name}
          </div>
        )}
        <div className="text-base font-bold text-green-700 mb-1">
          ${(deal.value || 0).toLocaleString()}
        </div>
        {deal.priority && (
          <Badge className={`text-xs mb-1 ${
            deal.priority === 'urgent' ? 'bg-red-500' :
            deal.priority === 'high' ? 'bg-orange-500' :
            deal.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
          }`}>
            {deal.priority}
          </Badge>
        )}
        {deal.next_step && (
          <div className="text-xs text-gray-600 mt-1 pt-1 border-t border-indigo-100">
            Next: {deal.next_step}
          </div>
        )}

        {/* Activity History - collapsed by default */}
        {history.length > 0 && (
          <div className="mt-2 pt-2 border-t border-indigo-100">
            <button
              onClick={(e) => { e.stopPropagation(); setHistoryOpen(!historyOpen); }}
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 w-full"
            >
              <History className="w-3 h-3" />
              <span>Activity ({history.length})</span>
              {historyOpen ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {historyOpen && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {[...history].reverse().map((h, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                    <div>
                      <span className="font-medium text-gray-800">{h.label}</span>
                      <div className="text-gray-400">{new Date(h.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DealDialog({ deal, isOpen, contacts, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    contact_id: '',
    contact_name: '',
    value: 0,
    probability: 50,
    expected_close_date: '',
    stage: 'lead',
    description: '',
    products: [],
    priority: 'medium',
    source: '',
    assigned_to: '',
    next_step: ''
  });

  React.useEffect(() => {
    if (deal) {
      setFormData({ ...deal, products: deal.products || [] });
    } else if (!isOpen) {
      setFormData({
        title: '',
        contact_id: '',
        contact_name: '',
        value: 0,
        probability: 50,
        expected_close_date: '',
        stage: 'lead',
        description: '',
        products: [],
        priority: 'medium',
        source: '',
        assigned_to: '',
        next_step: ''
      });
    }
  }, [deal, isOpen]);

  const handleContactChange = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    setFormData({
      ...formData,
      contact_id: contactId,
      contact_name: contact?.full_name || ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'New Deal'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Deal Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Website Redesign Project"
                className="border-indigo-200"
              />
            </div>

            <div>
              <Label>Contact</Label>
              <Select value={formData.contact_id} onValueChange={handleContactChange}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Deal Value * ($)</Label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                className="border-indigo-200"
              />
            </div>

            <div>
              <Label>Probability (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                className="border-indigo-200"
              />
            </div>

            <div>
              <Label>Expected Close Date</Label>
              <Input
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                className="border-indigo-200"
              />
            </div>

            <div>
              <Label>Stage</Label>
              <Select value={formData.stage} onValueChange={(val) => setFormData({ ...formData, stage: val })}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="existing">Existing</SelectItem>
                  <SelectItem value="waiting_for_delivery">Waiting for Delivery</SelectItem>
                  <SelectItem value="order_delivered">Order Delivered</SelectItem>
                  <SelectItem value="returning_customer">Returning Customer</SelectItem>
                  <SelectItem value="vip_customer">VIP Customer</SelectItem>
                  <SelectItem value="og_customer">OG Customer</SelectItem>
                  <SelectItem value="special_needs">Special Needs Customer</SelectItem>
                  <SelectItem value="orders_weekly">Orders Weekly</SelectItem>
                  <SelectItem value="orders_daily">Orders Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-indigo-200 h-24"
              placeholder="Deal details, requirements, notes..."
            />
          </div>

          <div>
            <Label>Next Step</Label>
            <Input
              value={formData.next_step}
              onChange={(e) => setFormData({ ...formData, next_step: e.target.value })}
              placeholder="Schedule follow-up call"
              className="border-indigo-200"
            />
          </div>

          <div>
            <Label>Source</Label>
            <Input
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="Website, referral, cold call..."
              className="border-indigo-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-indigo-200">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => onSave(formData)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500"
              disabled={!formData.title || formData.value <= 0}
            >
              {deal ? 'Update' : 'Create'} Deal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}