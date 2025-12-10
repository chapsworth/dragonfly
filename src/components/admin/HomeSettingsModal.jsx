import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Upload, Search, Sparkles, Loader2 } from 'lucide-react';
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
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
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

  const handleUnsplashSearch = () => {
    setIsSearching(true);
    
    // Curated cannabis and nature-themed Unsplash images
    const cannabisImages = [
      { url: 'https://images.unsplash.com/photo-1587579286550-d42fcad93ec2?w=1600&q=80', alt: 'Cannabis plant' },
      { url: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=1600&q=80', alt: 'Green cannabis leaves' },
      { url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=1600&q=80', alt: 'Cannabis leaf close-up' },
      { url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80', alt: 'Cannabis field' },
      { url: 'https://images.unsplash.com/photo-1536964549738-9124d0f1e6d8?w=1600&q=80', alt: 'Green plant background' },
      { url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=1600&q=80', alt: 'Tropical leaves' },
      { url: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=1600&q=80', alt: 'Forest nature' },
      { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80', alt: 'Green nature' },
      { url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1600&q=80', alt: 'Misty forest' },
      { url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80', alt: 'Mountain landscape' },
      { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80', alt: 'Nature sunset' },
      { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80', alt: 'Nature landscape' }
    ];
    
    setUnsplashResults(cannabisImages);
    setIsSearching(false);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({ prompt: aiPrompt });
      setHeroBackground(result.url);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setHeroBackground(result.file_url);
      setUploadedFile(file.name);
    } catch (error) {
      console.error('Upload failed:', error);
    }
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
              Hero Background Image
            </Label>
            
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload"><Upload className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="unsplash"><Search className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="ai"><Sparkles className="w-4 h-4" /></TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-3">
                <Input
                  value={heroBackground}
                  onChange={(e) => setHeroBackground(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="border-emerald-200"
                />
              </TabsContent>

              <TabsContent value="upload" className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="border-emerald-200"
                  />
                  {uploadedFile && (
                    <p className="text-sm text-emerald-600">Uploaded: {uploadedFile}</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="unsplash" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={unsplashQuery}
                    onChange={(e) => setUnsplashQuery(e.target.value)}
                    placeholder="Search Unsplash..."
                    className="border-emerald-200"
                    onKeyDown={(e) => e.key === 'Enter' && handleUnsplashSearch()}
                  />
                  <Button 
                    onClick={handleUnsplashSearch}
                    disabled={isSearching}
                    className="bg-emerald-600"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {unsplashResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {unsplashResults.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setHeroBackground(img.url)}
                        className="relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-400 transition-colors"
                      >
                        <img src={img.url} alt={img.alt || 'Image'} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ai" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the image you want..."
                    className="border-emerald-200"
                  />
                  <Button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-emerald-600">
                  AI generation takes 5-10 seconds
                </p>
              </TabsContent>
            </Tabs>

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