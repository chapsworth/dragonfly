import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, Edit, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function Automations() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'deal_stage',
    trigger_value: '',
    action_type: 'send_email',
    delay_hours: 0,
    message_template: '',
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => base44.entities.AutomationRule.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      toast.success('Automation created');
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomationRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      toast.success('Automation updated');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      toast.success('Automation deleted');
    }
  });

  const runMutation = useMutation({
    mutationFn: () => base44.functions.invoke('processAutomations', {}),
    onSuccess: () => {
      toast.success('Automations processed');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      trigger_type: 'deal_stage',
      trigger_value: '',
      action_type: 'send_email',
      delay_hours: 0,
      message_template: '',
      is_active: true
    });
    setIsCreating(false);
    setEditingRule(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      trigger_type: 'deal_stage',
      trigger_value: '',
      action_type: 'send_email',
      delay_hours: 0,
      message_template: '',
      is_active: true
    });
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({ ...rule });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.trigger_type || !formData.action_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (rule) => {
    if (confirm(`Delete automation "${rule.name}"?`)) {
      deleteMutation.mutate(rule.id);
    }
  };

  const getTriggerDisplay = (rule) => {
    const triggers = {
      deal_stage: `Deal stage: ${rule.trigger_value}`,
      birthday: 'Customer birthday',
      inactive_customer: `${rule.trigger_value} days inactive`,
      order_status: `Order status: ${rule.trigger_value}`
    };
    return triggers[rule.trigger_type] || rule.trigger_type;
  };

  const getActionDisplay = (rule) => {
    const actions = {
      send_text: 'Send SMS',
      send_email: 'Send Email',
      update_stage: 'Update Stage',
      add_points: 'Award Points'
    };
    return actions[rule.action_type] || rule.action_type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-emerald-900 mb-2 flex items-center gap-3">
              <Zap className="w-10 h-10" />
              Marketing Automations
            </h1>
            <p className="text-emerald-600">Automated workflows for customer engagement</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => runMutation.mutate()} variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Run Now
            </Button>
            <Button onClick={handleCreate} className="bg-gradient-to-r from-emerald-500 to-green-500">
              <Plus className="w-4 h-4 mr-2" />
              New Automation
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {rules.map(rule => (
            <Card key={rule.id} className="border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-emerald-900">{rule.name}</h3>
                        <p className="text-sm text-emerald-600">
                          {getTriggerDisplay(rule)} → {getActionDisplay(rule)}
                          {rule.delay_hours > 0 && ` (${rule.delay_hours}h delay)`}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {rule.is_active ? 'Active' : 'Paused'}
                      </div>
                    </div>
                    {rule.message_template && (
                      <p className="text-sm text-gray-600 ml-13 mt-2 italic">"{rule.message_template}"</p>
                    )}
                    {rule.last_run && (
                      <p className="text-xs text-gray-500 ml-13 mt-1">
                        Last run: {new Date(rule.last_run).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(rule)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(rule)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {rules.length === 0 && (
            <Card className="border-emerald-200">
              <CardContent className="p-12 text-center">
                <Zap className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-emerald-900 mb-2">No automations yet</h3>
                <p className="text-emerald-600 mb-4">Set up automated workflows to engage customers</p>
                <Button onClick={handleCreate} className="bg-gradient-to-r from-emerald-500 to-green-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Automation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreating} onOpenChange={resetForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit' : 'Create'} Automation</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>Automation Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Birthday Discount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Trigger Type *</Label>
                  <Select value={formData.trigger_type} onValueChange={(val) => setFormData({ ...formData, trigger_type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deal_stage">Deal Stage</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="inactive_customer">Inactive Customer</SelectItem>
                      <SelectItem value="order_status">Order Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Trigger Value</Label>
                  <Input
                    value={formData.trigger_value}
                    onChange={(e) => setFormData({ ...formData, trigger_value: e.target.value })}
                    placeholder={formData.trigger_type === 'deal_stage' ? 'no_answer' : formData.trigger_type === 'inactive_customer' ? '30' : 'delivered'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action Type *</Label>
                  <Select value={formData.action_type} onValueChange={(val) => setFormData({ ...formData, action_type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_text">Send SMS</SelectItem>
                      <SelectItem value="send_email">Send Email</SelectItem>
                      <SelectItem value="add_points">Award Points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Delay (hours)</Label>
                  <Input
                    type="number"
                    value={formData.delay_hours}
                    onChange={(e) => setFormData({ ...formData, delay_hours: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Message Template</Label>
                <Textarea
                  value={formData.message_template}
                  onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                  placeholder="Your message here..."
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500">
                  {editingRule ? 'Update' : 'Create'} Automation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}