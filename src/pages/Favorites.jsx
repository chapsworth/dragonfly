import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useCart } from '@/components/cart/CartContext';

export default function Favorites() {
  const queryClient = useQueryClient();
  const { addToCart } = useCart();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Removed from favorites');
    }
  });

  const favoriteProducts = products.filter(p => 
    favorites.some(f => f.product_id === p.id)
  );

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success('Added to cart');
  };

  const handleRemove = (productId) => {
    const fav = favorites.find(f => f.product_id === productId);
    if (fav) {
      removeMutation.mutate(fav.id);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="text-center">
          <Heart className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">Sign in to view favorites</h2>
          <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2 flex items-center gap-3">
            <Heart className="w-10 h-10 fill-red-500 text-red-500" />
            My Favorites
          </h1>
          <p className="text-emerald-600">{favoriteProducts.length} saved products</p>
        </div>

        {favoriteProducts.length === 0 ? (
          <Card className="border-emerald-200">
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-emerald-900 mb-2">No favorites yet</h3>
              <p className="text-emerald-600 mb-4">Save products you love for easy access</p>
              <Link to={createPageUrl('Shop')}>
                <Button className="bg-gradient-to-r from-emerald-500 to-green-500">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteProducts.map(product => (
              <Card key={product.id} className="border-emerald-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                    <div className="aspect-square bg-gradient-to-br from-emerald-100 to-green-100 relative overflow-hidden rounded-t-lg">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="w-20 h-20 text-emerald-300" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                      <h3 className="font-bold text-emerald-900 mb-2 hover:text-emerald-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-2xl font-bold text-green-700 mb-4">${product.price}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500"
                        disabled={!product.in_stock}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemove(product.id)}
                        className="text-red-600 hover:bg-red-50"
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
      </div>
    </div>
  );
}