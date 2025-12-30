import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from '@/components/cart/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import Header from '@/components/navigation/Header';
import Sidebar from '@/components/navigation/Sidebar';
import CapacitorPushNotifications from '@/components/push/CapacitorPushNotifications';

export default function Layout({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Hide header on specific pages
  const hideHeader = ['distro', 'FactoryWholesale', 'VendorOrders'].includes(currentPageName);

  // Check for referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // Store referral code in localStorage to be used after signup
      localStorage.setItem('referral_code', refCode);
      
      // Try to apply referral if user is logged in
      base44.auth.me()
        .then(async (user) => {
          if (user && !user.referred_by && !user.referral_bonus_claimed) {
            // Find referrer by code
            const users = await base44.asServiceRole.entities.User.list();
            const referrer = users.find(u => u.referral_code === refCode);
            
            if (referrer && referrer.email !== user.email) {
              await base44.auth.updateMe({ referred_by: referrer.email });
            }
          }
        })
        .catch(() => {
          // User not logged in, will apply after signup
        });
    }
  }, []);

  return (
    <HelmetProvider>
      <CartProvider>
        <CapacitorPushNotifications />
        <div className="min-h-screen">
          {!hideHeader && <Header onMenuClick={() => setIsSidebarOpen(true)} />}
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <CartDrawer />
          <main>
            {children}
          </main>
        </div>
      </CartProvider>
    </HelmetProvider>
  );
}