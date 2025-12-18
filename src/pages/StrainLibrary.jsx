import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Leaf, Sparkles, Heart, Brain, Smile, Wind, ChevronRight, Loader2, Edit2, Grid2X2, Rows, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';
import StrainEditModal from '@/components/strain/StrainEditModal';
import { useMutation } from '@tanstack/react-query';

const strainColors = {
  indica: 'from-purple-400 to-indigo-500',
  sativa: 'from-orange-400 to-amber-500',
  hybrid: 'from-emerald-400 to-green-500',
  cbd: 'from-blue-400 to-cyan-500'
};

const effectIcons = {
  'Relaxed': Smile,
  'Happy': Heart,
  'Euphoric': Sparkles,
  'Uplifted': Wind,
  'Focused': Brain,
  'Creative': Sparkles,
  'Energetic': Wind,
  'Sleepy': Smile
};

export default function StrainLibrary() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStrain, setSelectedStrain] = useState(null);
  const [editingStrain, setEditingStrain] = useState(null);
  const [aiSearch, setAiSearch] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [batchCount, setBatchCount] = useState(10);
  const [viewMode, setViewMode] = useState('grid2x2'); // grid2x2, grid1x1, carousel
  const [confirmationModal, setConfirmationModal] = useState(null); // { names: [], mode: '' }
  const [selectedStrains, setSelectedStrains] = useState([]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });

  const { data: strains = [], isLoading } = useQuery({
    queryKey: ['strains'],
    queryFn: () => base44.entities.Strain.list()
  });

  // Redirect non-admins
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = createPageUrl('Home');
    }
  }, [user]);

  const filteredStrains = strains.filter(strain => {
    const matchesSearch = strain.name?.toLowerCase().includes(search.toLowerCase()) ||
                         strain.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || strain.type === selectedType;
    return matchesSearch && matchesType;
  });

  const popularStrains = strains.filter(s => s.popular).slice(0, 3);

  const handleAiDiscover = async (mode = 'single') => {
    if (mode === 'single' && !aiSearch.trim()) {
      toast.error('Please enter strain name(s)');
      return;
    }

    setIsDiscovering(true);
    try {
      let payload;
      
      if (mode === 'surprise' || mode === 'teachme') {
        // First get suggestions
        toast.info(`Finding ${batchCount} ${mode === 'teachme' ? 'educational' : 'interesting'} strains...`);
        const suggestResponse = await base44.functions.invoke('discoverStrain', {
          mode,
          count: batchCount
        });
        
        if (!suggestResponse.data.success || !suggestResponse.data.strainNames?.length) {
          toast.error('No new strains found');
          setIsDiscovering(false);
          return;
        }
        
        toast.success(`Found ${suggestResponse.data.strainNames.length} strains to discover!`);
        payload = { strainNames: suggestResponse.data.strainNames };
      } else {
        // Parse comma-separated strain names
        const names = aiSearch.split(',').map(n => n.trim()).filter(Boolean);
        if (names.length > 20) {
          toast.error('Maximum 20 strains at a time');
          setIsDiscovering(false);
          return;
        }
        payload = { strainNames: names };
      }

      toast.info('Discovering strains... This may take a minute.');
      const response = await base44.functions.invoke('discoverStrain', payload);

      if (response.data.needsConfirmation && response.data.needsConfirmation.length > 0) {
        setConfirmationModal({
          names: response.data.needsConfirmation,
          payload: payload,
          mode: mode
        });
        setIsDiscovering(false);
        return;
      }

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['strains'] });
        setAiSearch('');
        
        const { new: newCount, existing, failed } = response.data;
        toast.success(`Added ${newCount} new strains! (${existing} already existed, ${failed} failed)`);
      } else {
        toast.error(response.data.error || 'Discovery failed');
      }
    } catch (error) {
      console.error('Discovery error:', error);
      toast.error('Failed to discover strains');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleConfirmFictional = async () => {
    setIsDiscovering(true);
    try {
      const payload = { ...confirmationModal.payload, allowFictional: true };
      toast.info('Creating fictional strains...');
      const response = await base44.functions.invoke('discoverStrain', payload);

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['strains'] });
        setAiSearch('');
        const { new: newCount, existing, failed } = response.data;
        toast.success(`Added ${newCount} new strains! (${existing} already existed, ${failed} failed)`);
      } else {
        toast.error(response.data.error || 'Creation failed');
      }
    } catch (error) {
      console.error('Creation error:', error);
      toast.error('Failed to create strains');
    } finally {
      setConfirmationModal(null);
      setIsDiscovering(false);
    }
  };

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }) => {
      for (const id of ids) {
        await base44.entities.Strain.update(id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strains'] });
      setSelectedStrains([]);
      toast.success('Strains updated');
    }
  });

  const toggleStrainSelection = (strainId) => {
    setSelectedStrains(prev => 
      prev.includes(strainId) 
        ? prev.filter(id => id !== strainId)
        : [...prev, strainId]
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-emerald-900 mb-2">Access Denied</h1>
          <p className="text-emerald-600">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-24 pb-32 px-4 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Leaf className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-emerald-900">Strain Library</h1>
          </div>
          <p className="text-emerald-600 text-lg">Explore our comprehensive cannabis strain database</p>
        </motion.div>

        {/* Stats Widgets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-emerald-200">
            <p className="text-sm text-emerald-600 mb-1">Total Strains</p>
            <p className="text-3xl font-bold text-emerald-900">{strains.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white border border-purple-300">
            <p className="text-sm text-purple-100 mb-1">Indica</p>
            <p className="text-3xl font-bold">{strains.filter(s => s.type === 'indica').length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white border border-orange-300">
            <p className="text-sm text-orange-100 mb-1">Sativa</p>
            <p className="text-3xl font-bold">{strains.filter(s => s.type === 'sativa').length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white border border-emerald-300">
            <p className="text-sm text-emerald-100 mb-1">Hybrid</p>
            <p className="text-3xl font-bold">{strains.filter(s => s.type === 'hybrid').length}</p>
          </div>
        </motion.div>

        {/* Popular Strains Banner */}
        {popularStrains.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Popular Strains
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {popularStrains.map((strain, i) => (
                <motion.div
                  key={strain.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  onClick={() => setSelectedStrain(strain)}
                  className="cursor-pointer"
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow bg-white/80 backdrop-blur border-2 border-emerald-200 hover:border-emerald-400">
                    <div className="h-32 relative">
                      <img 
                        src={strain.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400'} 
                        alt={strain.name}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-2 right-2 px-3 py-1 rounded-full bg-gradient-to-r ${strainColors[strain.type]} text-white text-xs font-bold`}>
                        {strain.type}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-emerald-900 mb-2">{strain.name}</h3>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="border-emerald-300">
                          THC {strain.thc_min}-{strain.thc_max}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Discovery Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-300/50 backdrop-blur">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-900">AI Strain Discovery</h3>
            </div>
            <p className="text-sm text-purple-700 mb-4">
              Enter strain name(s) separated by commas (max 20), or let AI surprise you with new strains!
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter strain name(s) or use buttons below..."
                  value={aiSearch}
                  onChange={(e) => setAiSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiDiscover('single')}
                  className="flex-1 bg-white border-purple-300 focus:border-purple-500"
                  disabled={isDiscovering}
                />
                <Button 
                  onClick={() => handleAiDiscover('single')}
                  disabled={isDiscovering || !aiSearch.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isDiscovering ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Discover
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleAiDiscover('teachme')}
                  disabled={isDiscovering}
                  variant="outline"
                  className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Teach Me ({batchCount})
                </Button>
                <Button
                  onClick={() => handleAiDiscover('surprise')}
                  disabled={isDiscovering}
                  variant="outline"
                  className="flex-1 border-pink-300 text-pink-700 hover:bg-pink-50"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Surprise Me ({batchCount})
                </Button>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={batchCount}
                  onChange={(e) => setBatchCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 10)))}
                  className="w-20 border-purple-300"
                  disabled={isDiscovering}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bulk Actions */}
        {selectedStrains.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex gap-2"
          >
            <Button
              size="sm"
              onClick={() => bulkUpdateMutation.mutate({ ids: selectedStrains, data: { popular: true } })}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark Popular ({selectedStrains.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkUpdateMutation.mutate({ ids: selectedStrains, data: { popular: false } })}
            >
              Unmark Popular ({selectedStrains.length})
            </Button>
          </motion.div>
        )}

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 space-y-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
            <Input
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-white/80 backdrop-blur border-emerald-200 focus:border-emerald-400"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
              {['all', 'indica', 'sativa', 'hybrid', 'cbd'].map(type => (
                <Button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  variant={selectedType === type ? 'default' : 'outline'}
                  className={selectedType === type ? `bg-gradient-to-r ${strainColors[type] || 'from-emerald-500 to-green-500'}` : ''}
                  size="sm"
                >
                  {type === 'all' ? 'All Strains' : type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 border border-emerald-200 rounded-lg p-1 bg-white/60">
              <Button
                size="icon"
                variant={viewMode === 'grid2x2' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid2x2')}
                className="h-8 w-8"
              >
                <Grid2X2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === 'grid1x1' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid1x1')}
                className="h-8 w-8"
              >
                <Rows className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === 'carousel' ? 'default' : 'ghost'}
                onClick={() => setViewMode('carousel')}
                className="h-8 w-8"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Strain Display */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filteredStrains.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-emerald-600">No strains found.</p>
          </div>
        ) : viewMode === 'carousel' ? (
          <div className="space-y-8">
            {['indica', 'sativa', 'hybrid', 'cbd'].map(type => {
              const typeStrains = strains.filter(s => s.type === type && (selectedType === 'all' || selectedType === type));
              if (typeStrains.length === 0) return null;
              return (
                <div key={type}>
                  <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${strainColors[type]}`} />
                    {type.charAt(0).toUpperCase() + type.slice(1)} Strains
                  </h2>
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                    {typeStrains.map(strain => (
                      <Card key={strain.id} className="min-w-[280px] overflow-hidden hover:shadow-lg transition-all bg-white/60 backdrop-blur border border-emerald-200 hover:border-emerald-400 cursor-pointer" onClick={() => setSelectedStrain(strain)}>
                        <div className="h-32 relative">
                          <img 
                            src={strain.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=300'} 
                            alt={strain.name}
                            className="w-full h-full object-cover"
                          />
                          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full bg-gradient-to-r ${strainColors[strain.type]} text-white text-xs font-bold`}>
                            {strain.type}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStrain(strain);
                            }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
                          >
                            <Edit2 className="w-4 h-4 text-emerald-600" />
                          </button>
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-bold text-emerald-900 mb-1 text-sm">{strain.name}</h3>
                          <Badge variant="outline" className="text-xs border-emerald-300">
                            THC {strain.thc_min}-{strain.thc_max}%
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={viewMode === 'grid2x2' ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4'}>
            {filteredStrains.map((strain, i) => (
              <motion.div
                key={strain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative"
              >
                <input
                  type="checkbox"
                  checked={selectedStrains.includes(strain.id)}
                  onChange={() => toggleStrainSelection(strain.id)}
                  className="absolute top-3 left-3 w-5 h-5 z-10 cursor-pointer text-green-600 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <Card className="overflow-hidden hover:shadow-lg transition-all bg-white/60 backdrop-blur border border-emerald-200 hover:border-emerald-400 cursor-pointer" onClick={() => setSelectedStrain(strain)}>
                  <div className={viewMode === 'grid2x2' ? 'h-32' : 'h-48'} className="relative">
                    <img 
                      src={strain.image_url || 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=300'} 
                      alt={strain.name}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full bg-gradient-to-r ${strainColors[strain.type]} text-white text-xs font-bold`}>
                      {strain.type}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStrain(strain);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
                    >
                      <Edit2 className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-emerald-900 mb-2">{strain.name}</h3>
                    {viewMode === 'grid1x1' && <p className="text-xs text-emerald-600 mb-3 line-clamp-2">{strain.description}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs border-emerald-300">
                          THC {strain.thc_min}-{strain.thc_max}%
                        </Badge>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <StrainEditModal
        strain={editingStrain}
        isOpen={!!editingStrain}
        onClose={() => setEditingStrain(null)}
      />

      {/* Confirmation Modal */}
      <Dialog open={!!confirmationModal} onOpenChange={() => setConfirmationModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Strains Not Found Online</DialogTitle>
            <DialogDescription>
              The following strains were not found in online databases. Would you like to create them as fictional strains?
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm font-semibold text-yellow-900 mb-2">Not Found:</p>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {confirmationModal?.names.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmationModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmFictional} disabled={isDiscovering}>
              {isDiscovering ? 'Creating...' : 'Create as Fictional'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Strain Detail Modal */}
      <Dialog open={!!selectedStrain} onOpenChange={() => setSelectedStrain(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur">
          {selectedStrain && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${strainColors[selectedStrain.type]} flex items-center justify-center shadow-lg`}>
                    <Leaf className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedStrain.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`bg-gradient-to-r ${strainColors[selectedStrain.type]} text-white`}>
                        {selectedStrain.type}
                      </Badge>
                      {selectedStrain.popular && (
                        <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingStrain(selectedStrain);
                      setSelectedStrain(null);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {selectedStrain.image_url && (
                  <img 
                    src={selectedStrain.image_url} 
                    alt={selectedStrain.name}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                )}

                <div>
                  <h3 className="font-bold text-emerald-900 mb-2">Description</h3>
                  <p className="text-emerald-700">{selectedStrain.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-xs text-emerald-600 mb-1">THC Content</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {selectedStrain.thc_min}-{selectedStrain.thc_max}%
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">CBD Content</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedStrain.cbd_min}-{selectedStrain.cbd_max}%
                    </p>
                  </div>
                </div>

                {selectedStrain.genetics && (
                  <div>
                    <h3 className="font-bold text-emerald-900 mb-2">Genetics</h3>
                    <p className="text-emerald-700">{selectedStrain.genetics}</p>
                  </div>
                )}

                {selectedStrain.effects?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-emerald-900 mb-3">Effects</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedStrain.effects.map((effect, i) => {
                        const Icon = effectIcons[effect] || Sparkles;
                        return (
                          <Badge key={i} variant="outline" className="border-purple-300 text-purple-700 px-3 py-1">
                            <Icon className="w-3 h-3 mr-1" />
                            {effect}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedStrain.flavors?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-emerald-900 mb-3">Flavors</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedStrain.flavors.map((flavor, i) => (
                        <Badge key={i} variant="outline" className="border-amber-300 text-amber-700">
                          {flavor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStrain.medical_uses?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-emerald-900 mb-3">Medical Uses</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedStrain.medical_uses.map((use, i) => (
                        <Badge key={i} variant="outline" className="border-green-300 text-green-700">
                          {use}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStrain.flowering_time && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold text-emerald-900 mb-2">Flowering Time</h3>
                      <p className="text-emerald-700">{selectedStrain.flowering_time}</p>
                    </div>
                    {selectedStrain.growing_difficulty && (
                      <div>
                        <h3 className="font-bold text-emerald-900 mb-2">Growing Difficulty</h3>
                        <Badge className={
                          selectedStrain.growing_difficulty === 'easy' ? 'bg-green-500' :
                          selectedStrain.growing_difficulty === 'moderate' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }>
                          {selectedStrain.growing_difficulty}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}