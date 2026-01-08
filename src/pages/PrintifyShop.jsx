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
  'merch': ShoppingBag,
  'supplies': Package,
  'accessories': Pill,
  'flower': Sparkles,
  'pre-rolls': Sparkles,
  'edibles': Sparkles,
  'concentrates': Sparkles,
  'vapes': Sparkles,
  'tinctures': Sparkles,
  'topicals': Sparkles
};

export default function PrintifyShop() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
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

  const { data: shopProducts = [] } = useQuery({
    queryKey: ['shop-products'],
    queryFn: () => base44.entities.Product.list()
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Product.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shop-products']);
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      toast.success('Product updated successfully');
    }
  });

  const deleteShopProductMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.Product.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shop-products']);
      toast.success('Product deleted from shop');
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

  const categories = [
    'flower', 'pre-rolls', 'edibles', 'concentrates', 'vapes', 
    'tinctures', 'topicals', 'accessories', 'merch', 'supplies'
  ];

  const getProductCategory = (product) => {
    const tags = product.tags || [];
    const title = product.title?.toLowerCase() || '';
    
    if (tags.includes('flower') || title.includes('flower') || title.includes('bud')) {
      return 'flower';
    }
    if (tags.includes('pre-roll') || title.includes('pre-roll') || title.includes('joint')) {
      return 'pre-rolls';
    }
    if (tags.includes('edible') || title.includes('edible') || title.includes('gummy') || title.includes('chocolate')) {
      return 'edibles';
    }
    if (tags.includes('concentrate') || title.includes('concentrate') || title.includes('wax') || title.includes('shatter')) {
      return 'concentrates';
    }
    if (tags.includes('vape') || title.includes('vape') || title.includes('cartridge') || title.includes('pen')) {
      return 'vapes';
    }
    if (tags.includes('tincture') || title.includes('tincture') || title.includes('oil') || title.includes('drops')) {
      return 'tinctures';
    }
    if (tags.includes('topical') || title.includes('topical') || title.includes('cream') || title.includes('lotion')) {
      return 'topicals';
    }
    if (tags.includes('supplements') || title.includes('supplement') || title.includes('vitamin')) {
      return 'accessories';
    }
    if (tags.includes('supplies') || title.includes('supplies') || title.includes('packaging') || title.includes('bag')) {
      return 'supplies';
    }
    if (tags.includes('merch') || title.includes('shirt') || title.includes('hoodie') || title.includes('mug') || title.includes('hat')) {
      return 'merch';
    }
    return 'merch';
  };

  const filteredProducts = products?.filter(product => {
    const matchesCategory = selectedCategory === 'all' || getProductCategory(product) === selectedCategory;
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
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Printify Shop</h1>
              <p className="text-gray-600">Manage your print-on-demand products</p>
            </div>
            <Button
              onClick={() => refetchProducts()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

        {/* Categories Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="w-full flex-wrap h-auto gap-2 bg-white/60 p-2">
            <TabsTrigger value="all" className="flex-shrink-0">
              All ({products?.length || 0})
            </TabsTrigger>
            {categories.map(category => {
              const Icon = categoryIcons[category] || Sparkles;
              const count = groupedProducts[category]?.length || 0;
              return (
                <TabsTrigger key={category} value={category} className="flex-shrink-0">
                  <Icon className="w-4 h-4 mr-1" />
                  {category.replace('-', ' ')} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

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
                          if (confirm('Delete this product from Printify?')) {
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
                  
                  {/* Show if product is synced to shop */}
                  {shopProducts.find(p => p.printify_product_id === product.id.toString()) && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        ✓ In Shop
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const shopProduct = shopProducts.find(p => p.printify_product_id === product.id.toString());
                          setEditingProduct(shopProduct);
                          setIsEditDialogOpen(true);
                        }}
                        className="h-6 text-xs"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit Shop Product
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const shopProduct = shopProducts.find(p => p.printify_product_id === product.id.toString());
                          if (confirm('Delete this product from shop?')) {
                            deleteShopProductMutation.mutate(shopProduct.id);
                          }
                        }}
                        className="h-6 text-xs text-red-500"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove from Shop
                      </Button>
                    </div>
                  )}
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

      {/* Edit Shop Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shop Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={editingProduct.category}
                  onValueChange={(v) => setEditingProduct({...editingProduct, category: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingProduct.price || 0}
                  onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  value={editingProduct.stock_quantity || 0}
                  onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProduct.published || false}
                  onChange={(e) => setEditingProduct({...editingProduct, published: e.target.checked})}
                  id="published"
                />
                <Label htmlFor="published">Published in Shop</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProduct.in_stock || false}
                  onChange={(e) => setEditingProduct({...editingProduct, in_stock: e.target.checked})}
                  id="in_stock"
                />
                <Label htmlFor="in_stock">In Stock</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateProductMutation.mutate({
                      id: editingProduct.id,
                      data: {
                        name: editingProduct.name,
                        description: editingProduct.description,
                        category: editingProduct.category,
                        price: editingProduct.price,
                        stock_quantity: editingProduct.stock_quantity,
                        published: editingProduct.published,
                        in_stock: editingProduct.in_stock
                      }
                    });
                  }}
                  disabled={updateProductMutation.isPending}
                  className="flex-1 bg-emerald-600"
                >
                  {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}