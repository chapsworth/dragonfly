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
import { Loader2, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';

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
      return response.data.variants;
    },
    enabled: !!productData.selectedProvider
  });

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
      print_areas: productData.designImage ? [
        {
          variant_ids: productData.selectedVariants.map(v => v.id),
          placeholders: [
            {
              position: 'front',
              images: [
                {
                  id: productData.designImage,
                  x: 0.5,
                  y: 0.5,
                  scale: 1,
                  angle: 0
                }
              ]
            }
          ]
        }
      ] : []
    };

    if (productData.tags.length > 0) {
      printifyProductData.tags = productData.tags;
    }

    createProductMutation.mutate(printifyProductData);
  };

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <div className="space-y-4">
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
      </div>

      {/* Design Upload */}
      <div>
        <Label>Upload Design (optional)</Label>
        <div className="mt-2">
          {productData.designImage ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
              <Check className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-emerald-700">Design uploaded</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProductData({ ...productData, designImage: null })}
              >
                Remove
              </Button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingDesign}
              />
              {uploadingDesign ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              <span className="text-sm text-gray-600">
                {uploadingDesign ? 'Uploading...' : 'Click to upload design image'}
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Print Provider Selection */}
      <div>
        <Label>Select Print Provider *</Label>
        {providersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
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
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm">{provider.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{provider.location?.country || 'International'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Variant Selection */}
      {productData.selectedProvider && (
        <div>
          <Label>Select Variants & Set Prices *</Label>
          {variantsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
              {variants?.map(variant => {
                const isSelected = productData.selectedVariants.some(v => v.id === variant.id);
                const selectedVariant = productData.selectedVariants.find(v => v.id === variant.id);
                
                return (
                  <div
                    key={variant.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg ${
                      isSelected ? 'bg-emerald-50 border-emerald-500' : 'hover:bg-gray-50'
                    }`}
                  >
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
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{variant.title}</p>
                      <p className="text-xs text-gray-500">Cost: ${(variant.cost / 100).toFixed(2)}</p>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Price:</Label>
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
                          className="w-20 h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
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
    </div>
  );
}