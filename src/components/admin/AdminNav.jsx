import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Users, Package, ShoppingCart, Settings, ArrowLeft, FolderTree, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', page: 'AdminDashboard', icon: LayoutDashboard },
  { name: 'Products', page: 'AdminProducts', icon: Package },
  { name: 'Categories', page: 'AdminCategories', icon: FolderTree },
  { name: 'Orders', page: 'AdminOrders', icon: ShoppingCart },
  { name: 'Users', page: 'AdminUsers', icon: Users },
  { name: 'Carousel', page: 'AdminCarousel', icon: Image },
  { name: 'Settings', page: 'AdminSettings', icon: Settings },
];

export default function AdminNav({ currentPage, mobile }) {
  if (mobile) {
    return (
      <div className="flex items-center justify-around">
        {navItems.slice(0, 5).map(item => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]",
                isActive 
                  ? "text-emerald-600"
                  : "text-emerald-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
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