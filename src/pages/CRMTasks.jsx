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
import { CheckSquare, Plus, Search, Edit2, Trash2, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import BiometricGuard from '@/components/auth/BiometricGuard';

export default function CRMTasks() {
  return (
    <BiometricGuard>
      <CRMTasksContent />
    </BiometricGuard>
  );
}

function CRMTasksContent() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['crm-tasks'],
    queryFn: () => base44.entities.CRMTask.list()
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CRMTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      toast.success('Task created');
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CRMTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      toast.success('Task updated');
      setEditingTask(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CRMTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      toast.success('Task deleted');
    }
  });

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) ||
                         t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const priorityColors = {
    low: 'bg-gray-500',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500'
  };

  const statusColors = {
    todo: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-orange-900 mb-2 flex items-center gap-3">
              <CheckSquare className="w-10 h-10" />
              Tasks & Follow-ups
            </h1>
            <p className="text-orange-600">Manage your CRM tasks and activities</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-orange-500 to-amber-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <Card className="mb-6 bg-white border-orange-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-orange-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-orange-600 flex items-center justify-end">
                <Filter className="w-4 h-4 mr-2" />
                {filteredTasks.length} tasks
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => (
            <Card key={task.id} className="bg-white border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-900 text-lg mb-1">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingTask(task)}>
                      <Edit2 className="w-4 h-4 text-orange-600" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this task?')) {
                          deleteMutation.mutate(task.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Badge className={`${priorityColors[task.priority]} text-white`}>
                      {task.priority}
                    </Badge>
                    <Badge className={`${statusColors[task.status]} text-white`}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                  {task.assigned_to && (
                    <p className="text-sm text-gray-600">Assigned to: {task.assigned_to}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <Card className="bg-white border-orange-200">
            <CardContent className="p-12 text-center">
              <CheckSquare className="w-12 h-12 text-orange-300 mx-auto mb-4" />
              <p className="text-orange-600">No tasks found</p>
            </CardContent>
          </Card>
        )}
      </div>

      <TaskDialog
        task={editingTask}
        isOpen={isCreating || !!editingTask}
        onClose={() => {
          setIsCreating(false);
          setEditingTask(null);
        }}
        onSave={(data) => {
          if (editingTask) {
            updateMutation.mutate({ id: editingTask.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        contacts={contacts}
        vendors={vendors}
      />
    </div>
  );
}

function TaskDialog({ task, isOpen, onClose, onSave, contacts, vendors }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'other',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    assigned_to: '',
    related_contact_id: '',
    related_vendor_id: ''
  });

  React.useEffect(() => {
    if (task) {
      setFormData(task);
    } else if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        task_type: 'other',
        priority: 'medium',
        status: 'todo',
        due_date: '',
        assigned_to: '',
        related_contact_id: '',
        related_vendor_id: ''
      });
    }
  }, [task, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border-orange-200"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-orange-200 h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={formData.task_type} onValueChange={(val) => setFormData({ ...formData, task_type: val })}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                <SelectTrigger className="border-orange-200">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="border-orange-200"
              />
            </div>
          </div>

          <div>
            <Label>Assigned To (Email)</Label>
            <Input
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="user@example.com"
              className="border-orange-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Related Contact</Label>
              <Select value={formData.related_contact_id} onValueChange={(val) => setFormData({ ...formData, related_contact_id: val })}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Related Vendor</Label>
              <Select value={formData.related_vendor_id} onValueChange={(val) => setFormData({ ...formData, related_vendor_id: val })}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-orange-200">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => onSave(formData)}
              className="bg-gradient-to-r from-orange-500 to-amber-500"
            >
              {task ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}