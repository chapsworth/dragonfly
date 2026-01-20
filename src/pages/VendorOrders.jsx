import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, Download, ShoppingCart, Package, Trash2, Search, FileText, ChevronDown, RefreshCw, Grid3x3, List, Edit, DollarSign, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import VendorOrderMap from '@/components/vendor/VendorOrderMap';
import CarlChat from '@/components/vendor/CarlChat';

export default function VendorOrders() {
  return <VendorOrdersContent />;
}

function VendorOrdersContent() {
  const [selectedVendor, setSelectedVendor] = useState('LA Bulk');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState('');
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [addedItems, setAddedItems] = useState([]);
  const [floatingItemAnim, setFloatingItemAnim] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isGlobalEditOpen, setIsGlobalEditOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productForm, setProductForm] = useState({});
  const [vendorForm, setVendorForm] = useState({ name: '', type: 'flower', url: '', defaultPrice: 0 });
  const [bulkPriceChange, setBulkPriceChange] = useState({ type: 'set', value: 0 });
  const [globalPriceChange, setGlobalPriceChange] = useState({ type: 'set', value: 0 });
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [isCarlOpen, setIsCarlOpen] = useState(false);
  const floatingTotalRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: vendorsData = [] } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const saved = await base44.entities.VendorProduct.list();
      const uniqueVendors = [...new Set(saved.map(p => p.vendor_name))];
      return uniqueVendors.map(name => ({ name, type: 'custom' }));
    }
  });

  const defaultVendors = [
    { name: 'LA Bulk', type: 'flower', url: 'https://labulkflower.com/shop/', defaultPrice: 100 },
    { name: 'LA Bulk - Sungrown (A)', type: 'flower', url: 'https://labulkflower.com/product/bulk-flower/', defaultPrice: 100 },
    { name: 'LA Bulk - AA', type: 'flower', url: 'https://labulkflower.com/product/aa/', defaultPrice: 150 },
    { name: 'LA Bulk - AAA Indoor', type: 'flower', url: 'https://labulkflower.com/product/aaa-indoor/', defaultPrice: 300 },
    { name: 'smashed', type: 'custom', url: '', defaultPrice: 0 },
    { name: 'pioneer', type: 'flower', url: '', defaultPrice: 0 },
    { name: 'Flavs', type: 'custom', url: '', defaultPrice: 0 }
  ];

  // Smashed vendor products
  const smashedProducts = [
    // Pre-Rolls - Liquid Diamond Mini Doobies 1g
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies', variant: 'King Louis (Indica)', size: '1g Single', price: 5 },
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies', variant: 'Watermelon Whirl (Indica)', size: '1g Single', price: 5 },
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies', variant: 'Strawberry Cough (Sativa)', size: '1g Single', price: 5 },
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies', variant: 'Grape Galaxy (Sativa)', size: '1g Single', price: 5 },
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies', variant: 'Wedding Crasher (Hybrid)', size: '1g Single', price: 5 },
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies', variant: 'Peachy Keen (Hybrid)', size: '1g Single', price: 5 },
    
    // Pre-Rolls - Liquid Diamond Mini Doobies 3g Jar
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies Jar', variant: 'King Louis (Indica)', size: '3g', price: 15 },
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies Jar', variant: 'Churro Ice Cream (Indica)', size: '3g', price: 15 },
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies Jar', variant: 'Crescendo (Sativa)', size: '3g', price: 15 },
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies Jar', variant: 'Maui Wowie (Sativa)', size: '3g', price: 15 },
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies Jar', variant: 'Wedding Crasher (Hybrid)', size: '3g', price: 15 },
    { category: 'pre-rolls', product_name: 'Liquid Diamond Mini Doobies Jar', variant: 'Peach Rings (Hybrid)', size: '3g', price: 15 },
    
    // Pre-Rolls - Super Doobie
    { category: 'pre-rolls', product_name: 'Super Doobie', variant: 'Blueberry Bliss (Indica)', size: '1.4g', price: 6 },
    { category: 'pre-rolls', product_name: 'Super Doobie', variant: 'Apple Delight (Indica)', size: '1.4g', price: 6 },
    { category: 'pre-rolls', product_name: 'Super Doobie', variant: 'Bubble Gum (Indica)', size: '1.4g', price: 6 },
    { category: 'pre-rolls', product_name: 'Super Doobie', variant: 'Watermelon Sunset (Sativa)', size: '1.4g', price: 6 },
    { category: 'pre-rolls', product_name: 'Super Doobie', variant: 'Strawberry Cough (Sativa)', size: '1.4g', price: 6 },
    { category: 'pre-rolls', product_name: 'Super Doobie', variant: 'Grape Fusion (Sativa)', size: '1.4g', price: 6 },
    { category: 'pre-rolls', product_name: 'Super Doobie', variant: 'Peach Rings (Hybrid)', size: '1.4g', price: 6 },
    { category: 'pre-rolls', product_name: 'Super Doobie', variant: 'Wildberry Whirl (Hybrid)', size: '1.4g', price: 6 },
    { category: 'pre-rolls', product_name: 'Super Doobie', variant: 'Pineapple Paradise (Hybrid)', size: '1.4g', price: 6 },
    
    // Tincture Syrups
    { category: 'tinctures', product_name: 'THC Syrup', variant: 'Raspberry', size: '1000mg / 170ml', price: 8 },
    { category: 'tinctures', product_name: 'THC Syrup', variant: 'Blueberry', size: '1000mg / 170ml', price: 8 },
    { category: 'tinctures', product_name: 'THC Syrup', variant: 'Strawberry', size: '1000mg / 170ml', price: 8 },
    { category: 'tinctures', product_name: 'THC Syrup', variant: 'Grape', size: '1000mg / 170ml', price: 8 },
    { category: 'tinctures', product_name: 'THC Syrup', variant: 'Cherry', size: '1000mg / 170ml', price: 8 },
    { category: 'tinctures', product_name: 'THC Syrup', variant: 'Blueberry', size: '5000mg / 250ml', price: 20 },
    { category: 'tinctures', product_name: 'THC Syrup', variant: 'Strawberry', size: '5000mg / 250ml', price: 20 },
    { category: 'tinctures', product_name: 'THC Syrup', variant: 'Grape', size: '5000mg / 250ml', price: 20 },
    { category: 'tinctures', product_name: 'THC Syrup', variant: 'Apple', size: '5000mg / 250ml', price: 20 },
    { category: 'tinctures', product_name: 'THC Syrup', variant: 'Watermelon', size: '5000mg / 250ml', price: 20 },
    
    // Concentrates - Badder
    { category: 'concentrates', product_name: 'Badder', variant: 'Purple Haze (Indica)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Badder', variant: 'Papaya Punch (Indica)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Badder', variant: 'El Charro (Indica)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Badder', variant: 'Guava Kush (Sativa)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Badder', variant: 'Area 51 (Sativa)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Badder', variant: 'Red Bullz (Hybrid)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Badder', variant: 'Apple Fritter (Hybrid)', size: '1g', price: 10 },
    
    // Concentrates - Crumble
    { category: 'concentrates', product_name: 'Crumble', variant: 'Cherry Pie (Indica)', size: '1g', price: 12 },
    { category: 'concentrates', product_name: 'Crumble', variant: 'Runtz (Indica)', size: '1g', price: 12 },
    { category: 'concentrates', product_name: 'Crumble', variant: 'El Charro (Indica)', size: '1g', price: 12 },
    { category: 'concentrates', product_name: 'Crumble', variant: 'Blue Dream (Sativa)', size: '1g', price: 12 },
    { category: 'concentrates', product_name: 'Crumble', variant: 'Area 51 (Sativa)', size: '1g', price: 12 },
    { category: 'concentrates', product_name: 'Crumble', variant: 'Gorilla Glue (Hybrid)', size: '1g', price: 12 },
    { category: 'concentrates', product_name: 'Crumble', variant: 'Apple Fritter (Hybrid)', size: '1g', price: 12 },
    
    // Concentrates - Diamonds
    { category: 'concentrates', product_name: 'Diamonds', variant: 'Peanut Butter Cookies (Indica)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Diamonds', variant: 'Papaya Punch (Indica)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Diamonds', variant: 'El Charro (Indica)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Diamonds', variant: 'Guava Kush (Sativa)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Diamonds', variant: 'Blue Dream (Sativa)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Diamonds', variant: 'Red Bullz (Hybrid)', size: '1g', price: 10 },
    { category: 'concentrates', product_name: 'Diamonds', variant: 'Gorilla Glue (Hybrid)', size: '1g', price: 10 },
    
    // Concentrates - Hash
    { category: 'concentrates', product_name: 'Hash', variant: 'King Louis (Indica)', size: '1g', price: 12 },
    { category: 'concentrates', product_name: 'Hash', variant: 'Granddaddy Purple (Indica)', size: '1g', price: 12 },
    { category: 'concentrates', product_name: 'Hash', variant: 'Master Kush (Indica)', size: '1g', price: 12 },
    { category: 'concentrates', product_name: 'Hash', variant: 'Northern Light (Hybrid)', size: '1g', price: 12 },
    { category: 'concentrates', product_name: 'Hash', variant: 'La Confidential (Hybrid)', size: '1g', price: 12 },
    
    // Edibles - Chocolate Bars
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Amazin', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Dinosaurs', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Mint Chip', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'G-Way', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Astronauts', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Milky Way', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Willy Wonka', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Kings of Buds', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Blue Whale', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Twinkids', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Volcano', size: '500mg', price: 9 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Amazin', size: '1000mg', price: 13 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Dinosaurs', size: '1000mg', price: 13 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Mint Chip', size: '1000mg', price: 13 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'G-Way', size: '1000mg', price: 13 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Milky Way', size: '1000mg', price: 13 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Willy Wonka', size: '1000mg', price: 13 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Kings of Buds', size: '1000mg', price: 13 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Amazin', size: '5000mg', price: 23 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Mint Chip', size: '5000mg', price: 23 },
    { category: 'edibles', product_name: 'Chocolate Bar', variant: 'Willy Wonka', size: '5000mg', price: 23 },
    
    // Edibles - Cannabis Gummies 500mg
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Belts', size: '500mg', price: 7 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Worms', size: '500mg', price: 7 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Green Apple', size: '500mg', price: 7 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Blue Raspberry', size: '500mg', price: 7 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Strawberry', size: '500mg', price: 7 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Unicorn', size: '500mg', price: 7 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Neon', size: '500mg', price: 7 },
    
    // Edibles - Cannabis Gummies 1000mg
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Belts', size: '1000mg', price: 12 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Rings', size: '1000mg', price: 12 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Bears', size: '1000mg', price: 12 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Worms', size: '1000mg', price: 12 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Neon', size: '1000mg', price: 12 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Chandy', size: '1000mg', price: 12 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Green Apple', size: '1000mg', price: 12 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Blue Raspberry', size: '1000mg', price: 12 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Unicorn', size: '1000mg', price: 12 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Watermelon', size: '1000mg', price: 12 },
    
    // Edibles - Cannabis Gummies 5000mg
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Belts', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Rings', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Bears', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Worms', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Drops', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Neon', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Chammy', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Green Apple', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Peach', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Blue Raspberry', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Strawberry', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Unicorn', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Watermelon', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Tropical Mix', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Sour Patch Kids', size: '5000mg', price: 25 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Watermelon Slices', size: '5000mg', price: 25 },
    
    // Edibles - Cannabis Gummies 10,000mg
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Slices', size: '10000mg', price: 33 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Watermelon', size: '10000mg', price: 33 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Bears', size: '10000mg', price: 33 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Neon', size: '10000mg', price: 33 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Drops', size: '10000mg', price: 33 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Peach', size: '10000mg', price: 33 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Rings', size: '10000mg', price: 33 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Tropical Mix', size: '10000mg', price: 33 },
    { category: 'edibles', product_name: 'Cannabis Gummies', variant: 'Sour Patch Kids', size: '10000mg', price: 33 },
    
    // Edibles - Mighty Munchies 1200mg
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Blueberry Rings', size: '1200mg', price: 12 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Strawberry Rings', size: '1200mg', price: 12 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Watermelon Rings', size: '1200mg', price: 12 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Neon Rings', size: '1200mg', price: 12 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Peach Rings', size: '1200mg', price: 12 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Green Apple Rings', size: '1200mg', price: 12 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Neon Worms', size: '1200mg', price: 12 },
    
    // Edibles - Mighty Munchies 2400mg
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Blueberry Rings', size: '2400mg', price: 20 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Strawberry Rings', size: '2400mg', price: 20 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Watermelon Rings', size: '2400mg', price: 20 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Neon Rings', size: '2400mg', price: 20 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Peach Rings', size: '2400mg', price: 20 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Green Apple Rings', size: '2400mg', price: 20 },
    { category: 'edibles', product_name: 'Mighty Munchies', variant: 'Neon Worms', size: '2400mg', price: 20 },
    
    // Edibles - Aurora Chocolates 5g
    { category: 'edibles', product_name: 'Aurora Chocolate', variant: 'Cookies and Cream', size: '5g', price: 10 },
    { category: 'edibles', product_name: 'Aurora Chocolate', variant: 'Peanut Butter', size: '5g', price: 10 },
    { category: 'edibles', product_name: 'Aurora Chocolate', variant: "S'mores", size: '5g', price: 10 },
    { category: 'edibles', product_name: 'Aurora Chocolate', variant: 'Milk Chocolate', size: '5g', price: 10 },
    { category: 'edibles', product_name: 'Aurora Chocolate', variant: 'Strawberries and Cream', size: '5g', price: 10 },
    { category: 'edibles', product_name: 'Aurora Chocolate', variant: 'Sea Salt Dark Chocolate', size: '5g', price: 10 },
    
    // Liquid Diamond Gummies (Nano) 500mg
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Peach Paradise', size: '500mg', price: 5 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Strawberry Splash', size: '500mg', price: 5 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Blueberry Blast', size: '500mg', price: 5 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Watermelon Gusher', size: '500mg', price: 5 },
    
    // Liquid Diamond Gummies (Nano) 3000mg
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Tropical', size: '3000mg', price: 11 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Peach Paradise', size: '3000mg', price: 11 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Strawberry Splash', size: '3000mg', price: 11 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Blueberry Blast', size: '3000mg', price: 11 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Watermelon Gusher', size: '3000mg', price: 11 },
    
    // Liquid Diamond Gummies (Nano) 5000mg
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Tropical', size: '5000mg', price: 16 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Peach Paradise', size: '5000mg', price: 16 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Strawberry Splash', size: '5000mg', price: 16 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Blueberry Blast', size: '5000mg', price: 16 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Watermelon Gusher', size: '5000mg', price: 16 },
    { category: 'edibles', product_name: 'Liquid Diamond Gummies (Nano)', variant: 'Pink Lemonade', size: '5000mg', price: 16 },
    
    // Vapes - Standard Cartridges 1g
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'Banana OG (Indica)', size: '1g', price: 12 },
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'King Louis (Indica)', size: '1g', price: 12 },
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'Kush Breath (Indica)', size: '1g', price: 12 },
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'Apple Express (Sativa)', size: '1g', price: 12 },
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'Strawberry Cough (Sativa)', size: '1g', price: 12 },
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'Super Lemon Haze (Sativa)', size: '1g', price: 12 },
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'Orange Creamsicle (Hybrid)', size: '1g', price: 12 },
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'Watermelon Zkittlez (Hybrid)', size: '1g', price: 12 },
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'Blue Dream (Hybrid)', size: '1g', price: 12 },
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'Space Cake (Hybrid)', size: '1g', price: 12 },
    { category: 'vapes', product_name: 'Cartridge (Standard)', variant: 'Wham Si India (Hybrid)', size: '1g', price: 12 },
    
    // Vapes - Live Resin Cartridges 1g
    { category: 'vapes', product_name: 'Live Resin Cartridge', variant: 'OG Kush Breath (Indica)', size: '1g', price: 16 },
    { category: 'vapes', product_name: 'Live Resin Cartridge', variant: '24K (Indica)', size: '1g', price: 16 },
    { category: 'vapes', product_name: 'Live Resin Cartridge', variant: 'Lights Out (Indica)', size: '1g', price: 16 },
    { category: 'vapes', product_name: 'Live Resin Cartridge', variant: 'Blueberry AK (Sativa)', size: '1g', price: 16 },
    { category: 'vapes', product_name: 'Live Resin Cartridge', variant: 'Sunrise Sherbet (Sativa)', size: '1g', price: 16 },
    { category: 'vapes', product_name: 'Live Resin Cartridge', variant: 'Blue Dream (Sativa)', size: '1g', price: 16 },
    { category: 'vapes', product_name: 'Live Resin Cartridge', variant: 'Gelato Doiz (Hybrid)', size: '1g', price: 16 },
    { category: 'vapes', product_name: 'Live Resin Cartridge', variant: 'Strawberry Champagne (Hybrid)', size: '1g', price: 16 },
    { category: 'vapes', product_name: 'Live Resin Cartridge', variant: 'Cherry Pie (Hybrid)', size: '1g', price: 16 },
    
    // Vapes - Disposables (Hash Oil x Liquid Diamonds) 1g
    { category: 'vapes', product_name: 'Disposable Vape (Hash Oil x Liquid Diamonds)', variant: 'Lemon Cherry Gelato (Sativa)', size: '1g', price: 14 },
    { category: 'vapes', product_name: 'Disposable Vape (Hash Oil x Liquid Diamonds)', variant: 'Blue Dream (Sativa)', size: '1g', price: 14 },
    { category: 'vapes', product_name: 'Disposable Vape (Hash Oil x Liquid Diamonds)', variant: 'Cereal Milk (Sativa)', size: '1g', price: 14 },
    { category: 'vapes', product_name: 'Disposable Vape (Hash Oil x Liquid Diamonds)', variant: 'Tangerine Dream (Hybrid)', size: '1g', price: 14 },
    
    // Vapes - Eighth Vapes (Live Resin x Liquid Diamond) 3.5g
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: "S'mores (Sativa)", size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Strawberry Lemonade (Sativa)', size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Blueberry Pancakes (Hybrid)', size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Watermelon Gusher (Hybrid)', size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Peach Fuzz (Hybrid)', size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Apple Fritter (Hybrid)', size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Diamond OG (Indica)', size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Sour Smashers (Indica)', size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Strawberry OG (Indica)', size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Deep Fried Smashers (Indica)', size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Baja Blast (Indica)', size: '3.5g', price: 20 },
    { category: 'vapes', product_name: 'Eighth Vape (Live Resin x Liquid Diamond)', variant: 'Unicorn Breath (Indica)', size: '3.5g', price: 20 }
  ];

  // Pioneer vendor products
  const pioneerProducts = [
    // Ounces
    { category: 'flower', product_name: 'Colombian Gold', variant: 'sativa', size: '1oz', price: 55 },
    { category: 'flower', product_name: 'Super Lemon Gelato', variant: 'hybrid', size: '1oz', price: 55 },
    { category: 'flower', product_name: 'Sunset Sherbet', variant: 'hybrid/indica', size: '1oz', price: 55 },
    { category: 'flower', product_name: 'Purple Urkle', variant: 'indica', size: '1oz', price: 55 },
    { category: 'flower', product_name: 'Cheetah Piss', variant: 'hybrid', size: '1oz', price: 65 },
    { category: 'flower', product_name: 'Bluephoria', variant: 'hybrid', size: '1oz', price: 65 },
    { category: 'flower', product_name: 'Bridesmaid', variant: 'indica', size: '1oz', price: 70 },
    { category: 'flower', product_name: 'White Fire OG', variant: 'indica', size: '1oz', price: 85 },
    { category: 'flower', product_name: 'Diablo OG', variant: 'indica', size: '1oz', price: 110 },
    { category: 'flower', product_name: 'Purple Pound Cake', variant: 'hybrid/indica', size: '1oz', price: 110 },
    { category: 'flower', product_name: 'Captain Jack', variant: 'sativa', size: '1oz', price: 115 },
    
    // Quarter Pounds
    { category: 'flower', product_name: 'Super Lemon Gelato', variant: 'hybrid', size: '1/4lb', price: 200 },
    { category: 'flower', product_name: 'Cheetah Piss', variant: 'hybrid', size: '1/4lb', price: 225 },
    { category: 'flower', product_name: 'Bluephoria', variant: 'hybrid', size: '1/4lb', price: 225 },
    { category: 'flower', product_name: 'Bridesmaid', variant: 'indica', size: '1/4lb', price: 250 },
    { category: 'flower', product_name: 'White Fire OG', variant: 'indica', size: '1/4lb', price: 300 },
    { category: 'flower', product_name: 'Diablo OG', variant: 'indica', size: '1/4lb', price: 400 }
  ];

  const vendors = [...defaultVendors, ...vendorsData.filter(v => !defaultVendors.find(d => d.name === v.name))];

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['vendor-products', selectedVendor],
    queryFn: async () => {
      // For smashed vendor, return hardcoded products
      if (selectedVendor === 'smashed') {
        return smashedProducts.map((p, idx) => ({
          id: `smashed-${idx}`,
          vendor_name: 'smashed',
          ...p,
          is_active: true
        }));
      }
      // For pioneer vendor, return hardcoded products
      if (selectedVendor === 'pioneer') {
        return pioneerProducts.map((p, idx) => ({
          id: `pioneer-${idx}`,
          vendor_name: 'pioneer',
          ...p,
          is_active: true
        }));
      }
      const all = await base44.entities.VendorProduct.list();
      return all.filter(p => p.vendor_name === selectedVendor && p.is_active);
    }
  });

  const handleScrapeMenu = async (vendor) => {
    if (!vendor.url) return;
    
    setIsScraping(true);
    try {
      const response = await base44.functions.invoke('scrapeFlowerMenu', {
        url: vendor.url,
        vendor_name: vendor.name,
        category: 'flower',
        default_price: vendor.defaultPrice / 4 // Convert QP price to per unit
      });

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
        toast.success(`Scraped ${response.data.scraped} products, imported ${response.data.imported} new items`);
      }
    } catch (error) {
      toast.error('Failed to scrape menu: ' + error.message);
    } finally {
      setIsScraping(false);
    }
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['vendor-orders', selectedVendor],
    queryFn: async () => {
      const all = await base44.entities.VendorOrder.list('-created_date');
      return all.filter(o => o.vendor_name === selectedVendor);
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => base44.entities.VendorOrder.create(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      setCart([]);
      setNotes('');
      toast.success('Order created successfully');
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id) => base44.entities.VendorOrder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      toast.success('Order deleted');
    }
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.VendorProduct.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setIsAddProductOpen(false);
      setProductForm({});
      toast.success('Product added');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VendorProduct.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setEditingProduct(null);
      setProductForm({});
      toast.success('Product updated');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.VendorProduct.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Product deleted');
    }
  });

  const bulkUpdatePricesMutation = useMutation({
    mutationFn: async ({ productIds, changeType, value }) => {
      for (const id of productIds) {
        const product = products.find(p => p.id === id);
        if (product) {
          let newPrice = product.price;
          if (changeType === 'set') {
            newPrice = parseFloat(value);
          } else if (changeType === 'increase') {
            newPrice = product.price + parseFloat(value);
          } else if (changeType === 'decrease') {
            newPrice = Math.max(0, product.price - parseFloat(value));
          } else if (changeType === 'percent') {
            newPrice = product.price * (1 + parseFloat(value) / 100);
          }
          await base44.entities.VendorProduct.update(id, { price: newPrice });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setSelectedProducts([]);
      setIsBulkEditOpen(false);
      toast.success('Prices updated');
    }
  });

  const globalUpdatePricesMutation = useMutation({
    mutationFn: async ({ changeType, value }) => {
      for (const product of filteredProducts) {
        let newPrice = product.price;
        if (changeType === 'set') {
          newPrice = parseFloat(value);
        } else if (changeType === 'increase') {
          newPrice = product.price + parseFloat(value);
        } else if (changeType === 'decrease') {
          newPrice = Math.max(0, product.price - parseFloat(value));
        } else if (changeType === 'percent') {
          newPrice = product.price * (1 + parseFloat(value) / 100);
        }
        await base44.entities.VendorProduct.update(product.id, { price: newPrice });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setIsGlobalEditOpen(false);
      toast.success('All prices updated');
    }
  });

  const categories = [...new Set(products.map(p => p.category))];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery === '' || 
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variant?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  const addToCart = (product, buttonRef) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    const quantity = existingItem ? existingItem.quantity + 1 : 1;
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.product_name,
        variant: product.variant,
        quantity: 1,
        price: product.price
      }]);
    }

    // Animation: Show added item toast
    const itemId = Date.now();
    const itemName = product.variant ? `${product.product_name} - ${product.variant}` : product.product_name;
    setAddedItems(prev => [...prev, { id: itemId, name: itemName, quantity }]);
    setTimeout(() => {
      setAddedItems(prev => prev.filter(item => item.id !== itemId));
    }, 2000);

    // Flying animation to floating total
    if (buttonRef?.current && floatingTotalRef?.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const totalRect = floatingTotalRef.current.getBoundingClientRect();
      
      setFloatingItemAnim({
        id: itemId,
        startX: buttonRect.left,
        startY: buttonRect.top,
        endX: totalRect.left + totalRect.width / 2,
        endY: totalRect.top + totalRect.height / 2,
        name: itemName
      });
      
      setTimeout(() => setFloatingItemAnim(null), 800);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      setCart(cart.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
    toast.success('Removed from order');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = () => {
    if (cart.length === 0) {
      toast.error('Add items to your order first');
      return;
    }

    const orderData = {
      vendor_name: selectedVendor,
      order_date: new Date().toISOString().split('T')[0],
      items: cart,
      subtotal: calculateTotal(),
      total: calculateTotal(),
      notes,
      status: 'draft'
    };

    createOrderMutation.mutate(orderData);
  };

  const exportToPDF = (order) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Vendor Order Form', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Vendor: ${order.vendor_name}`, 20, 35);
    doc.text(`Order Date: ${format(new Date(order.order_date), 'MMM d, yyyy')}`, 20, 42);
    doc.text(`Order ID: ${order.id.slice(0, 8).toUpperCase()}`, 20, 49);
    
    // Line
    doc.line(20, 55, 190, 55);
    
    // Table headers
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Item', 20, 65);
    doc.text('Qty', 120, 65);
    doc.text('Price', 145, 65);
    doc.text('Total', 170, 65);
    
    doc.line(20, 68, 190, 68);
    
    // Items
    doc.setFont(undefined, 'normal');
    let y = 78;
    order.items.forEach((item, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      const itemName = item.variant 
        ? `${item.product_name} - ${item.variant}` 
        : item.product_name;
      
      doc.text(itemName.substring(0, 50), 20, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`$${item.price.toFixed(2)}`, 145, y);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 170, y);
      y += 7;
    });
    
    // Total
    y += 10;
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text(`Total: $${order.total.toFixed(2)}`, 145, y);
    
    // Notes
    if (order.notes) {
      y += 15;
      doc.setFontSize(10);
      doc.text('Notes:', 20, y);
      y += 7;
      doc.setFont(undefined, 'normal');
      const splitNotes = doc.splitTextToSize(order.notes, 170);
      doc.text(splitNotes, 20, y);
    }
    
    doc.save(`vendor-order-${order.id.slice(0, 8)}.pdf`);
    toast.success('PDF downloaded');
  };

  const total = calculateTotal();

  // Stats for widgets
  const totalProducts = products.length;
  const avgPrice = products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;
  const categoriesCount = categories.length;
  const totalOrderValue = orders.reduce((sum, o) => sum + o.total, 0);
  const ordersCount = orders.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-2 sm:p-4 lg:p-8 pb-96 overflow-x-hidden max-w-full">
      {/* Freeze Overlay when dragging */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sticky Footer with Total */}
      <div ref={floatingTotalRef} className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t-2 border-emerald-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600">Order Total</p>
                <p className="text-base sm:text-xl font-bold text-emerald-600">${total.toFixed(2)}</p>
              </div>
              {cart.length > 0 && (
                <Badge className="bg-emerald-600 text-white text-xs">{cart.length}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flying Item Animation */}
      <AnimatePresence>
        {floatingItemAnim && (
          <motion.div
            initial={{
              position: 'fixed',
              left: floatingItemAnim.startX,
              top: floatingItemAnim.startY,
              scale: 1,
              opacity: 1,
              zIndex: 9999
            }}
            animate={{
              left: floatingItemAnim.endX,
              top: floatingItemAnim.endY,
              scale: 0.3,
              opacity: 0
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="pointer-events-none"
          >
            <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold whitespace-nowrap">
              {floatingItemAnim.name}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Added Items Toasts */}
      <div className="fixed top-24 right-4 z-40 space-y-2">
        <AnimatePresence>
          {addedItems.map(item => (
            <motion.div
              key={item.id}
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
            >
              <Plus className="w-5 h-5" />
              <div>
                <p className="font-bold">Added {item.quantity}x</p>
                <p className="text-sm opacity-90">{item.name}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto pt-4 sm:pt-6 w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900">Vendor Orders</h1>
              <p className="text-sm text-emerald-600">Create orders for {selectedVendor}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {vendors.find(v => v.name === selectedVendor)?.url && (
                <Button 
                  onClick={() => handleScrapeMenu(vendors.find(v => v.name === selectedVendor))} 
                  disabled={isScraping}
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isScraping ? 'animate-spin' : ''}`} />
                  {isScraping ? 'Scraping...' : 'Refresh Menu'}
                </Button>
              )}
              <Button onClick={() => setIsAddProductOpen(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
              <Button onClick={() => setIsAddVendorOpen(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
              {selectedProducts.length > 0 && (
                <Button onClick={() => setIsBulkEditOpen(true)} variant="outline" size="sm">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Edit {selectedProducts.length} Prices
                </Button>
              )}
              <Button onClick={() => setIsGlobalEditOpen(true)} variant="outline" size="sm">
                <DollarSign className="w-4 h-4 mr-2" />
                Global Price Edit
              </Button>
              <Button onClick={async () => {
                if (!confirm('Remove all duplicate products? This will keep only one copy of each product.')) return;
                try {
                  const all = await base44.entities.VendorProduct.list();
                  const vendorProducts = all.filter(p => p.vendor_name === selectedVendor);
                  const seen = new Map();
                  const duplicates = [];
                  
                  vendorProducts.forEach(product => {
                    const key = `${product.product_name}-${product.variant || ''}-${product.category}-${product.size || ''}`;
                    if (seen.has(key)) {
                      duplicates.push(product.id);
                    } else {
                      seen.set(key, product);
                    }
                  });
                  
                  if (duplicates.length === 0) {
                    toast.info('No duplicates found for this vendor');
                    return;
                  }
                  
                  for (const id of duplicates) {
                    await base44.entities.VendorProduct.update(id, { is_active: false });
                  }
                  
                  queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
                  toast.success(`Removed ${duplicates.length} duplicate products`);
                } catch (error) {
                  toast.error('Failed to remove duplicates: ' + error.message);
                }
              }} variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Duplicates
              </Button>
              <Button onClick={() => setIsOrdersOpen(true)} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                View Orders
              </Button>
            </div>
          </div>

          {/* Vendor Tabs */}
          <Tabs value={selectedVendor} onValueChange={setSelectedVendor} className="w-full">
            <TabsList className="grid grid-cols-3 w-full gap-1 h-auto">
              {vendors.map(vendor => (
                <TabsTrigger key={vendor.name} value={vendor.name} className="text-xs sm:text-sm">
                  {vendor.name.includes('LA Bulk') ? vendor.name.replace('LA Bulk - ', '') : vendor.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Live Stats Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSearchQuery('')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Products</p>
                    <p className="text-2xl font-bold text-emerald-900">{totalProducts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedCategory('all')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Grid3x3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Categories</p>
                    <p className="text-2xl font-bold text-blue-900">{categoriesCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsOrdersOpen(true)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-purple-900">{ordersCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsCarlOpen(true)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Ask Carl</p>
                    <p className="text-sm font-bold text-purple-900">AI Advisor</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Product Catalog */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                  <Collapsible 
                    key={category} 
                    open={expandedCategories[category] === true}
                    onOpenChange={(isOpen) => setExpandedCategories(prev => ({ ...prev, [category]: isOpen }))}
                  >
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="hover:bg-emerald-50/50 transition-colors cursor-pointer">
                          <CardTitle className="flex items-center justify-between text-emerald-900">
                            <div className="flex items-center gap-2">
                              <Package className="w-5 h-5" />
                              {category}
                              <Badge variant="outline">{categoryProducts.length}</Badge>
                            </div>
                            <ChevronDown className={`w-5 h-5 transition-transform ${expandedCategories[category] !== false ? 'rotate-180' : ''}`} />
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-3 p-3' : 'space-y-2 p-3'}>
                          {categoryProducts.map(product => (
                            viewMode === 'list' ? (
                              <div key={product.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <Checkbox
                                  checked={selectedProducts.includes(product.id)}
                                  onCheckedChange={(checked) => {
                                    setSelectedProducts(checked 
                                      ? [...selectedProducts, product.id]
                                      : selectedProducts.filter(id => id !== product.id)
                                    );
                                  }}
                                />
                                {product.image_url && (
                                  <img src={product.image_url} alt={product.product_name} className="w-16 h-16 object-cover rounded flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-gray-900">{product.product_name}</p>
                                  {product.variant && (
                                    <p className="text-xs text-gray-600">{product.variant}</p>
                                  )}
                                  {product.size && (
                                    <p className="text-xs text-gray-500">{product.size}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className="text-right">
                                    <p className="font-bold text-lg text-emerald-600">${product.price.toFixed(2)}</p>
                                  </div>
                                  <Button 
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setProductForm(product);
                                    }}
                                    className="h-9 w-9"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    onClick={(e) => {
                                      addToCart(product, { current: e.currentTarget });
                                    }} 
                                    size="icon"
                                    className="bg-emerald-600 h-9 w-9"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="relative">
                                  <Checkbox
                                    checked={selectedProducts.includes(product.id)}
                                    onCheckedChange={(checked) => {
                                      setSelectedProducts(checked 
                                        ? [...selectedProducts, product.id]
                                        : selectedProducts.filter(id => id !== product.id)
                                      );
                                    }}
                                    className="absolute top-2 left-2 z-10 bg-white"
                                  />
                                  {product.image_url ? (
                                    <img src={product.image_url} alt={product.product_name} className="w-full h-32 object-cover" />
                                  ) : (
                                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                                      <Package className="w-12 h-12 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <CardContent className="p-3">
                                  <p className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{product.product_name}</p>
                                  {product.variant && (
                                    <p className="text-xs text-gray-600 mb-2">{product.variant}</p>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-lg text-emerald-600">${product.price.toFixed(2)}</p>
                                    <div className="flex gap-1">
                                      <Button 
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingProduct(product);
                                          setProductForm(product);
                                        }}
                                        className="h-8 w-8"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        onClick={(e) => {
                                          addToCart(product, { current: e.currentTarget });
                                        }} 
                                        size="icon"
                                        className="bg-emerald-600 h-8 w-8"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          ))}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>

          {/* Order Cart */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Current Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No items added yet</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.product_id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{item.product_name}</p>
                              {item.variant && (
                                <p className="text-xs text-gray-600">{item.variant}</p>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeFromCart(item.product_id)}
                              className="h-6 w-6 text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                className="h-7 w-7"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                className="h-7 w-7"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="font-bold text-emerald-600">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <Label>Order Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes for this order..."
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-emerald-900">Total</span>
                        <span className="text-2xl font-bold text-emerald-600">${total.toFixed(2)}</span>
                      </div>
                      <Button
                        onClick={handleCreateOrder}
                        disabled={createOrderMutation.isPending}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500"
                      >
                        {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddProductOpen || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setIsAddProductOpen(false);
          setEditingProduct(null);
          setProductForm({});
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={productForm.product_name || ''}
                onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label>Category *</Label>
              <div className="flex gap-2">
                <Select
                  value={productForm.category || ''}
                  onValueChange={(value) => setProductForm({ ...productForm, category: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flower">Flower</SelectItem>
                    <SelectItem value="edibles">Edibles</SelectItem>
                    <SelectItem value="vapes">Vapes</SelectItem>
                    <SelectItem value="pre-rolls">Pre-Rolls</SelectItem>
                    <SelectItem value="concentrates">Concentrates</SelectItem>
                    <SelectItem value="tinctures">Tinctures</SelectItem>
                    <SelectItem value="topicals">Topicals</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!productForm.product_name) {
                      toast.error('Enter product name first');
                      return;
                    }
                    try {
                      const result = await base44.integrations.Core.InvokeLLM({
                        prompt: `Categorize this cannabis product into ONE category: "${productForm.product_name}". Categories: flower, edibles, vapes, pre-rolls, concentrates, tinctures, topicals, accessories. Return ONLY the category name, nothing else.`,
                        response_json_schema: {
                          type: "object",
                          properties: {
                            category: { type: "string" }
                          }
                        }
                      });
                      setProductForm({ ...productForm, category: result.category });
                      toast.success('Category suggested');
                    } catch (error) {
                      toast.error('AI categorization failed');
                    }
                  }}
                  className="px-3"
                >
                  AI
                </Button>
              </div>
            </div>
            <div>
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.price || ''}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value ? parseFloat(e.target.value) : '' })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Variant</Label>
              <Input
                value={productForm.variant || ''}
                onChange={(e) => setProductForm({ ...productForm, variant: e.target.value })}
                placeholder="Optional variant"
              />
            </div>
            <div>
              <Label>Size</Label>
              <Input
                value={productForm.size || ''}
                onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                placeholder="Optional size"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={productForm.image_url || ''}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              {editingProduct && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Delete this product?')) {
                      deleteProductMutation.mutate(editingProduct.id);
                      setEditingProduct(null);
                      setProductForm({});
                    }
                  }}
                >
                  Delete
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddProductOpen(false);
                  setEditingProduct(null);
                  setProductForm({});
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!productForm.product_name || !productForm.category || productForm.price === '' || productForm.price === undefined) {
                    toast.error('Please fill required fields');
                    return;
                  }
                  const dataToSave = {
                    ...productForm,
                    price: typeof productForm.price === 'string' ? parseFloat(productForm.price) : productForm.price
                  };
                  if (editingProduct) {
                    updateProductMutation.mutate({
                      id: editingProduct.id,
                      data: dataToSave
                    });
                  } else {
                    createProductMutation.mutate({
                      ...dataToSave,
                      vendor_name: selectedVendor,
                      is_active: true
                    });
                  }
                }}
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="flex-1 bg-emerald-600"
              >
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor Tab</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Vendor Name *</Label>
              <Input
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                placeholder="Enter vendor name"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={vendorForm.type} onValueChange={(v) => setVendorForm({ ...vendorForm, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flower">Flower</SelectItem>
                  <SelectItem value="edibles">Edibles</SelectItem>
                  <SelectItem value="concentrates">Concentrates</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Menu URL (Optional)</Label>
              <Input
                value={vendorForm.url}
                onChange={(e) => setVendorForm({ ...vendorForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Default Price (Optional)</Label>
              <Input
                type="number"
                step="0.01"
                value={vendorForm.defaultPrice}
                onChange={(e) => setVendorForm({ ...vendorForm, defaultPrice: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAddVendorOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!vendorForm.name) {
                    toast.error('Please enter vendor name');
                    return;
                  }
                  setSelectedVendor(vendorForm.name);
                  setIsAddVendorOpen(false);
                  setVendorForm({ name: '', type: 'flower', url: '', defaultPrice: 0 });
                  toast.success('Vendor tab added - now add products to it');
                }}
                className="flex-1 bg-emerald-600"
              >
                Add Vendor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Price Edit Dialog */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {selectedProducts.length} Product Prices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Change Type</Label>
              <Select value={bulkPriceChange.type} onValueChange={(v) => setBulkPriceChange({ ...bulkPriceChange, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to specific price</SelectItem>
                  <SelectItem value="increase">Increase by amount</SelectItem>
                  <SelectItem value="decrease">Decrease by amount</SelectItem>
                  <SelectItem value="percent">Adjust by percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {bulkPriceChange.type === 'percent' ? 'Percentage (%)' : 'Amount ($)'}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={bulkPriceChange.value}
                onChange={(e) => setBulkPriceChange({ ...bulkPriceChange, value: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsBulkEditOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  bulkUpdatePricesMutation.mutate({
                    productIds: selectedProducts,
                    changeType: bulkPriceChange.type,
                    value: bulkPriceChange.value
                  });
                }}
                disabled={bulkUpdatePricesMutation.isPending}
                className="flex-1 bg-emerald-600"
              >
                Update Prices
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Price Edit Dialog */}
      <Dialog open={isGlobalEditOpen} onOpenChange={setIsGlobalEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Global Price Edit - {selectedVendor}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              This will update ALL {filteredProducts.length} products in the current view
            </p>
            <div>
              <Label>Change Type</Label>
              <Select value={globalPriceChange.type} onValueChange={(v) => setGlobalPriceChange({ ...globalPriceChange, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to specific price</SelectItem>
                  <SelectItem value="increase">Increase by amount</SelectItem>
                  <SelectItem value="decrease">Decrease by amount</SelectItem>
                  <SelectItem value="percent">Adjust by percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {globalPriceChange.type === 'percent' ? 'Percentage (%)' : 'Amount ($)'}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={globalPriceChange.value}
                onChange={(e) => setGlobalPriceChange({ ...globalPriceChange, value: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsGlobalEditOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (confirm(`Update ALL ${filteredProducts.length} product prices?`)) {
                    globalUpdatePricesMutation.mutate({
                      changeType: globalPriceChange.type,
                      value: globalPriceChange.value
                    });
                  }
                }}
                disabled={globalUpdatePricesMutation.isPending}
                className="flex-1 bg-emerald-600"
              >
                Update All Prices
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tracking Map Modal */}
      {trackingOrder && (
        <VendorOrderMap
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}

      {/* Carl AI Chat */}
      <CarlChat
        isOpen={isCarlOpen}
        onClose={() => setIsCarlOpen(false)}
      />

      {/* Orders Dialog */}
      <Dialog open={isOrdersOpen} onOpenChange={setIsOrdersOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order History - {selectedVendor}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No orders yet</p>
              </div>
            ) : (
              orders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.order_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge>{order.status}</Badge>
                        <Button
                          size="sm"
                          onClick={() => setTrackingOrder(order)}
                          className="bg-emerald-600"
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          Track
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => exportToPDF(order)}
                          className="bg-blue-600"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Delete this order?')) {
                              deleteOrderMutation.mutate(order.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}× {item.product_name}
                            {item.variant && ` - ${item.variant}`}
                          </span>
                          <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                        <strong>Notes:</strong> {order.notes}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="font-bold">Total</span>
                      <span className="text-xl font-bold text-emerald-600">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}