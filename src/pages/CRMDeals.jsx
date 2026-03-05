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
    mutationFn: (data) => base44.entities.Deal.create({
      ...data,
      last_activity: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created');
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, {
      ...data,
      last_activity: new Date().toISOString()
    }),
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
    mutationFn: ({ id, stage }) => base44.entities.Deal.update(id, { 
      stage,
      last_activity: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStage = result.destination.droppableId;

    moveDealMutation.mutate({ id: dealId, stage: newStage });
  };

  const filteredDeals = deals.filter(d => 
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stages = [
    { id: 'lead', label: 'Lead', color: 'bg-gray-500' },
    { id: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
    { id: 'proposal', label: 'Proposal', color: 'bg-purple-500' },
    { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
    { id: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
    { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' }
  ];

  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(d => d.stage === stage.id);
    return acc;
  }, {});

  const totalValue = filteredDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedValue = filteredDeals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0);
  const wonDeals = deals.filter(d => d.stage === 'closed_won');
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {stages.map(stage => (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[600px] rounded-xl p-4 ${
                      snapshot.isDraggingOver ? 'bg-indigo-100' : 'bg-white/60'
                    } backdrop-blur border-2 border-indigo-200`}
                  >
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                        <h3 className="font-bold text-indigo-900">{stage.label}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{dealsByStage[stage.id].length} deals</span>
                        <span>•</span>
                        <span>
                          ${dealsByStage[stage.id].reduce((sum, d) => sum + (d.value || 0), 0).toLocaleString()}
                        </span>
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
                              className={`${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <Card className="bg-white border-indigo-200 hover:shadow-md transition-shadow cursor-move">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-indigo-900 text-sm">{deal.title}</h4>
                                    <div className="flex gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={() => setEditingDeal(deal)}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-red-600"
                                        onClick={() => {
                                          if (confirm('Delete this deal?')) {
                                            deleteMutation.mutate(deal.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {deal.contact_name && (
                                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                      <User className="w-3 h-3" />
                                      {deal.contact_name}
                                    </div>
                                  )}
                                  <div className="text-lg font-bold text-green-700 mb-2">
                                    ${(deal.value || 0).toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs mb-2">
                                    <Badge variant="outline" className="border-indigo-300">
                                      {deal.probability}% prob
                                    </Badge>
                                    {deal.priority && (
                                      <Badge className={
                                        deal.priority === 'urgent' ? 'bg-red-500' :
                                        deal.priority === 'high' ? 'bg-orange-500' :
                                        deal.priority === 'medium' ? 'bg-yellow-500' :
                                        'bg-gray-500'
                                      }>
                                        {deal.priority}
                                      </Badge>
                                    )}
                                  </div>
                                  {deal.expected_close_date && (
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <Clock className="w-3 h-3" />
                                      {new Date(deal.expected_close_date).toLocaleDateString()}
                                    </div>
                                  )}
                                  {deal.next_step && (
                                    <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-indigo-100">
                                      Next: {deal.next_step}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
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
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
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