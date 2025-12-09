import React, { useState } from 'react';
import { CartProvider } from '@/components/cart/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import Header from '@/components/navigation/Header';
import Sidebar from '@/components/navigation/Sidebar';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <CartProvider>
      <div className="min-h-screen">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <CartDrawer />
        <main>
          {children}
        </main>
      </div>
    </CartProvider>
  );
}