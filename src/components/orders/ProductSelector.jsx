import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Plus, Minus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProductSelector({ isOpen, onClose, onAddProducts }) {
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleProduct = (product) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.image_url
      }]);
    }
  };

  const updateQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.product_id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    ));
  };

  const updatePrice = (productId, price) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.product_id === productId ? { ...p, price: parseFloat(price) || 0 } : p
    ));
  };

  const handleAdd = () => {
    onAddProducts(selectedProducts);
    setSelectedProducts([]);
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Products to Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Available Products */}
            <div>
              <Label className="mb-2 block">Available Products</Label>
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-2">
                  {filteredProducts.map(product => {
                    const isSelected = selectedProducts.some(p => p.product_id === product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleToggleProduct(product)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{product.name}</p>
                            <p className="text-emerald-600 font-bold">${product.price.toFixed(2)}</p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Selected Products */}
            <div>
              <Label className="mb-2 block">Selected ({selectedProducts.length})</Label>
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {selectedProducts.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No products selected</p>
                ) : (
                  <div className="space-y-3">
                    {selectedProducts.map(product => (
                      <div key={product.product_id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <p className="font-semibold text-sm flex-1">{product.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={product.price}
                              onChange={(e) => updatePrice(product.product_id, e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Quantity</Label>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(product.product_id, product.quantity - 1)}
                                className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <Input
                                type="number"
                                value={product.quantity}
                                onChange={(e) => updateQuantity(product.product_id, parseInt(e.target.value))}
                                className="h-8 text-center"
                              />
                              <button
                                onClick={() => updateQuantity(product.product_id, product.quantity + 1)}
                                className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleAdd}
              disabled={selectedProducts.length === 0}
              className="bg-gradient-to-r from-emerald-500 to-green-500"
            >
              Add {selectedProducts.length} Product{selectedProducts.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}