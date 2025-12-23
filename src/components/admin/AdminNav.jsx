import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Users, Package, ShoppingCart, Settings, ArrowLeft, FolderTree, Image, PackageCheck, Truck, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', page: 'AdminDashboard', icon: LayoutDashboard },
  { name: 'Products', page: 'AdminProducts', icon: Package },
  { name: 'Inventory', page: 'AdminInventory', icon: PackageCheck },
  { name: 'Categories', page: 'AdminCategories', icon: FolderTree },
  { name: 'Orders', page: 'AdminOrders', icon: ShoppingCart },
  { name: 'Tracking', page: 'OrderTracking', icon: Truck },
  { name: 'Users', page: 'AdminUsers', icon: Users },
  { name: 'Carousel', page: 'AdminCarousel', icon: Image },
  { name: 'Settings', page: 'AdminSettings', icon: Settings },
  { name: 'Factory Wholesale', page: 'FactoryWholesale', icon: Warehouse },
];

export default function AdminNav({ currentPage, mobile }) {
  if (mobile) {
    return (
      <div className="flex items-center justify-around overflow-x-auto">
        {navItems.map(item => {
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

  return null;
}