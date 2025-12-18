import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AppIcon from '@/components/launcher/AppIcon';
import AppFolder from '@/components/launcher/AppFolder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Briefcase, Image, Settings, 
  Leaf, Sparkles, Phone, ClipboardList, Building2, Calendar, CheckSquare, 
  Bookmark, FileText, FolderTree, ShoppingBag, Heart, TrendingUp,
  DollarSign, MapPin, Camera, Upload, Palette, Home, Layers, Wine, Navigation,
  Code, Receipt
} from 'lucide-react';

export default function AdminLauncher() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [background, setBackground] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['launcher-settings'],
    queryFn: async () => {
      const all = await base44.entities.AppSettings.list();
      return all[0] || {};
    }
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['pending-orders'],
    queryFn: () => base44.entities.Order.list().then(o => o.filter(order => order.status === 'pending'))
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['pending-tasks'],
    queryFn: () => base44.entities.CRMTask.list().then(t => t.filter(task => task.status === 'todo'))
  });

  const defaultBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)';
  const bgStyle = settings?.launcher_background || background || defaultBg;

  const handleSaveBackground = async () => {
    if (!settings?.id) {
      await base44.entities.AppSettings.create({ launcher_background: background });
    } else {
      await base44.entities.AppSettings.update(settings.id, { launcher_background: background });
    }
    setIsSettingsOpen(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setBackground(`url(${file_url})`);
  };

  // Main apps
  const mainApps = [
    { icon: LayoutDashboard, label: 'Dashboard', page: 'AdminDashboard', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { icon: ShoppingCart, label: 'Orders', page: 'AdminOrders', color: 'bg-gradient-to-br from-orange-500 to-red-500', badge: orders.length || null },
    { icon: Package, label: 'Products', page: 'AdminProducts', color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { icon: Users, label: 'Users', page: 'AdminUsers', color: 'bg-gradient-to-br from-green-500 to-emerald-600' },
  ];

  // CRM apps
  const crmApps = [
    { icon: Briefcase, label: 'CRM Home', page: 'CRM', color: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { icon: Users, label: 'Contacts', page: 'CRMContacts', color: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
    { icon: TrendingUp, label: 'Deals', page: 'CRMDeals', color: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
    { icon: Building2, label: 'Vendors', page: 'CRMVendors', color: 'bg-gradient-to-br from-indigo-500 to-purple-500' },
    { icon: Calendar, label: 'Calendar', page: 'CRMCalendar', color: 'bg-gradient-to-br from-pink-500 to-rose-500' },
    { icon: CheckSquare, label: 'Tasks', page: 'CRMTasks', color: 'bg-gradient-to-br from-amber-500 to-orange-500', badge: tasks.length || null },
    { icon: Bookmark, label: 'Bookmarks', page: 'CRMBookmarks', color: 'bg-gradient-to-br from-teal-500 to-cyan-500' },
    { icon: FileText, label: 'Documents', page: 'CRMDocuments', color: 'bg-gradient-to-br from-violet-500 to-purple-500' },
  ];

  // Shop apps
  const shopApps = [
    { icon: ShoppingBag, label: 'Shop', page: 'Shop', color: 'bg-gradient-to-br from-emerald-500 to-green-500' },
    { icon: Leaf, label: 'Strains', page: 'StrainLibrary', color: 'bg-gradient-to-br from-green-600 to-emerald-700' },
    { icon: Sparkles, label: 'Rewards', page: 'Rewards', color: 'bg-gradient-to-br from-yellow-500 to-amber-500' },
    { icon: ClipboardList, label: 'My Orders', page: 'Orders', color: 'bg-gradient-to-br from-blue-500 to-indigo-500' },
    { icon: Heart, label: 'Favorites', page: 'Shop', color: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  ];

  // Settings apps
  const settingsApps = [
    { icon: Image, label: 'Carousel', page: 'AdminCarousel', color: 'bg-gradient-to-br from-cyan-500 to-blue-500' },
    { icon: FolderTree, label: 'Categories', page: 'AdminCategories', color: 'bg-gradient-to-br from-violet-500 to-purple-500' },
    { icon: TrendingUp, label: 'Inventory', page: 'AdminInventory', color: 'bg-gradient-to-br from-orange-500 to-red-500' },
    { icon: Settings, label: 'Settings', page: 'AdminSettings', color: 'bg-gradient-to-br from-slate-600 to-gray-700' },
    { icon: Layers, label: 'Components', page: 'ComponentLibrary', color: 'bg-gradient-to-br from-indigo-500 to-blue-500' },
    { icon: Wine, label: 'Glass Portal', page: 'GlassPortal', color: 'bg-gradient-to-br from-rose-500 to-pink-500' },
    { icon: Package, label: 'Products DB', page: 'ProductLibrary', color: 'bg-gradient-to-br from-amber-500 to-yellow-500' },
    { icon: Navigation, label: 'Delivery Nav', page: 'DeliveryNavigation', color: 'bg-gradient-to-br from-teal-500 to-cyan-500' },
  ];

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: bgStyle,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Status bar */}
      <div className="h-11 flex items-center justify-between px-6 text-white text-sm font-semibold">
        <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
          {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
        <div className="flex items-center gap-1">
          <div className="flex gap-[2px]">
            <div className="w-[3px] h-2 bg-white rounded-full"></div>
            <div className="w-[3px] h-3 bg-white rounded-full"></div>
            <div className="w-[3px] h-4 bg-white rounded-full"></div>
            <div className="w-[3px] h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* App grid */}
      <div className="px-6 pt-16 pb-32">
        {/* Row 1 */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-6 mb-6">
          {mainApps.map((app, i) => (
            <AppIcon key={i} {...app} />
          ))}
        </div>

        {/* Row 2 - Folders */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-6 mb-6">
          <AppFolder 
            label="CRM" 
            color="bg-gradient-to-br from-emerald-500 to-green-600"
            icons={crmApps.map(a => a.icon)}
            apps={crmApps}
          />
          <AppFolder 
            label="Shop" 
            color="bg-gradient-to-br from-blue-500 to-cyan-500"
            icons={shopApps.map(a => a.icon)}
            apps={shopApps}
          />
          <AppFolder 
            label="Settings" 
            color="bg-gradient-to-br from-purple-500 to-violet-600"
            icons={settingsApps.map(a => a.icon)}
            apps={settingsApps}
          />
          <AppIcon 
            icon={Phone} 
            label="Contact" 
            page="Contact" 
            color="bg-gradient-to-br from-green-500 to-emerald-600"
          />
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-6 mb-6">
          <AppIcon 
            icon={MapPin} 
            label="Tracking" 
            page="OrderTracking" 
            color="bg-gradient-to-br from-cyan-500 to-blue-500"
          />
          <AppIcon 
            icon={Home} 
            label="Home" 
            page="Home" 
            color="bg-gradient-to-br from-orange-500 to-red-500"
          />
          <AppIcon 
            icon={Palette} 
            label="Customize" 
            color="bg-gradient-to-br from-indigo-500 to-purple-500"
            onClick={() => setIsSettingsOpen(true)}
          />
        </div>
      </div>

      {/* Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md">
        <div 
          className="bg-white/20 backdrop-blur-2xl rounded-[20px] px-4 py-3 border border-white/10"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.1)'
          }}
        >
          <div className="grid grid-cols-4 gap-4">
            <AppIcon 
              icon={LayoutDashboard} 
              label="Dashboard" 
              page="AdminDashboard" 
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <AppIcon 
              icon={ShoppingCart} 
              label="Orders" 
              page="AdminOrders" 
              color="bg-gradient-to-br from-orange-500 to-red-500"
              badge={orders.length || null}
            />
            <AppIcon 
              icon={Briefcase} 
              label="CRM" 
              page="CRM" 
              color="bg-gradient-to-br from-emerald-500 to-green-600"
            />
            <AppIcon 
              icon={Settings} 
              label="Settings" 
              page="AdminSettings" 
              color="bg-gradient-to-br from-slate-600 to-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Customize Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Background</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
            <div>
              <Label>Or Use CSS Background</Label>
              <Input 
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="linear-gradient(...) or url(...)"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setBackground('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')}
                className="h-12 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              />
              <button 
                onClick={() => setBackground('linear-gradient(135deg, #f093fb 0%, #f5576c 100%)')}
                className="h-12 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
              />
              <button 
                onClick={() => setBackground('linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)')}
                className="h-12 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
              />
              <button 
                onClick={() => setBackground('linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)')}
                className="h-12 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
              />
              <button 
                onClick={() => setBackground('linear-gradient(135deg, #fa709a 0%, #fee140 100%)')}
                className="h-12 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}
              />
              <button 
                onClick={() => setBackground('linear-gradient(135deg, #30cfd0 0%, #330867 100%)')}
                className="h-12 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}
              />
            </div>
            <Button onClick={handleSaveBackground} className="w-full bg-gradient-to-r from-emerald-500 to-green-500">
              Save Background
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}