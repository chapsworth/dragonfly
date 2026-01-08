import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, ShoppingBag, Pill, Sparkles, Plus, Edit2, Trash2, 
  ExternalLink, Loader2, Search, RefreshCw, Eye
} from 'lucide-react';
import { toast } from 'sonner';

const categoryIcons = {
  'Merch': ShoppingBag,
  'Shop Supplies': Package,
  'Health Supplements': Pill,
  'More': Sparkles
};

export default function PrintifyShop() {
  const [selectedCategory, setSelectedCategory] = useState('Merch');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ['printify-shops'],
    queryFn: async () => {
      const response = await base44.functions.invoke('printify', { action: 'getShops' });
      return response.data;
    }
  });

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['printify-products', selectedShop?.id],
    queryFn: async () => {
      if (!selectedShop) return [];
      const response = await base44.functions.invoke('printify', {
        action: 'getProducts',
        shopId: selectedShop.id
      });
      return response.data.data || [];
    },
    enabled: !!selectedShop
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      const response = await base44.functions.invoke('printify', {
        action: 'deleteProduct',
        shopId: selectedShop.id,
        productId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['printify-products']);
      toast.success('Product deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete product');
      console.error(error);
    }
  });

  const publishProductMutation = useMutation({
    mutationFn: async (productId) => {
      const response = await base44.functions.invoke('printify', {
        action: 'publishProduct',
        shopId: selectedShop.id,
        productId
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Product published');
      queryClient.invalidateQueries(['printify-products']);
    },
    onError: (error) => {
      toast.error('Failed to publish product');
      console.error(error);
    }
  });

  const syncProductsMutation = useMutation({
    mutationFn: async ({ shopId, productIds, newOnly }) => {
      const response = await base44.functions.invoke('syncPrintifyProducts', {
        shopId,
        productIds,
        newOnly
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} products to shop`);
      if (data.errors > 0) {
        toast.error(`${data.errors} products failed to sync`);
      }
      queryClient.invalidateQueries(['shop-products']);
    },
    onError: (error) => {
      toast.error('Failed to sync products');
      console.error(error);
    }
  });

  React.useEffect(() => {
    if (shops && shops.length > 0 && !selectedShop) {
      setSelectedShop(shops[0]);
    }
  }, [shops, selectedShop]);

  const categories = ['Merch', 'Shop Supplies', 'Health Supplements', 'More'];

  const getProductCategory = (product) => {
    const tags = product.tags || [];
    const title = product.title?.toLowerCase() || '';
    
    if (tags.includes('supplements') || title.includes('supplement') || title.includes('vitamin')) {
      return 'Health Supplements';
    }
    if (tags.includes('supplies') || title.includes('supplies') || title.includes('packaging')) {
      return 'Shop Supplies';
    }
    if (tags.includes('merch') || title.includes('shirt') || title.includes('hoodie') || title.includes('mug')) {
      return 'Merch';
    }
    return 'More';
  };

  const filteredProducts = products?.filter(product => {
    const matchesCategory = selectedCategory === 'All' || getProductCategory(product) === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const groupedProducts = categories.reduce((acc, cat) => {
    acc[cat] = products?.filter(p => getProductCategory(p) === cat) || [];
    return acc;
  }, {});

  if (shopsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Printify Shop</h1>
              <p className="text-gray-600">Manage your print-on-demand products</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => refetchProducts()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  if (selectedShop && confirm('Sync all Printify products to shop? This will create/update products in your store.')) {
                    syncProductsMutation.mutate({ shopId: selectedShop.id, newOnly: false });
                  }
                }}
                disabled={!selectedShop || syncProductsMutation.isPending}
                variant="outline"
                size="sm"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                {syncProductsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync All
              </Button>
              <Button
                onClick={() => {
                  if (selectedShop && confirm('Sync only new Printify products (not already in shop)?')) {
                    syncProductsMutation.mutate({ shopId: selectedShop.id, newOnly: true });
                  }
                }}
                disabled={!selectedShop || syncProductsMutation.isPending}
                size="sm"
                className="bg-emerald-600"
              >
                {syncProductsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Sync New Only
              </Button>
              <Button
                onClick={() => {
                  setSelectedProduct(null);
                  setIsProductDialogOpen(true);
                }}
                className="bg-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Product
              </Button>
            </div>
          </div>

          {/* Shop Selector */}
          {shops && shops.length > 0 && (
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
              <Label>Shop:</Label>
              <Select
                value={selectedShop?.id?.toString()}
                onValueChange={(value) => {
                  const shop = shops.find(s => s.id.toString() === value);
                  setSelectedShop(shop);
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id.toString()}>
                      {shop.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Categories Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {categories.map(category => {
            const Icon = categoryIcons[category];
            const count = groupedProducts[category]?.length || 0;
            return (
              <Card
                key={category}
                className={`cursor-pointer transition-all ${
                  selectedCategory === category
                    ? 'ring-2 ring-emerald-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className="w-6 h-6 text-emerald-600" />
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{category}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square bg-gray-100">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0].src}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <Badge className="absolute top-2 right-2 bg-emerald-600">
                    {getProductCategory(product)}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant={product.is_published ? 'default' : 'secondary'}>
                      {product.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsProductDialogOpen(true);
                        }}
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Sync "${product.title}" to shop?`)) {
                            syncProductsMutation.mutate({ 
                              shopId: selectedShop.id,
                              productIds: [product.id],
                              newOnly: false
                            });
                          }
                        }}
                        disabled={syncProductsMutation.isPending}
                        className="text-emerald-600"
                        title="Sync to shop"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      {!product.is_published && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => publishProductMutation.mutate(product.id)}
                          disabled={publishProductMutation.isPending}
                          title="Publish on Printify"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Delete this product?')) {
                            deleteProductMutation.mutate(product.id);
                          }
                        }}
                        disabled={deleteProductMutation.isPending}
                        className="text-red-500"
                        title="Delete from Printify"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !productsLoading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first product to get started'}
            </p>
            <Button
              onClick={() => setIsProductDialogOpen(true)}
              className="bg-emerald-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        )}
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? selectedProduct.title : 'Product Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedProduct.images?.slice(0, 4).map((img, idx) => (
                  <img
                    key={idx}
                    src={img.src}
                    alt={`${selectedProduct.title} ${idx + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-gray-700 mt-2">{selectedProduct.description}</p>
              </div>
              <div>
                <Label>Variants</Label>
                <div className="space-y-2 mt-2">
                  {selectedProduct.variants?.map((variant, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{variant.title}</span>
                      <Badge>${variant.price / 100}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {selectedProduct.tags?.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}