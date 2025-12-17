import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Upload, Search, Sparkles, Loader2, X, Leaf, Plus, Trash2, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'sonner';

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
    in_stock: true,
    variants: []
  });
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState([]);
  const [isUnsplashSearching, setIsUnsplashSearching] = useState(false);
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleResults, setGoogleResults] = useState([]);
  const [isGoogleSearching, setIsGoogleSearching] = useState(false);
  const [leaflyQuery, setLeaflyQuery] = useState('');
  const [leaflyResults, setLeaflyResults] = useState([]);
  const [isScrapingLeafly, setIsScrapingLeafly] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStrainId, setSelectedStrainId] = useState(null);
  const [inventoryEnabled, setInventoryEnabled] = useState(false);
  const queryClient = useQueryClient();

  const { data: strains = [] } = useQuery({
    queryKey: ['strains'],
    queryFn: () => base44.entities.Strain.list()
  });

  useEffect(() => {
    if (product) {
      const hasInventory = product.sku || product.stock_quantity > 0;
      setInventoryEnabled(hasInventory);
      setFormData({
        name: product.name || '',
        category: product.category || 'flower',
        description: product.description || '',
        price: product.price || '',
        thc_level: product.thc_level || '',
        cbd_level: product.cbd_level || '',
        strain_type: product.strain_type || 'hybrid',
        image_url: product.image_url || '',
        weight: product.weight || '3.5g',
        in_stock: product.in_stock !== undefined ? product.in_stock : true,
        published: product.published !== undefined ? product.published : true,
        variants: product.variants || [],
        stock_quantity: product.stock_quantity || 0,
        low_stock_threshold: product.low_stock_threshold || 10,
        sku: product.sku || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'flower',
        description: '',
        price: '',
        thc_level: '',
        cbd_level: '',
        strain_type: 'hybrid',
        image_url: '',
        weight: '3.5g',
        in_stock: true,
        published: true,
        variants: [],
        stock_quantity: 0,
        low_stock_threshold: 10,
        sku: ''
      });
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (product) {
        return await base44.entities.Product.update(product.id, data);
      } else {
        return await base44.entities.Product.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
      toast.success(product ? 'Product updated!' : 'Product created!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Product.delete(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete product');
      console.error(error);
    }
  });



  const handleUnsplashSearch = async () => {
    if (!unsplashQuery.trim()) return;
    setIsUnsplashSearching(true);
    try {
      const response = await base44.functions.invoke('searchUnsplash', { 
        query: unsplashQuery 
      });
      setUnsplashResults(response.data.images || []);
    } catch (error) {
      console.error('Unsplash search failed:', error);
      toast.error('Unsplash search failed: ' + error.message);
    } finally {
      setIsUnsplashSearching(false);
    }
  };

  const handleGoogleSearch = async () => {
    if (!googleQuery.trim()) return;
    setIsGoogleSearching(true);
    try {
      const response = await base44.functions.invoke('searchGoogleImages', { 
        query: googleQuery 
      });
      setGoogleResults(response.data.results || []);
      if (response.data.results?.length > 0) {
        toast.success(`Found ${response.data.results.length} images`);
      } else {
        toast.info('No images found');
      }
    } catch (error) {
      console.error('Google search failed:', error);
      toast.error('Google search failed: ' + error.message);
    } finally {
      setIsGoogleSearching(false);
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
        toast.success('Image generated successfully!');
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      toast.error('AI generation failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateImage = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({ 
        prompt: `High-quality professional product photo of ${formData.name}. Cannabis marijuana strain, macro photography, detailed trichomes, studio lighting, white background, professional product shot` 
      });
      if (result && result.url) {
        setFormData(prev => ({ ...prev, image_url: result.url }));
        toast.success('Image regenerated successfully!');
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
      toast.error('Failed to regenerate image');
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

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), { name: '', price: '' }]
    }));
  };

  const handleRemoveVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => 
        i === index ? { ...v, [field]: value } : v
      )
    }));
  };

  const handleStrainSelect = (strainId) => {
    const strain = strains.find(s => s.id === strainId);
    if (!strain) return;

    setSelectedStrainId(strainId);
    setFormData({
      name: strain.name,
      category: 'flower',
      description: strain.description || '',
      price: '',
      thc_level: strain.thc_min ? ((strain.thc_min + (strain.thc_max || strain.thc_min)) / 2).toFixed(1) : '',
      cbd_level: strain.cbd_min ? ((strain.cbd_min + (strain.cbd_max || strain.cbd_min)) / 2).toFixed(1) : '',
      strain_type: strain.type || 'hybrid',
      image_url: strain.image_url || '',
      weight: '3.5g',
      in_stock: true,
      published: true,
      variants: [],
      stock_quantity: 0,
      low_stock_threshold: 10,
      sku: ''
    });
    toast.success(`Pre-filled with ${strain.name} strain data`);
  };

  const handleSave = () => {
    // Validate required fields
    const errors = [];
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push('Price is required and must be greater than 0');
    }

    if (errors.length > 0) {
      toast.error(
        <div>
          <div className="font-bold mb-1">Cannot save product:</div>
          {errors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </div>,
        { duration: 5000 }
      );
      return;
    }

    const variants = formData.variants?.map(v => ({
      name: v.name,
      price: parseFloat(v.price) || 0,
      stock_quantity: parseInt(v.stock_quantity) || 0
    })).filter(v => v.name && v.price > 0);

    const saveData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      thc_level: parseFloat(formData.thc_level) || 0,
      cbd_level: parseFloat(formData.cbd_level) || 0,
      variants: variants || []
    };

    // Only include inventory fields if inventory is enabled
    if (inventoryEnabled) {
      saveData.stock_quantity = parseInt(formData.stock_quantity) || 0;
      saveData.low_stock_threshold = parseInt(formData.low_stock_threshold) || 10;
      saveData.sku = formData.sku || '';
    }

    saveMutation.mutate(saveData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-900">
            {product ? 'Edit Product' : 'Create New Product'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Strain Library Selector */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
            <Label className="text-emerald-900 font-semibold mb-2 block flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              Pre-fill from Strain Library
            </Label>
            <div className="flex gap-2">
              <Select value={selectedStrainId || ''} onValueChange={handleStrainSelect}>
                <SelectTrigger className="flex-1 bg-white">
                  <SelectValue placeholder="Select a strain to pre-fill data..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {strains.map(strain => (
                    <SelectItem key={strain.id} value={strain.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{strain.name}</span>
                        <span className="text-xs text-gray-500">
                          {strain.type && `(${strain.type})`}
                          {strain.thc_min && ` • THC: ${strain.thc_min}-${strain.thc_max || strain.thc_min}%`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStrainId && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSelectedStrainId(null);
                    toast.info('Strain selection cleared');
                  }}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {selectedStrainId && (
              <p className="text-xs text-emerald-600 mt-2">
                ✓ Strain data pre-filled. You can still edit any field below.
              </p>
            )}
          </div>

          {/* Product Image */}
          <div>
            <Label className="text-emerald-900 font-semibold mb-2 block">
              Product Image
            </Label>
            
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload"><Upload className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="unsplash">Unsplash</TabsTrigger>
                <TabsTrigger value="google">Google</TabsTrigger>
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
                    disabled={isUnsplashSearching}
                    className="bg-emerald-600"
                  >
                    {isUnsplashSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {unsplashResults.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {unsplashResults.map((img, idx) => (
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

              <TabsContent value="google" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={googleQuery}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    placeholder="Search Google Images..."
                    className="border-emerald-200"
                    onKeyDown={(e) => e.key === 'Enter' && handleGoogleSearch()}
                  />
                  <Button 
                    onClick={handleGoogleSearch}
                    disabled={isGoogleSearching}
                    className="bg-emerald-600"
                  >
                    {isGoogleSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {googleResults.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {googleResults.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square">
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover rounded-lg cursor-pointer hover:ring-2 ring-emerald-500 transition-all"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: img }))}
                        />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(img);
                            toast.success('URL copied');
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
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
              <div className="mt-3 rounded-lg overflow-hidden border border-emerald-200 bg-emerald-50 relative group">
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
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  onClick={handleRegenerateImage}
                  disabled={isGenerating}
                  title="Regenerate image with AI"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
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
              <Label>Price ($) *</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                onFocus={(e) => e.target.select()}
                className="border-emerald-200"
                placeholder="Required"
              />
            </div>
            <div>
              <Label>THC %</Label>
              <Input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={formData.thc_level}
                onChange={(e) => setFormData(prev => ({ ...prev, thc_level: e.target.value }))}
                onFocus={(e) => e.target.select()}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>CBD %</Label>
              <Input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={formData.cbd_level}
                onChange={(e) => setFormData(prev => ({ ...prev, cbd_level: e.target.value }))}
                onFocus={(e) => e.target.select()}
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

          {/* Publishing Status */}
          <div className="border-t border-emerald-100 pt-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div>
                <Label className="text-emerald-900 font-semibold">Product Visibility</Label>
                <p className="text-xs text-emerald-600 mt-1">
                  {formData.published ? 'Visible to customers' : 'Hidden from customers'}
                </p>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-sm text-emerald-900">Published</span>
              </label>
            </div>
          </div>

          {/* Deal Settings */}
          <div className="border-t border-emerald-100 pt-4">
            <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-orange-900 font-semibold">Deal Badge</Label>
                  <p className="text-xs text-orange-600 mt-1">
                    Mark this product as a special deal
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_deal || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_deal: e.target.checked }))}
                    className="w-4 h-4 accent-orange-600"
                  />
                  <span className="text-sm text-orange-900">Enable Deal</span>
                </label>
              </div>

              {formData.is_deal && (
                <div>
                  <Label className="text-sm mb-2 block">Deal Type</Label>
                  <Select 
                    value={formData.deal_type || 'weekly'} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, deal_type: val }))}
                  >
                    <SelectTrigger className="bg-white border-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">🔥 Weekly Deal</SelectItem>
                      <SelectItem value="smoking">💨 Smoking Deal</SelectItem>
                      <SelectItem value="clearance">🏷️ Clearance</SelectItem>
                      <SelectItem value="christmas">🎄 Christmas Deal</SelectItem>
                      <SelectItem value="halloween">🎃 Halloween Deal</SelectItem>
                      <SelectItem value="valentines">💝 Valentine's Deal</SelectItem>
                      <SelectItem value="july4th">🎆 July 4th Deal</SelectItem>
                      <SelectItem value="thanksgiving">🦃 Thanksgiving Deal</SelectItem>
                      <SelectItem value="newyear">🎊 New Year Deal</SelectItem>
                      <SelectItem value="stpatricks">🍀 St. Patrick's Deal</SelectItem>
                      <SelectItem value="easter">🐰 Easter Deal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Inventory Management */}
          <div className="border-t border-emerald-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-emerald-900 font-semibold">Inventory Management</Label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={inventoryEnabled}
                  onChange={(e) => setInventoryEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-sm text-emerald-900">Enable Inventory Tracking</span>
              </label>
            </div>
            
            {inventoryEnabled ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">SKU</Label>
                  <Input
                    value={formData.sku || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Product SKU"
                    className="border-emerald-200"
                  />
                </div>
                <div>
                  <Label className="text-sm">Stock Quantity</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={formData.stock_quantity || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    onFocus={(e) => e.target.select()}
                    className="border-emerald-200"
                  />
                </div>
                <div>
                  <Label className="text-sm">Low Stock Threshold</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={formData.low_stock_threshold || 10}
                    onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 10 }))}
                    onFocus={(e) => e.target.select()}
                    className="border-emerald-200"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-emerald-600">Inventory tracking is disabled for this product.</p>
            )}
          </div>

          {/* Variants */}
          <div className="border-t border-emerald-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-emerald-900 font-semibold">Variants (Optional)</Label>
              <Button
                type="button"
                size="sm"
                onClick={handleAddVariant}
                className="bg-emerald-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Variant
              </Button>
            </div>
            
            {formData.variants?.length > 0 && (
              <div className="space-y-2">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="flex gap-2 items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Input
                      placeholder="Name (e.g., Eighth, Quarter)"
                      value={variant.name}
                      onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                      className="flex-1 border-emerald-200 bg-white"
                    />
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={variant.price === 0 || variant.price === '' ? '' : variant.price}
                      onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-24 border-emerald-200 bg-white"
                    />
                    <Input
                      type="number"
                      placeholder="Stock"
                      value={variant.stock_quantity || 0}
                      onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)}
                      className="w-24 border-emerald-200 bg-white"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveVariant(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {formData.variants?.length === 0 && (
              <p className="text-sm text-emerald-600">No variants added. Base price will be used.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4 border-t border-emerald-100">
            {product && (
              <Button 
                variant="destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this product?')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Product
                  </>
                )}
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-green-500 text-white"
              >
                {saveMutation.isPending ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}