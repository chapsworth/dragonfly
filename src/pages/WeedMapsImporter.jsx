import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Download, Package, Leaf, MapPin, ShoppingCart, Image, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WeedMapsImporter() {
  const [searchType, setSearchType] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [importTarget, setImportTarget] = useState('products');

  const queryClient = useQueryClient();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const response = await base44.functions.invoke('weedmapsSearch', {
        searchType,
        query: searchQuery,
        limit: 50
      });

      if (response.data.success) {
        setSearchResults(response.data.results);
        toast.success(`Found ${response.data.count} results`);
      } else {
        toast.error('Search failed: ' + response.data.error);
      }
    } catch (error) {
      toast.error('Search error: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const importProductsMutation = useMutation({
    mutationFn: async (items) => {
      const products = items.map(item => ({
        name: item.name,
        description: item.description || '',
        price: item.price || 0,
        category: item.category?.toLowerCase() || 'other',
        image_url: item.image || '',
        thc_level: item.thc || 0,
        cbd_level: item.cbd || 0,
        strain_type: item.strain_type || 'n/a',
        in_stock: true,
        published: true
      }));

      for (const product of products) {
        await base44.entities.Product.create(product);
      }
      return products.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Imported ${count} products`);
      setSelectedItems([]);
    }
  });

  const importStrainsMutation = useMutation({
    mutationFn: async (items) => {
      const strains = items.map(item => ({
        name: item.name,
        type: item.type || 'hybrid',
        description: item.description || '',
        thc_min: item.thc_min || 0,
        thc_max: item.thc_max || 0,
        cbd_min: item.cbd_min || 0,
        cbd_max: item.cbd_max || 0,
        effects: item.effects || [],
        flavors: item.flavors || [],
        image_url: item.image || '',
        genetics: item.genetics || '',
        popular: false
      }));

      for (const strain of strains) {
        await base44.entities.Strain.create(strain);
      }
      return strains.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['strains'] });
      toast.success(`Imported ${count} strains`);
      setSelectedItems([]);
    }
  });

  const importVendorProductsMutation = useMutation({
    mutationFn: async ({ items, vendorName }) => {
      const products = items.map(item => ({
        vendor_name: vendorName,
        product_name: item.name,
        category: item.category?.toLowerCase() || 'other',
        variant: item.brand || '',
        price: item.price || 0,
        size: '',
        image_url: item.image || '',
        is_active: true
      }));

      for (const product of products) {
        await base44.entities.VendorProduct.create(product);
      }
      return products.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success(`Imported ${count} vendor products`);
      setSelectedItems([]);
    }
  });

  const handleImport = async () => {
    if (selectedItems.length === 0) {
      toast.error('Select items to import');
      return;
    }

    const items = searchResults.filter(r => selectedItems.includes(r.id));

    if (importTarget === 'products') {
      importProductsMutation.mutate(items);
    } else if (importTarget === 'strains') {
      importStrainsMutation.mutate(items);
    } else if (importTarget === 'vendor_products') {
      const vendorName = prompt('Enter vendor name for these products:');
      if (vendorName) {
        importVendorProductsMutation.mutate({ items, vendorName });
      }
    }
  };

  const toggleSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === searchResults.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(searchResults.map(r => r.id));
    }
  };

  const isImporting = importProductsMutation.isPending || 
                      importStrainsMutation.isPending || 
                      importVendorProductsMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-900 mb-2">WeedMaps Importer</h1>
          <p className="text-green-600">Search and import products, strains, and dispensary data</p>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search WeedMaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="strains">Strains</SelectItem>
                  <SelectItem value="dispensaries">Dispensaries</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder={`Search ${searchType}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="md:col-span-2"
              />
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {searchResults.length > 0 && (
          <>
            {/* Import Controls */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      {selectedItems.length} of {searchResults.length} selected
                    </p>
                  </div>

                  <Select value={importTarget} onValueChange={setImportTarget}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="products">Product Library</SelectItem>
                      <SelectItem value="strains">Strain Library</SelectItem>
                      <SelectItem value="vendor_products">Vendor Products</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={selectAll} variant="outline">
                    {selectedItems.length === searchResults.length ? 'Deselect All' : 'Select All'}
                  </Button>

                  <Button 
                    onClick={handleImport}
                    disabled={isImporting || selectedItems.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Import to {importTarget === 'products' ? 'Products' : importTarget === 'strains' ? 'Strains' : 'Vendor Products'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(item => (
                <Card 
                  key={item.id}
                  className={`cursor-pointer transition-all ${
                    selectedItems.includes(item.id) 
                      ? 'ring-2 ring-green-500 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => toggleSelection(item.id)}
                >
                  <CardContent className="p-4">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 flex-1">{item.name}</h3>
                        {selectedItems.includes(item.id) && (
                          <Badge className="bg-green-600">Selected</Badge>
                        )}
                      </div>

                      {item.brand && (
                        <p className="text-sm text-gray-600">Brand: {item.brand}</p>
                      )}

                      {item.category && (
                        <Badge variant="outline">{item.category}</Badge>
                      )}

                      {item.type && (
                        <Badge variant="outline">{item.type}</Badge>
                      )}

                      {item.price && (
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          {item.price}
                        </div>
                      )}

                      <div className="flex gap-3 text-sm">
                        {item.thc > 0 && (
                          <span className="text-green-700">THC: {item.thc}%</span>
                        )}
                        {item.cbd > 0 && (
                          <span className="text-blue-700">CBD: {item.cbd}%</span>
                        )}
                        {item.thc_min && (
                          <span className="text-green-700">THC: {item.thc_min}-{item.thc_max}%</span>
                        )}
                      </div>

                      {item.effects && item.effects.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.effects.slice(0, 3).map((effect, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {effect}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {item.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {item.address && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {item.city}, {item.state}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !isSearching && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Search WeedMaps Data
              </h3>
              <p className="text-gray-500">
                Use the search above to find products, strains, or dispensaries
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}