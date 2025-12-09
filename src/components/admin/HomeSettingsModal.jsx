import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const sectionLabels = {
  hero: 'Hero Section',
  features: 'Features',
  category_grid: 'Category Grid',
  carousels: 'Product Carousels'
};

export default function HomeSettingsModal({ isOpen, onClose, settings }) {
  const [heroBackground, setHeroBackground] = useState('');
  const [sections, setSections] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (settings) {
      setHeroBackground(settings.hero_background_url || 'https://images.unsplash.com/photo-1587579286550-d42fcad93ec2?w=1600&q=80');
      setSections(settings.section_order || ['hero', 'features', 'category_grid', 'carousels']);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.asServiceRole.entities.HomeSettings.update(settings.id, data);
      } else {
        return base44.asServiceRole.entities.HomeSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homeSettings'] });
      onClose();
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setSections(items);
  };

  const handleSave = () => {
    saveMutation.mutate({
      hero_background_url: heroBackground,
      section_order: sections
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-900">
            Edit Homepage
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Hero Background */}
          <div>
            <Label className="text-emerald-900 font-semibold mb-2 block">
              Hero Background Image URL
            </Label>
            <Input
              value={heroBackground}
              onChange={(e) => setHeroBackground(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="border-emerald-200"
            />
            {heroBackground && (
              <div className="mt-3 rounded-lg overflow-hidden border border-emerald-200">
                <img 
                  src={heroBackground} 
                  alt="Preview" 
                  className="w-full h-40 object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>

          {/* Section Order */}
          <div>
            <Label className="text-emerald-900 font-semibold mb-2 block">
              Section Order
            </Label>
            <p className="text-sm text-emerald-600 mb-3">
              Drag to reorder sections on the homepage
            </p>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {sections.map((section, index) => (
                      <Draggable key={section} draggableId={section} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-3 p-4 rounded-xl border ${
                              snapshot.isDragging 
                                ? 'bg-emerald-50 border-emerald-400 shadow-lg' 
                                : 'bg-white border-emerald-200'
                            }`}
                          >
                            <GripVertical className="w-5 h-5 text-emerald-400" />
                            <span className="font-medium text-emerald-900">
                              {sectionLabels[section]}
                            </span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-emerald-100">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-green-500 text-white"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}