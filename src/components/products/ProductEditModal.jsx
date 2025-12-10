import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Search, Sparkles, Loader2, X, Leaf } from 'lucide-react';

export default function ProductEditModal({ isOpen, onClose, product }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'flower',
    description: '',
    price: '',
    thc_level: '',
    cbd_level: '',
    strain_type: 'hybrid',
    image_url: '',
    weight: '',
    in_stock: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [leaflyQuery, setLeaflyQuery] = useState('');
  const [leaflyResults, setLeaflyResults] = useState([]);
  const [isScrapingLeafly, setIsScrapingLeafly] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || 'flower',
        description: product.description || '',
        price: product.price || '',
        thc_level: product.thc_level || '',
        cbd_level: product.cbd_level || '',
        strain_type: product.strain_type || 'hybrid',
        image_url: product.image_url || '',
        weight: product.weight || '',
        in_stock: product.in_stock !== undefined ? product.in_stock : true
      });
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Product.update(product.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    }
  });



  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await base44.functions.invoke('searchUnsplash', { 
        query: searchQuery 
      });
      setSearchResults(response.data.images || []);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLeaflyScrape = async () => {
    if (!leaflyQuery.trim()) return;
    setIsScrapingLeafly(true);
    try {
      const response = await base44.functions.invoke('scrapeLeafly', { 
        query: leaflyQuery 
      });
      setLeaflyResults(response.data.strains || []);
    } catch (error) {
      console.error('Leafly scrape failed:', error);
      alert('Leafly search failed: ' + error.message);
    } finally {
      setIsScrapingLeafly(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      console.log('Starting AI generation with prompt:', aiPrompt);
      const result = await base44.integrations.Core.GenerateImage({ 
        prompt: `High-quality professional product photo of ${aiPrompt}. Cannabis marijuana strain, macro photography, detailed trichomes, studio lighting, white background, professional product shot` 
      });
      console.log('AI generation result:', result);
      if (result && result.url) {
        setFormData(prev => ({ ...prev, image_url: result.url }));
        alert('Image generated successfully!');
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('AI generation failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: result.file_url }));
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      price: parseFloat(formData.price) || 0,
      thc_level: parseFloat(formData.thc_level) || 0,
      cbd_level: parseFloat(formData.cbd_level) || 0
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-900">
            Edit Product
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Product Image */}
          <div>
            <Label className="text-emerald-900 font-semibold mb-2 block">
              Product Image
            </Label>
            
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload"><Upload className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="search"><Search className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="leafly"><Leaf className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="ai"><Sparkles className="w-4 h-4" /></TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-3">
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="border-emerald-200"
                />
              </TabsContent>

              <TabsContent value="upload" className="space-y-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="border-emerald-200"
                />
              </TabsContent>

              <TabsContent value="search" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Unsplash..."
                    className="border-emerald-200"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-emerald-600"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {searchResults.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setFormData(prev => ({ ...prev, image_url: img.url }))}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-400 transition-colors bg-emerald-50"
                      >
                        <img 
                          src={img.thumb || img.url} 
                          alt={img.alt} 
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="leafly" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={leaflyQuery}
                    onChange={(e) => setLeaflyQuery(e.target.value)}
                    placeholder="Search Leafly strains..."
                    className="border-emerald-200"
                    onKeyDown={(e) => e.key === 'Enter' && handleLeaflyScrape()}
                  />
                  <Button 
                    onClick={handleLeaflyScrape}
                    disabled={isScrapingLeafly}
                    className="bg-emerald-600"
                  >
                    {isScrapingLeafly ? <Loader2 className="w-4 h-4 animate-spin" /> : <Leaf className="w-4 h-4" />}
                  </Button>
                </div>
                {leaflyResults.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {leaflyResults.map((strain, idx) => (
                      <button
                        key={idx}
                        onClick={() => setFormData(prev => ({ ...prev, image_url: strain.image_url }))}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-400 transition-colors bg-emerald-50"
                      >
                        <img 
                          src={strain.image_url} 
                          alt={strain.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                          {strain.name}
                        </div>
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
                    placeholder="Describe the product image..."
                    className="border-emerald-200"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                  />
                  <Button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </Button>
                </div>
                {isGenerating && (
                  <div className="text-sm text-purple-600 text-center">
                    Generating image... This may take 5-10 seconds
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {formData.image_url && (
              <div className="mt-3 rounded-lg overflow-hidden border border-emerald-200 bg-emerald-50">
                <img 
                  key={formData.image_url}
                  src={formData.image_url} 
                  alt="Preview" 
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', formData.image_url);
                    e.target.src = 'https://via.placeholder.com/400x160?text=Image+Load+Failed';
                  }}
                />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flower">Flower</SelectItem>
                  <SelectItem value="pre-rolls">Pre-Rolls</SelectItem>
                  <SelectItem value="edibles">Edibles</SelectItem>
                  <SelectItem value="concentrates">Concentrates</SelectItem>
                  <SelectItem value="vapes">Vapes</SelectItem>
                  <SelectItem value="tinctures">Tinctures</SelectItem>
                  <SelectItem value="topicals">Topicals</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="border-emerald-200 h-24"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Price ($)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>THC %</Label>
              <Input
                type="number"
                value={formData.thc_level}
                onChange={(e) => setFormData(prev => ({ ...prev, thc_level: e.target.value }))}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>CBD %</Label>
              <Input
                type="number"
                value={formData.cbd_level}
                onChange={(e) => setFormData(prev => ({ ...prev, cbd_level: e.target.value }))}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>Weight</Label>
              <Input
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="3.5g"
                className="border-emerald-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Strain Type</Label>
              <Select value={formData.strain_type} onValueChange={(value) => setFormData(prev => ({ ...prev, strain_type: value }))}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indica">Indica</SelectItem>
                  <SelectItem value="sativa">Sativa</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="cbd">CBD</SelectItem>
                  <SelectItem value="n/a">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  checked={formData.in_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, in_stock: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm text-emerald-900">In Stock</span>
              </label>
            </div>
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