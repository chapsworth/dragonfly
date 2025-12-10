import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminNav from '@/components/admin/AdminNav';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function AdminCategories() {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon_name: 'Package',
    gradient: 'from-emerald-400 to-green-500',
    is_active: true,
    display_order: 0
  });

  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCategory) {
        return await base44.entities.Category.update(editingCategory.id, data);
      }
      return await base44.entities.Category.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditOpen(false);
      setEditingCategory(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (updates) => {
      await Promise.all(
        updates.map(({ id, display_order }) =>
          base44.entities.Category.update(id, { display_order })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      icon_name: 'Package',
      gradient: 'from-emerald-400 to-green-500',
      is_active: true,
      display_order: categories.length
    });
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      icon_name: category.icon_name || 'Package',
      gradient: category.gradient || 'from-emerald-400 to-green-500',
      is_active: category.is_active !== false,
      display_order: category.display_order || 0
    });
    setIsEditOpen(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    resetForm();
    setIsEditOpen(true);
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDragEnd = (result) => {
    document.body.style.overflow = '';
    if (!result.destination) return;

    const items = Array.from(sortedCategories);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    const updates = items.map((item, index) => ({
      id: item.id,
      display_order: index
    }));

    updateOrderMutation.mutate(updates);
  };

  const sortedCategories = [...categories].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
      <div className="hidden lg:block">
        <AdminNav currentPage="AdminCategories" />
      </div>

      <div className="flex-1 p-6 pt-24 lg:pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-emerald-900">Categories</h1>
            <Button 
              onClick={handleAdd}
              className="bg-gradient-to-r from-emerald-500 to-green-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl p-6">
            <DragDropContext onDragStart={() => document.body.style.overflow = 'hidden'} onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {sortedCategories.map((category, index) => (
                      <Draggable key={category.id} draggableId={category.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-emerald-100 hover:border-emerald-300 transition-colors"
                          >
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white font-bold text-lg">
                                {category.name.charAt(0)}
                              </span>
                            </div>

                            <div className="flex-1">
                              <div className="font-semibold text-emerald-900">{category.name}</div>
                              <div className="text-sm text-emerald-600">{category.slug}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!category.is_active && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  Inactive
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(category)}
                              >
                                <Edit className="w-4 h-4 text-emerald-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(category.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {categories.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No categories yet. Click "Add Category" to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                }))}
                placeholder="Flower"
              />
            </div>

            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="flower"
              />
            </div>

            <div>
              <Label>Icon Name (Lucide)</Label>
              <Input
                value={formData.icon_name}
                onChange={(e) => setFormData(prev => ({ ...prev, icon_name: e.target.value }))}
                placeholder="Package"
              />
            </div>

            <div>
              <Label>Gradient Classes</Label>
              <Input
                value={formData.gradient}
                onChange={(e) => setFormData(prev => ({ ...prev, gradient: e.target.value }))}
                placeholder="from-emerald-400 to-green-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label>Active</Label>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-green-500"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/40 p-4 z-50">
        <AdminNav currentPage="AdminCategories" mobile />
      </div>
    </div>
  );
}