import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Leaf, Sparkles, Heart, Brain, Smile, Wind, ChevronRight, Loader2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import StrainEditModal from '@/components/strain/StrainEditModal';

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
  const queryClient = useQueryClient();

  const { data: strains = [], isLoading } = useQuery({
    queryKey: ['strains'],
    queryFn: () => base44.entities.Strain.list()
  });

  const filteredStrains = strains.filter(strain => {
    const matchesSearch = strain.name?.toLowerCase().includes(search.toLowerCase()) ||
                         strain.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || strain.type === selectedType;
    return matchesSearch && matchesType;
  });

  const popularStrains = strains.filter(s => s.popular).slice(0, 3);

  const handleAiDiscover = async () => {
    if (!aiSearch.trim()) {
      toast.error('Please enter a strain name');
      return;
    }

    setIsDiscovering(true);
    try {
      const response = await base44.functions.invoke('discoverStrain', {
        strainName: aiSearch.trim()
      });

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['strains'] });
        setSelectedStrain(response.data.strain);
        setAiSearch('');
        
        if (response.data.isNew) {
          toast.success('New strain discovered and added to library!');
        } else {
          toast.info('Strain already exists in library');
        }
      } else {
        toast.error(response.data.error || 'Strain not found');
      }
    } catch (error) {
      console.error('Discovery error:', error);
      toast.error('Failed to discover strain. Please try again.');
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-24 pb-32 px-4">
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
              Search for any cannabis strain and let AI compile comprehensive information and images for you
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter strain name to discover..."
                value={aiSearch}
                onChange={(e) => setAiSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiDiscover()}
                className="flex-1 bg-white border-purple-300 focus:border-purple-500"
                disabled={isDiscovering}
              />
              <Button 
                onClick={handleAiDiscover}
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
          </div>
        </motion.div>

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

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
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
        </motion.div>

        {/* Strain Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filteredStrains.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-emerald-600">No strains found.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStrains.map((strain, i) => (
              <motion.div
                key={strain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all bg-white/60 backdrop-blur border border-emerald-200 hover:border-emerald-400 cursor-pointer" onClick={() => setSelectedStrain(strain)}>
                  <div className="h-40 relative">
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
                    <p className="text-xs text-emerald-600 mb-3 line-clamp-2">{strain.description}</p>
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