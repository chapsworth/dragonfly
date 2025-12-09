import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminNav from '@/components/admin/AdminNav';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)).length;

  const stats = [
    { icon: Package, label: 'Total Products', value: products.length, color: 'from-blue-400 to-cyan-500' },
    { icon: ShoppingCart, label: 'Total Orders', value: orders.length, color: 'from-emerald-400 to-green-500' },
    { icon: TrendingUp, label: 'Active Orders', value: activeOrders, color: 'from-amber-400 to-orange-500' },
    { icon: Users, label: 'Total Users', value: users.length, color: 'from-purple-400 to-violet-500' },
    { icon: DollarSign, label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'from-green-500 to-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/40 px-4 py-4">
        <h1 className="text-2xl font-bold text-emerald-900">Dashboard</h1>
      </div>

      <div className="flex">
        {/* Desktop Nav */}
        <div className="hidden lg:block">
          <AdminNav currentPage="AdminDashboard" />
        </div>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Desktop Header */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-4xl font-bold text-emerald-900 mb-2">Dashboard</h1>
              <p className="text-emerald-600">Welcome to your admin panel</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 sm:p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
                >
                  <div className="flex items-center gap-4 sm:flex-col sm:items-start">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div className="sm:mt-4">
                      <p className="text-xs sm:text-sm text-emerald-600 mb-0.5 sm:mb-1">{stat.label}</p>
                      <p className="text-2xl sm:text-3xl font-bold text-emerald-900">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/40 px-4 py-3 z-40">
        <AdminNav currentPage="AdminDashboard" mobile />
      </div>
    </div>
  );
}