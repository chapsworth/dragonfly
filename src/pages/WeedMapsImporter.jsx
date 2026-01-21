import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Download, Package, Leaf, MapPin, ShoppingCart, Image, DollarSign, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function WeedMapsImporter() {
  const [searchType, setSearchType] = useState(() => {
    return localStorage.getItem('weedmaps_search_type') || 'products';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [importTarget, setImportTarget] = useState('products');
  const [expandedDispensary, setExpandedDispensary] = useState(null);
  const [menuItems, setMenuItems] = useState({});
  const [loadingMenu, setLoadingMenu] = useState({});
  const [selectedMenuItems, setSelectedMenuItems] = useState({});

  useEffect(() => {
    localStorage.setItem('weedmaps_search_type', searchType);
  }, [searchType]);

  const queryClient = useQueryClient();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Enter a search query');
      return;
    }

    // Clear previous results and state
    setSearchResults([]);
    setSelectedItems([]);
    setExpandedDispensary(null);
    setMenuItems({});
    setSelectedMenuItems({});
    
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
        if (response.data.status === 429) {
          toast.error('Rate limit exceeded - please wait 60 seconds before searching again');
        } else {
          toast.error('Search failed: ' + (response.data.details || response.data.error));
        }
      }
    } catch (error) {
      toast.error('Search error: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const loadDispensaryMenu = async (dispensaryId, dispensaryName) => {
    if (expandedDispensary === dispensaryId) {
      setExpandedDispensary(null);
      return;
    }

    setLoadingMenu(prev => ({ ...prev, [dispensaryId]: true }));
    setExpandedDispensary(dispensaryId);
    
    try {
      const response = await base44.functions.invoke('weedmapsSearch', {
        searchType: 'menu',
        query: dispensaryId,
        limit: 100
      });

      if (response.data.success) {
        setMenuItems(prev => ({ ...prev, [dispensaryId]: response.data.results }));
        toast.success(`Loaded ${response.data.results.length} menu items from ${dispensaryName}`);
      } else {
        toast.error('Failed to load menu');
      }
    } catch (error) {
      if (error.response?.data?.status === 429) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
      } else {
        toast.error('Failed to load dispensary menu');
      }
    } finally {
      setLoadingMenu(prev => ({ ...prev, [dispensaryId]: false }));
    }
  };

  const toggleMenuItemSelection = (dispensaryId, itemId) => {
    setSelectedMenuItems(prev => {
      const current = prev[dispensaryId] || [];
      const updated = current.includes(itemId) 
        ? current.filter(id => id !== itemId)
        : [...current, itemId];
      return { ...prev, [dispensaryId]: updated };
    });
  };

  const toggleSelectAllMenu = (dispensaryId) => {
    const items = menuItems[dispensaryId] || [];
    const selected = selectedMenuItems[dispensaryId] || [];
    
    if (selected.length === items.length) {
      setSelectedMenuItems(prev => ({ ...prev, [dispensaryId]: [] }));
    } else {
      setSelectedMenuItems(prev => ({ ...prev, [dispensaryId]: items.map(i => i.id) }));
    }
  };

  const importMenuItemsMutation = useMutation({
    mutationFn: async ({ dispensaryId, target }) => {
      const items = menuItems[dispensaryId].filter(item => 
        (selectedMenuItems[dispensaryId] || []).includes(item.id)
      );

      if (target === 'products') {
        for (const item of items) {
          await base44.entities.Product.create({
            name: item.name,
            description: item.description || '',
            price: item.price || 0,
            category: item.category?.toLowerCase() || 'other',
            image_url: item.image || '',
            thc_level: item.thc || 0,
            cbd_level: item.cbd || 0,
            strain_type: item.strain_type || 'n/a',
            in_stock: item.in_stock !== false,
            published: true
          });
        }
      } else if (target === 'strains') {
        for (const item of items) {
          await base44.entities.Strain.create({
            name: item.name,
            type: item.strain_type || 'hybrid',
            description: item.description || '',
            thc_min: item.thc || 0,
            thc_max: item.thc || 0,
            cbd_min: item.cbd || 0,
            cbd_max: item.cbd || 0,
            image_url: item.image || ''
          });
        }
      } else if (target === 'vendor_products') {
        for (const item of items) {
          await base44.entities.VendorProduct.create({
            vendor_name: item.brand || 'Unknown',
            product_name: item.name,
            category: item.category?.toLowerCase() || '',
            price: item.price || 0,
            image_url: item.image || '',
            is_active: true
          });
        }
      }

      return items.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['strains'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success(`Imported ${count} menu items`);
    }
  });

  const importProductsMutation = useMutation({
    mutationFn: async (items) => {
      for (const item of items) {
        await base44.entities.Product.create({
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
        });
      }
      return items.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Imported ${count} products`);
      setSelectedItems([]);
    }
  });

  const importStrainsMutation = useMutation({
    mutationFn: async (items) => {
      for (const item of items) {
        await base44.entities.Strain.create({
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
        });
      }
      return items.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['strains'] });
      toast.success(`Imported ${count} strains`);
      setSelectedItems([]);
    }
  });

  const importVendorProductsMutation = useMutation({
    mutationFn: async ({ items, vendorName }) => {
      for (const item of items) {
        await base44.entities.VendorProduct.create({
          vendor_name: vendorName,
          product_name: item.name,
          category: item.category?.toLowerCase() || 'other',
          variant: item.brand || '',
          price: item.price || 0,
          size: '',
          image_url: item.image || '',
          is_active: true
        });
      }
      return items.length;
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
                      importVendorProductsMutation.isPending ||
                      importMenuItemsMutation.isPending;

  const isDispensarySearch = searchType === 'dispensaries' || searchType === 'deliveries';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 lg:p-8 pt-[50px]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-900 mb-2">WeedMaps Importer</h1>
          <p className="text-green-600">Search and import products, strains, dispensaries, deliveries, and brands</p>
        </div>

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
                  <SelectItem value="deliveries">Deliveries</SelectItem>
                  <SelectItem value="brands">Brands</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder={searchType === 'products' || searchType === 'strains' ? 'Enter city, state (e.g., Los Angeles, CA)' : `Search ${searchType}...`}
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

        {searchResults.length > 0 && (
          <>
            {!isDispensarySearch && (
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
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(item => (
                <div key={item.id} className="space-y-4">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      isDispensarySearch ? 'hover:shadow-lg' :
                      selectedItems.includes(item.id) 
                        ? 'ring-2 ring-green-500 shadow-lg' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => isDispensarySearch ? loadDispensaryMenu(item.id, item.name) : toggleSelection(item.id)}
                  >
                    <CardContent className="p-4">
                      {item.image && (
                        <div className="relative mb-3">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          {isDispensarySearch && (
                            <div className="absolute top-2 right-2 bg-white/90 rounded-full p-2">
                              {expandedDispensary === item.id ? 
                                <ChevronUp className="w-5 h-5" /> : 
                                <ChevronDown className="w-5 h-5" />
                              }
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 flex-1">{item.name}</h3>
                          {!isDispensarySearch && selectedItems.includes(item.id) && (
                            <Badge className="bg-green-600">Selected</Badge>
                          )}
                        </div>

                        {item.brand && <p className="text-sm text-gray-600">Brand: {item.brand}</p>}
                        {item.category && <Badge variant="outline">{item.category}</Badge>}
                        {item.type && <Badge variant="outline">{item.type}</Badge>}
                        {item.price && (
                          <div className="flex items-center gap-1 text-green-600 font-semibold">
                            <DollarSign className="w-4 h-4" />
                            {item.price}
                          </div>
                        )}

                        <div className="flex gap-3 text-sm">
                          {item.thc > 0 && <span className="text-green-700">THC: {item.thc}%</span>}
                          {item.cbd > 0 && <span className="text-blue-700">CBD: {item.cbd}%</span>}
                          {item.thc_min && <span className="text-green-700">THC: {item.thc_min}-{item.thc_max}%</span>}
                        </div>

                        {item.effects && item.effects.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.effects.slice(0, 3).map((effect, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{effect}</Badge>
                            ))}
                          </div>
                        )}

                        {item.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                        )}

                        {item.address && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {item.city}, {item.state}
                          </div>
                        )}

                        {item.rating && (
                          <p className="text-sm text-yellow-600">⭐ {item.rating}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Menu Items Collapsible */}
                  {expandedDispensary === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Card className="border-2 border-green-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Menu Items ({(menuItems[item.id] || []).length})</CardTitle>
                            {(menuItems[item.id] || []).length > 0 && (
                              <div className="flex gap-2">
                                <Select value={importTarget} onValueChange={setImportTarget}>
                                  <SelectTrigger className="w-36">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="products">Products</SelectItem>
                                    <SelectItem value="strains">Strains</SelectItem>
                                    <SelectItem value="vendor_products">Vendor</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleSelectAllMenu(item.id)}
                                >
                                  {(selectedMenuItems[item.id] || []).length === (menuItems[item.id] || []).length ? 'Deselect' : 'Select All'}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => importMenuItemsMutation.mutate({ dispensaryId: item.id, target: importTarget })}
                                  disabled={(selectedMenuItems[item.id] || []).length === 0 || importMenuItemsMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {importMenuItemsMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    `Import ${(selectedMenuItems[item.id] || []).length}`
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {loadingMenu[item.id] ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                            </div>
                          ) : (
                            <div className="grid gap-2 max-h-96 overflow-y-auto">
                              {(menuItems[item.id] || []).map((menuItem) => (
                                <Card 
                                  key={menuItem.id}
                                  className={`cursor-pointer transition-all ${
                                    (selectedMenuItems[item.id] || []).includes(menuItem.id)
                                      ? 'ring-2 ring-green-500'
                                      : 'hover:shadow-sm'
                                  }`}
                                  onClick={() => toggleMenuItemSelection(item.id, menuItem.id)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex gap-3">
                                      {menuItem.image && (
                                        <img 
                                          src={menuItem.image} 
                                          alt={menuItem.name}
                                          className="w-16 h-16 object-cover rounded flex-shrink-0"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-semibold text-sm text-gray-900 truncate">{menuItem.name}</h5>
                                        {menuItem.brand && <p className="text-xs text-gray-600">{menuItem.brand}</p>}
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          {menuItem.category && <Badge className="text-xs">{menuItem.category}</Badge>}
                                          {menuItem.price && <p className="text-sm font-bold text-green-700">${menuItem.price}</p>}
                                          {menuItem.thc > 0 && <Badge variant="outline" className="text-xs">THC {menuItem.thc}%</Badge>}
                                        </div>
                                      </div>
                                      {(selectedMenuItems[item.id] || []).includes(menuItem.id) && (
                                        <Badge className="bg-green-600 h-fit">✓</Badge>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {searchResults.length === 0 && !isSearching && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Search WeedMaps Data
              </h3>
              <p className="text-gray-500">
                Use the search above to find products, strains, dispensaries, deliveries, or brands
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}