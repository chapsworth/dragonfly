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
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <AdminNav currentPage="AdminDashboard" />
      
      <div className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">Dashboard</h1>
          <p className="text-emerald-600 mb-8">Welcome to your admin panel</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm text-emerald-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-emerald-900">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}