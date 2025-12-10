import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Users, Package, ShoppingCart, Settings, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', page: 'AdminDashboard', icon: LayoutDashboard },
  { name: 'Products', page: 'AdminProducts', icon: Package },
  { name: 'Orders', page: 'AdminOrders', icon: ShoppingCart },
  { name: 'Users', page: 'AdminUsers', icon: Users },
  { name: 'Carousel Settings', page: 'AdminCarousel', icon: Settings },
];

export default function AdminNav({ currentPage, mobile }) {
  if (mobile) {
    return (
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-1 px-2 pb-2">
          {navItems.map(item => {
            const isActive = currentPage === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap flex-shrink-0",
                  isActive 
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-r border-white/40 h-screen sticky top-0 w-64 p-4">
      <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-8 p-2">
        <ArrowLeft className="w-5 h-5" />
        Back to Store
      </Link>
      
      <div className="space-y-1">
        {navItems.map(item => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                isActive 
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg"
                  : "hover:bg-emerald-50 text-emerald-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}