import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Upload, Search, Sparkles, Loader2, X, Plus, Clipboard } from 'lucide-react';
import { toast } from 'sonner';

export default function StrainEditModal({ strain, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});
  const [imageTab, setImageTab] = useState('current');
  const [imageUrl, setImageUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newEffect, setNewEffect] = useState('');
  const [newFlavor, setNewFlavor] = useState('');
  const [newMedicalUse, setNewMedicalUse] = useState('');

  useEffect(() => {
    if (strain) {
      setFormData({
        name: strain.name || '',
        type: strain.type || 'hybrid',
        thc_min: strain.thc_min || 0,
        thc_max: strain.thc_max || 0,
        cbd_min: strain.cbd_min || 0,
        cbd_max: strain.cbd_max || 0,
        description: strain.description || '',
        effects: strain.effects || [],
        flavors: strain.flavors || [],
        medical_uses: strain.medical_uses || [],
        genetics: strain.genetics || '',
        image_url: strain.image_url || '',
        growing_difficulty: strain.growing_difficulty || 'moderate',
        flowering_time: strain.flowering_time || '',
        popular: strain.popular || false
      });
      setImageUrl(strain.image_url || '');
    }
  }, [strain]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Strain.update(strain.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strains'] });
      toast.success('Strain updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to update strain');
      console.error(error);
    }
  });

  const handleAiImageSearch = async () => {
    setIsSearching(true);
    try {
      const response = await base44.functions.invoke('searchUnsplash', {
        query: `cannabis ${formData.name}`
      });
      
      if (response.data.results?.length > 0) {
        setSearchResults(response.data.results);
        toast.success(`Found ${response.data.results.length} images`);
      } else {
        toast.error('No images found');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to search images');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `Professional macro photography of ${formData.name} cannabis strain, high quality cannabis buds with visible trichomes, detailed close-up, studio lighting, clean white background, product photography style`
      });
      
      setFormData({ ...formData, image_url: response.url });
      setImageUrl(response.url);
      toast.success('Image generated successfully');
      setImageTab('current');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      setImageUrl(file_url);
      toast.success('Image uploaded successfully');
      setImageTab('current');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      ...formData,
      thc_min: parseFloat(formData.thc_min) || 0,
      thc_max: parseFloat(formData.thc_max) || 0,
      cbd_min: parseFloat(formData.cbd_min) || 0,
      cbd_max: parseFloat(formData.cbd_max) || 0
    });
  };

  const addItem = (type) => {
    if (type === 'effect' && newEffect.trim()) {
      setFormData({ ...formData, effects: [...formData.effects, newEffect.trim()] });
      setNewEffect('');
    } else if (type === 'flavor' && newFlavor.trim()) {
      setFormData({ ...formData, flavors: [...formData.flavors, newFlavor.trim()] });
      setNewFlavor('');
    } else if (type === 'medical' && newMedicalUse.trim()) {
      setFormData({ ...formData, medical_uses: [...formData.medical_uses, newMedicalUse.trim()] });
      setNewMedicalUse('');
    }
  };

  const removeItem = (type, index) => {
    if (type === 'effect') {
      setFormData({ ...formData, effects: formData.effects.filter((_, i) => i !== index) });
    } else if (type === 'flavor') {
      setFormData({ ...formData, flavors: formData.flavors.filter((_, i) => i !== index) });
    } else if (type === 'medical') {
      setFormData({ ...formData, medical_uses: formData.medical_uses.filter((_, i) => i !== index) });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Strain</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Management */}
          <div>
            <Label>Strain Image</Label>
            <Tabs value={imageTab} onValueChange={setImageTab} className="mt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="current">Current</TabsTrigger>
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="search">AI Search</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="space-y-3">
                {imageUrl ? (
                  <div className="relative group">
                    <img src={imageUrl} alt="Strain" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleGenerateImage}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">No image</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Enter image URL..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="pr-20"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) {
                              setImageUrl(text);
                              toast.success('URL pasted from clipboard');
                            } else {
                              toast.error('Clipboard is empty');
                            }
                          } catch (error) {
                            console.error('Paste error:', error);
                            toast.error('Failed to read clipboard. Please paste manually.');
                          }
                        }}
                        title="Paste from clipboard"
                      >
                        <Clipboard className="w-4 h-4" />
                      </Button>
                      {imageUrl && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setImageUrl('');
                            setFormData({ ...formData, image_url: '' });
                            toast.success('Image URL cleared');
                          }}
                          title="Clear URL"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, image_url: imageUrl });
                    toast.success('Image URL updated');
                  }}
                  className="w-full"
                  disabled={!imageUrl}
                >
                  Set Image URL
                </Button>
              </TabsContent>

              <TabsContent value="upload" className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">Click to upload or drag and drop</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                </div>
              </TabsContent>

              <TabsContent value="search" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiImageSearch()}
                  />
                  <Button onClick={handleAiImageSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                  <Button onClick={handleGenerateImage} disabled={isGenerating} variant="secondary">
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {searchResults.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="w-full h-24 object-cover rounded cursor-pointer hover:ring-2 ring-emerald-500"
                        onClick={() => {
                          setFormData({ ...formData, image_url: img });
                          setImageUrl(img);
                          toast.success('Image selected');
                          setImageTab('current');
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indica">Indica</SelectItem>
                  <SelectItem value="sativa">Sativa</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="cbd">CBD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* THC/CBD */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>THC Min %</Label>
              <Input
                type="number"
                value={formData.thc_min || ''}
                onChange={(e) => setFormData({ ...formData, thc_min: e.target.value })}
              />
            </div>
            <div>
              <Label>THC Max %</Label>
              <Input
                type="number"
                value={formData.thc_max || ''}
                onChange={(e) => setFormData({ ...formData, thc_max: e.target.value })}
              />
            </div>
            <div>
              <Label>CBD Min %</Label>
              <Input
                type="number"
                value={formData.cbd_min || ''}
                onChange={(e) => setFormData({ ...formData, cbd_min: e.target.value })}
              />
            </div>
            <div>
              <Label>CBD Max %</Label>
              <Input
                type="number"
                value={formData.cbd_max || ''}
                onChange={(e) => setFormData({ ...formData, cbd_max: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Effects */}
          <div>
            <Label>Effects</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add effect..."
                value={newEffect}
                onChange={(e) => setNewEffect(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem('effect')}
              />
              <Button onClick={() => addItem('effect')} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.effects?.map((effect, i) => (
                <Badge key={i} variant="outline" className="border-purple-300 text-purple-700">
                  {effect}
                  <button onClick={() => removeItem('effect', i)} className="ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Flavors */}
          <div>
            <Label>Flavors</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add flavor..."
                value={newFlavor}
                onChange={(e) => setNewFlavor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem('flavor')}
              />
              <Button onClick={() => addItem('flavor')} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.flavors?.map((flavor, i) => (
                <Badge key={i} variant="outline" className="border-amber-300 text-amber-700">
                  {flavor}
                  <button onClick={() => removeItem('flavor', i)} className="ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Medical Uses */}
          <div>
            <Label>Medical Uses</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add medical use..."
                value={newMedicalUse}
                onChange={(e) => setNewMedicalUse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem('medical')}
              />
              <Button onClick={() => addItem('medical')} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.medical_uses?.map((use, i) => (
                <Badge key={i} variant="outline" className="border-green-300 text-green-700">
                  {use}
                  <button onClick={() => removeItem('medical', i)} className="ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Growing Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Genetics</Label>
              <Input
                value={formData.genetics || ''}
                onChange={(e) => setFormData({ ...formData, genetics: e.target.value })}
                placeholder="Parent strains..."
              />
            </div>
            <div>
              <Label>Flowering Time</Label>
              <Input
                value={formData.flowering_time || ''}
                onChange={(e) => setFormData({ ...formData, flowering_time: e.target.value })}
                placeholder="e.g., 8-9 weeks"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Growing Difficulty</Label>
              <Select
                value={formData.growing_difficulty}
                onValueChange={(val) => setFormData({ ...formData, growing_difficulty: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="difficult">Difficult</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={formData.popular || false}
                onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                className="w-4 h-4"
              />
              <Label>Mark as Popular</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}