import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, Check, ZoomIn, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DesignEditor from './DesignEditor';

export default function CreateProductForm({ blueprint, shopId, onSuccess, onCancel }) {
  const [productData, setProductData] = useState({
    title: '',
    description: '',
    tags: [],
    selectedProvider: null,
    selectedVariants: [],
    designImage: null
  });
  const [uploadingDesign, setUploadingDesign] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [mockupPreview, setMockupPreview] = useState(null);
  const [printAreasData, setPrintAreasData] = useState(null);

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['blueprint-providers', blueprint.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('printify', {
        action: 'getBlueprintProviders',
        blueprintId: blueprint.id
      });
      return response.data;
    }
  });

  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ['blueprint-variants', blueprint.id, productData.selectedProvider?.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('printify', {
        action: 'getBlueprintVariants',
        blueprintId: blueprint.id,
        printProviderId: productData.selectedProvider.id
      });
      return response.data;
    },
    enabled: !!productData.selectedProvider
  });

  const printAreas = variants?.print_areas || [];

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('printify', {
        action: 'createProduct',
        shopId,
        productData: data
      });
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast.error('Failed to create product: ' + error.message);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDesign(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProductData({ ...productData, designImage: file_url });
      toast.success('Design uploaded');
    } catch (error) {
      toast.error('Failed to upload design');
    } finally {
      setUploadingDesign(false);
    }
  };

  const handleCreateProduct = () => {
    if (!productData.title) {
      toast.error('Please enter a product title');
      return;
    }
    if (!productData.selectedProvider) {
      toast.error('Please select a print provider');
      return;
    }
    if (productData.selectedVariants.length === 0) {
      toast.error('Please select at least one variant');
      return;
    }

    const printifyProductData = {
      title: productData.title,
      description: productData.description,
      blueprint_id: blueprint.id,
      print_provider_id: productData.selectedProvider.id,
      variants: productData.selectedVariants.map(v => ({
        id: v.id,
        price: Math.round(v.price * 100),
        is_enabled: true
      })),
      print_areas: printAreasData || []
    };

    if (productData.tags.length > 0) {
      printifyProductData.tags = productData.tags;
    }

    createProductMutation.mutate(printifyProductData);
  };

  const blueprintImages = blueprint.images || [];

  return (
    <div className="space-y-4">
      {/* Mobile-Friendly Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
          <TabsTrigger value="design" className="text-xs">Design</TabsTrigger>
          <TabsTrigger value="variants" className="text-xs">Variants</TabsTrigger>
          <TabsTrigger value="editor" className="text-xs">Editor</TabsTrigger>
        </TabsList>

        {/* Product Info Tab */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <div>
            <Label>Product Title *</Label>
            <Input
              value={productData.title}
              onChange={(e) => setProductData({ ...productData, title: e.target.value })}
              placeholder="e.g., Custom Logo T-Shirt"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={productData.description}
              onChange={(e) => setProductData({ ...productData, description: e.target.value })}
              placeholder="Product description..."
              rows={3}
            />
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={productData.tags.join(', ')}
              onChange={(e) => setProductData({ ...productData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="custom, shirt, apparel"
            />
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-4">
          <div className="space-y-4">
            <div>
              <Label>Blueprint Images</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {blueprintImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square cursor-pointer group"
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <img
                      src={img}
                      alt={`${blueprint.title} ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center rounded-lg">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup Preview with Design */}
            {productData.designImage && blueprintImages[0] && (
              <div>
                <Label>Mockup Preview</Label>
                <div className="relative mt-2">
                  <img
                    src={blueprintImages[0]}
                    alt="Mockup"
                    className="w-full rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <img
                      src={productData.designImage}
                      alt="Design"
                      className="max-w-[40%] max-h-[40%] object-contain"
                      style={{ opacity: 0.9 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Design Upload Tab */}
        <TabsContent value="design" className="mt-4">

          <div className="space-y-4">
            <Label>Upload Design</Label>
            {productData.designImage ? (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={productData.designImage}
                    alt="Design"
                    className="w-full rounded-lg border-2 border-emerald-500"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => setProductData({ ...productData, designImage: null })}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-emerald-700">Design uploaded and ready</span>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingDesign}
                />
                {uploadingDesign ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {uploadingDesign ? 'Uploading...' : 'Click to upload design'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                </div>
              </label>
            )}
          </div>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="mt-4">
          <div className="space-y-4">
            {/* Print Provider Selection */}
            <div>
              <Label>Print Provider *</Label>
              {providersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {providers?.map(provider => (
                    <Card
                      key={provider.id}
                      className={`cursor-pointer transition-all ${
                        productData.selectedProvider?.id === provider.id
                          ? 'ring-2 ring-emerald-500 bg-emerald-50'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setProductData({ ...productData, selectedProvider: provider, selectedVariants: [] })}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{provider.title}</h4>
                            <p className="text-xs text-gray-500">{provider.location?.country || 'International'}</p>
                          </div>
                          {productData.selectedProvider?.id === provider.id && (
                            <Check className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Variant Selection */}
            {productData.selectedProvider && (
              <div>
                <Label>Variants & Prices *</Label>
                {variantsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2 mt-2 max-h-80 overflow-y-auto">
                    {variants?.variants?.map(variant => {
                      const isSelected = productData.selectedVariants.some(v => v.id === variant.id);
                      const selectedVariant = productData.selectedVariants.find(v => v.id === variant.id);
                      
                      return (
                        <div
                          key={variant.id}
                          className={`p-3 border rounded-lg ${
                            isSelected ? 'bg-emerald-50 border-emerald-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setProductData({
                                    ...productData,
                                    selectedVariants: [...productData.selectedVariants, { ...variant, price: 25 }]
                                  });
                                } else {
                                  setProductData({
                                    ...productData,
                                    selectedVariants: productData.selectedVariants.filter(v => v.id !== variant.id)
                                  });
                                }
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{variant.title}</p>
                              <p className="text-xs text-gray-500">Cost: ${(variant.cost / 100).toFixed(2)}</p>
                              {isSelected && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Label className="text-xs whitespace-nowrap">Sell Price:</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={selectedVariant?.price || 25}
                                    onChange={(e) => {
                                      const newVariants = productData.selectedVariants.map(v =>
                                        v.id === variant.id ? { ...v, price: parseFloat(e.target.value) } : v
                                      );
                                      setProductData({ ...productData, selectedVariants: newVariants });
                                    }}
                                    className="h-8 text-sm flex-1"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Advanced Design Editor */}
        <TabsContent value="editor" className="mt-4">
          {productData.selectedProvider && variants?.print_areas ? (
            <DesignEditor
              printAreas={variants.print_areas}
              onDesignComplete={(designData) => {
                setPrintAreasData(designData);
                toast.success('Design completed');
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Please select a print provider first</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-white">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateProduct}
          disabled={createProductMutation.isPending}
          className="flex-1 bg-emerald-600"
        >
          {createProductMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Product'
          )}
        </Button>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img
              src={blueprintImages[selectedImageIndex]}
              alt={`Preview ${selectedImageIndex + 1}`}
              className="w-full h-auto"
            />
            <Button
              size="icon"
              variant="secondary"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 p-4">
            {blueprintImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                onClick={() => setSelectedImageIndex(idx)}
                className={`w-full aspect-square object-cover rounded cursor-pointer border-2 ${
                  selectedImageIndex === idx ? 'border-emerald-500' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}