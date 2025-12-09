import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cannabis_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cannabis_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, variant = null) => {
    setCartItems(prev => {
      const cartItemKey = variant ? `${product.id}-${variant.name}` : product.id;
      const existing = prev.find(item => item.cartItemKey === cartItemKey);
      
      if (existing) {
        return prev.map(item =>
          item.cartItemKey === cartItemKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      const itemToAdd = {
        ...product,
        cartItemKey,
        selectedVariant: variant,
        price: variant?.price || product.price,
        quantity: 1
      };
      
      return [...prev, itemToAdd];
    });
  };

  const removeFromCart = (cartItemKey) => {
    setCartItems(prev => prev.filter(item => item.cartItemKey !== cartItemKey));
  };

  const updateQuantity = (cartItemKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemKey);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.cartItemKey === cartItemKey ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);