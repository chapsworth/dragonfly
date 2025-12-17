import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminNav from '@/components/admin/AdminNav';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, Clock, CheckCircle, ArrowRight, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

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

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  const lowStockProducts = products.filter(p => !p.in_stock || p.stock_quantity < 10).slice(0, 5);

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  // Generate chart data for last 7 days
  const chartData = useMemo(() => {
    const getLast7Days = () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
      }
      return days;
    };

    const last7Days = getLast7Days();

    return last7Days.map((day, i) => {
      const dayOrders = orders.filter(o => 
        o.created_date && new Date(o.created_date).toISOString().split('T')[0] === day
      );
      const dayUsers = users.filter(u => 
        u.created_date && new Date(u.created_date).toISOString().split('T')[0] === day
      );
      
      return {
        day,
        stock: Math.max(20, products.length - i * 2),
        revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        users: dayUsers.length * 5
      };
    });
  }, [orders, users, products.length]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    out_for_delivery: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Mobile Header with Tabs */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/40">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-emerald-900">Admin</h1>
        </div>
        <div className="overflow-x-auto scrollbar-hide px-4 pb-2">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'dashboard') {
                      setActiveTab('dashboard');
                    } else if (tab.id === 'products') {
                      window.location.href = createPageUrl('AdminProducts');
                    } else if (tab.id === 'orders') {
                      window.location.href = createPageUrl('AdminOrders');
                    } else if (tab.id === 'users') {
                      window.location.href = createPageUrl('AdminUsers');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                      : 'bg-white/60 text-emerald-700 hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Nav */}
        <div className="hidden lg:block">
          <AdminNav currentPage="AdminDashboard" />
        </div>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-6 pb-20 lg:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Desktop Header */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-4xl font-bold text-emerald-900 mb-2">Dashboard</h1>
              <p className="text-emerald-600">Welcome to your admin panel</p>
            </div>

            {/* Combined Analytics Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg mb-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-emerald-900">Analytics Overview</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500" />
                    <span className="text-xs text-emerald-700">Stock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600" />
                    <span className="text-xs text-emerald-700">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-violet-500" />
                    <span className="text-xs text-emerald-700">Users</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={chartData}>
                  <Line 
                    type="monotone" 
                    dataKey="stock" 
                    stroke="#60a5fa" 
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#c084fc" 
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Stats Grid - 3 columns on mobile */}
            <div className="grid grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 sm:p-4 lg:p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg mb-2 sm:mb-3 lg:mb-4`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                  </div>
                  <p className="text-xs text-emerald-600 mb-1 line-clamp-1">{stat.label}</p>
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold text-emerald-900 truncate">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
              <Link to={createPageUrl('AdminProducts')}>
                <Button className="w-full h-20 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex-col gap-2">
                  <Package className="w-5 h-5" />
                  <span className="text-xs">Manage Products</span>
                </Button>
              </Link>
              <Link to={createPageUrl('AdminOrders')}>
                <Button className="w-full h-20 bg-gradient-to-br from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 flex-col gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-xs">View Orders</span>
                </Button>
              </Link>
              <Link to={createPageUrl('AdminUsers')}>
                <Button className="w-full h-20 bg-gradient-to-br from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 flex-col gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-xs">Manage Users</span>
                </Button>
              </Link>
              <Link to={createPageUrl('AdminCarousel')}>
                <Button className="w-full h-20 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 flex-col gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-xs">Carousel</span>
                </Button>
              </Link>
              <Link to={createPageUrl('ProductLibrary')}>
                <Button className="w-full h-20 bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 flex-col gap-2">
                  <Package className="w-5 h-5" />
                  <span className="text-xs">Product Library</span>
                </Button>
              </Link>
              <Link to={createPageUrl('StrainLibrary')}>
                <Button className="w-full h-20 bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex-col gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-xs">Strain Library</span>
                </Button>
              </Link>
              <Link to={createPageUrl('GlassPortal')}>
                <Button className="w-full h-20 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-col gap-2">
                  <Package className="w-5 h-5" />
                  <span className="text-xs">Glass Portal</span>
                </Button>
              </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-20 lg:mb-0">
              {/* Recent Orders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-emerald-900">Recent Orders</h2>
                  <Link to={createPageUrl('AdminOrders')}>
                    <Button variant="ghost" size="sm" className="text-emerald-600">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentOrders.length === 0 ? (
                    <p className="text-emerald-600 text-sm text-center py-8">No orders yet</p>
                  ) : (
                    recentOrders.map(order => (
                      <div key={order.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-emerald-900 text-sm">Order #{order.id.slice(-8)}</p>
                            <p className="text-xs text-emerald-600">{format(new Date(order.created_date + 'Z'), 'MMM d, h:mm a')}</p>
                          </div>
                          <Badge className={statusColors[order.status]}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-emerald-700">{order.items?.length || 0} items</p>
                          <p className="font-bold text-emerald-900">${order.total?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Low Stock Alert */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Stock Alert
                  </h2>
                  <Link to={createPageUrl('AdminProducts')}>
                    <Button variant="ghost" size="sm" className="text-emerald-600">
                      Manage <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {lowStockProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-emerald-600 text-sm">All products in stock!</p>
                    </div>
                  ) : (
                    lowStockProducts.map(product => (
                      <div key={product.id} className="p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=100'} 
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-emerald-900 text-sm truncate">{product.name}</p>
                            <p className="text-xs text-orange-600">
                              {product.in_stock ? 'Low stock' : 'Out of stock'}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            {product.stock_quantity || 0}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Recent Users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-emerald-900">New Customers</h2>
                  <Link to={createPageUrl('AdminUsers')}>
                    <Button variant="ghost" size="sm" className="text-emerald-600">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentUsers.length === 0 ? (
                    <p className="text-emerald-600 text-sm text-center py-8">No users yet</p>
                  ) : (
                    recentUsers.map(user => (
                      <div key={user.id} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-emerald-900 text-sm">{user.full_name || 'Anonymous'}</p>
                            <p className="text-xs text-emerald-600">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-emerald-600">{format(new Date(user.created_date), 'MMM d')}</p>
                            <Badge variant="outline" className="mt-1 border-emerald-300 text-emerald-700 text-xs">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Activity Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
              >
                <h2 className="text-lg font-bold text-emerald-900 mb-4">Quick Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-emerald-900">Pending Orders</span>
                    </div>
                    <span className="font-bold text-blue-600">{orders.filter(o => o.status === 'pending').length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/50">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-5 h-5 text-orange-500" />
                      <span className="text-sm text-emerald-900">In Delivery</span>
                    </div>
                    <span className="font-bold text-orange-600">{orders.filter(o => o.status === 'out_for_delivery').length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/50">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-emerald-900">Completed Today</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {orders.filter(o => 
                        o.status === 'delivered' && 
                        new Date(o.created_date).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-emerald-900">New Users Today</span>
                    </div>
                    <span className="font-bold text-purple-600">
                      {users.filter(u => 
                        new Date(u.created_date).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}