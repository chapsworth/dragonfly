import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CartProvider } from '@/components/cart/CartContext';
import { RadioProvider } from '@/components/radio/RadioContext';
import CartDrawer from '@/components/cart/CartDrawer';
import RadioPlayer from '@/components/radio/RadioPlayer';
import Header from '@/components/navigation/Header';
import Sidebar from '@/components/navigation/Sidebar';

export default function Layout({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Check authentication and redirect to BiometricLogin if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (currentPageName === 'BiometricLogin') return; // Don't redirect if already on login page
      
      try {
        await base44.auth.me();
      } catch {
        // Not authenticated, redirect to login
        navigate(createPageUrl('BiometricLogin'));
      }
    };
    checkAuth();
  }, [currentPageName, navigate]);

  // Intercept logout to redirect to BiometricLogin
  useEffect(() => {
    const originalLogout = base44.auth.logout;
    base44.auth.logout = function(...args) {
      originalLogout.apply(this, args);
      navigate(createPageUrl('BiometricLogin'));
    };
    return () => {
      base44.auth.logout = originalLogout;
    };
  }, [navigate]);

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
    <CartProvider>
      <RadioProvider>
        <div className="min-h-screen">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <CartDrawer />
          <RadioPlayer />
          <main>
            {children}
          </main>
        </div>
      </RadioProvider>
    </CartProvider>
  );
}