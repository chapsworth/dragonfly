import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Search, Sparkles, Loader2, Plus, Trash2, Leaf, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function AddProductToCarousel({ isOpen, onClose, category }) {
  const [mode, setMode] = useState('select'); // 'select', 'create', or 'manage'
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: category,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [leaflyQuery, setLeaflyQuery] = useState('');
  const [leaflyResults, setLeaflyResults] = useState([]);
  const [isScrapingLeafly, setIsScrapingLeafly] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: carouselSettings = [] } = useQuery({
    queryKey: ['carouselSettings'],
    queryFn: () => base44.entities.CarouselSettings.list()
  });

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Product.create(data);
    },
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      updateCarouselSetting(newProduct.id);
    }
  });

  const updateCarouselMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.CarouselSettings.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carouselSettings'] });
      onClose();
    }
  });

  const createCarouselMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.CarouselSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carouselSettings'] });
      onClose();
    }
  });

  const updateCarouselSetting = (productId) => {
    const existingSetting = carouselSettings.find(c => c.category === category);
    const featuredIds = existingSetting?.featured_product_ids || [];
    
    if (!featuredIds.includes(productId)) {
      featuredIds.push(productId);
    }

    if (existingSetting) {
      updateCarouselMutation.mutate({
        id: existingSetting.id,
        data: { featured_product_ids: featuredIds }
      });
    } else {
      createCarouselMutation.mutate({
        category: category,
        display_order: carouselSettings.length,
        is_active: true,
        featured_product_ids: featuredIds
      });
    }
  };

  const handleSelectProducts = () => {
    if (selectedProducts.length > 0) {
      const existingSetting = carouselSettings.find(c => c.category === category);
      const featuredIds = existingSetting?.featured_product_ids || [];
      
      // Add all selected products that aren't already in the carousel
      const newIds = [...featuredIds];
      selectedProducts.forEach(id => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });

      if (existingSetting) {
        updateCarouselMutation.mutate({
          id: existingSetting.id,
          data: { featured_product_ids: newIds }
        });
      } else {
        createCarouselMutation.mutate({
          category: category,
          display_order: carouselSettings.length,
          is_active: true,
          featured_product_ids: newIds
        });
      }
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleCreateProduct = () => {
    const variants = formData.variants?.map(v => ({
      name: v.name,
      price: parseFloat(v.price) || 0
    })).filter(v => v.name && v.price > 0);

    createProductMutation.mutate({
      ...formData,
      price: parseFloat(formData.price) || 0,
      thc_level: parseFloat(formData.thc_level) || 0,
      cbd_level: parseFloat(formData.cbd_level) || 0,
      variants: variants || []
    });
  };

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
    } finally {
      setIsScrapingLeafly(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({ 
        prompt: `High-quality professional product photo of ${aiPrompt}. Cannabis marijuana strain, macro photography, detailed trichomes, studio lighting, white background, professional product shot` 
      });
      if (result && result.url) {
        setFormData(prev => ({ ...prev, image_url: result.url }));
      }
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

  const categoryProducts = products.filter(p => p.category === category);
  const existingSetting = carouselSettings.find(c => c.category === category);
  const featuredIds = existingSetting?.featured_product_ids || [];
  
  const featuredProducts = featuredIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean);

  const handleReorder = (result) => {
    if (!result.destination || !existingSetting) return;
    
    const items = Array.from(featuredIds);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    updateCarouselMutation.mutate({
      id: existingSetting.id,
      data: { featured_product_ids: items }
    });
  };

  const handleRemoveFromCarousel = (productId) => {
    if (!existingSetting) return;
    
    const newIds = featuredIds.filter(id => id !== productId);
    updateCarouselMutation.mutate({
      id: existingSetting.id,
      data: { featured_product_ids: newIds }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-900">
            Add Product to {category.charAt(0).toUpperCase() + category.slice(1)} Carousel
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={setMode} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select">Add Items</TabsTrigger>
            <TabsTrigger value="manage">Manage Carousel</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-4 mt-4">
            {featuredProducts.length === 0 ? (
              <div className="text-center py-12 text-emerald-600">
                <p className="text-lg mb-2">No items in carousel yet</p>
                <p className="text-sm text-gray-500">Switch to "Add Items" tab to add products</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-900 font-semibold">💡 Drag & Drop to Reorder</p>
                  <p className="text-xs text-blue-700">Drag items to change their order in the carousel</p>
                </div>
                
                <DragDropContext onDragEnd={handleReorder}>
                  <Droppable droppableId="carousel-items">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {featuredProducts.map((product, index) => (
                          <Draggable
                            key={product.id}
                            draggableId={product.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-3 bg-white rounded-lg border-2 transition-all ${
                                  snapshot.isDragging
                                    ? 'border-emerald-500 shadow-lg'
                                    : 'border-emerald-200'
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-5 h-5 text-gray-400" />
                                </div>
                                
                                <div className="flex items-center gap-3 flex-1">
                                  <img
                                    src={product.image_url || 'https://via.placeholder.com/150'}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                  <div className="flex-1">
                                    <p className="font-semibold text-emerald-900">{product.name}</p>
                                    <p className="text-sm text-emerald-600">${product.price}</p>
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                    #{index + 1}
                                  </div>
                                </div>
                                
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveFromCarousel(product.id)}
                                  className="text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                
                <div className="pt-4 border-t flex justify-between items-center">
                  <p className="text-sm text-emerald-600">
                    {featuredProducts.length} item{featuredProducts.length !== 1 ? 's' : ''} in carousel
                  </p>
                  <Button variant="outline" onClick={onClose}>Done</Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="select" className="space-y-4 mt-4">
            {categoryProducts.length === 0 ? (
              <div className="text-center py-8 text-emerald-600">
                No products in this category. Create a new one instead.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {categoryProducts.map(product => {
                    const isInCarousel = featuredIds.includes(product.id);
                    const isSelected = selectedProducts.includes(product.id);
                    
                    return (
                      <button
                        key={product.id}
                        onClick={() => toggleProductSelection(product.id)}
                        className={`relative p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-emerald-200 hover:border-emerald-300'
                        }`}
                      >
                        {isInCarousel && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-semibold">
                            In Carousel
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 left-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                        )}
                        <img
                          src={product.image_url || 'https://via.placeholder.com/150'}
                          alt={product.name}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                        <p className="text-sm font-semibold text-emerald-900 truncate">{product.name}</p>
                        <p className="text-xs text-emerald-600">${product.price}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-emerald-600">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                      onClick={handleSelectProducts}
                      disabled={selectedProducts.length === 0 || updateCarouselMutation.isPending || createCarouselMutation.isPending}
                      className="bg-emerald-600"
                    >
                      Add {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''} to Carousel
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-4">
            {/* Product Image */}
            <div>
              <Label className="text-emerald-900 font-semibold mb-2 block">Product Image</Label>
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
                    <Button onClick={handleSearch} disabled={isSearching} className="bg-emerald-600">
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                      {searchResults.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFormData(prev => ({ ...prev, image_url: img.url }))}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-400 transition-colors"
                        >
                          <img src={img.thumb || img.url} alt={img.alt} className="w-full h-full object-cover" />
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
                    <Button onClick={handleLeaflyScrape} disabled={isScrapingLeafly} className="bg-emerald-600">
                      {isScrapingLeafly ? <Loader2 className="w-4 h-4 animate-spin" /> : <Leaf className="w-4 h-4" />}
                    </Button>
                  </div>
                  {leaflyResults.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                      {leaflyResults.map((strain, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFormData(prev => ({ ...prev, image_url: strain.image_url }))}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-400 transition-colors"
                        >
                          <img src={strain.image_url} alt={strain.name} className="w-full h-full object-cover" />
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
                    <Button onClick={handleGenerateAI} disabled={isGenerating} className="bg-gradient-to-r from-purple-500 to-pink-500">
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {formData.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden border border-emerald-200">
                  <img src={formData.image_url} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              )}
            </div>

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
                <Input value={category} disabled className="border-emerald-200 bg-gray-50" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="border-emerald-200 h-20"
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

            <div className="border-t border-emerald-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-emerald-900 font-semibold">Variants (Optional)</Label>
                <Button type="button" size="sm" onClick={handleAddVariant} className="bg-emerald-600">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Variant
                </Button>
              </div>
              
              {formData.variants?.length > 0 && (
                <div className="space-y-2">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="flex gap-2 items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <Input
                        placeholder="Name (e.g., Eighth)"
                        value={variant.name}
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        className="flex-1 border-emerald-200 bg-white"
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        className="w-28 border-emerald-200 bg-white"
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
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleCreateProduct}
                disabled={createProductMutation.isPending || !formData.name || !formData.price}
                className="bg-gradient-to-r from-emerald-500 to-green-500"
              >
                {createProductMutation.isPending ? 'Creating...' : 'Create & Add to Carousel'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}