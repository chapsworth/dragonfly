import React, { useState } from 'react';
import { useRadio } from '@/components/radio/RadioContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Radio as RadioIcon, Search, Music, Mic2, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const californiaStations = [
  {
    id: 1,
    name: "KCRW 89.9 FM",
    location: "Santa Monica, CA",
    genre: "Eclectic, NPR",
    stream_url: "https://kcrw.streamguys1.com/kcrw_192k_mp3_on_air",
    frequency: "89.9 FM",
    description: "Award-winning music, news, and culture",
    color: "from-blue-400 to-cyan-500"
  },
  {
    id: 2,
    name: "KROQ 106.7 FM",
    location: "Los Angeles, CA",
    genre: "Alternative Rock",
    stream_url: "https://stream.revma.ihrhls.com/zc201",
    frequency: "106.7 FM",
    description: "LA's legendary rock station",
    color: "from-red-400 to-orange-500"
  },
  {
    id: 3,
    name: "KPFA 94.1 FM",
    location: "Berkeley, CA",
    genre: "Public Radio, News",
    stream_url: "https://streams.kpfa.org:8000/kpfa-128-mp3",
    frequency: "94.1 FM",
    description: "Free speech radio",
    color: "from-green-400 to-emerald-500"
  },
  {
    id: 4,
    name: "The Sound 100.3 FM",
    location: "Los Angeles, CA",
    genre: "Classic Rock",
    stream_url: "https://stream.revma.ihrhls.com/zc6932",
    frequency: "100.3 FM",
    description: "Where LA listens to real rock",
    color: "from-amber-400 to-yellow-500"
  },
  {
    id: 5,
    name: "KCSN 88.5 FM",
    location: "Northridge, CA",
    genre: "Americana, Roots",
    stream_url: "https://stream.kcsn.org/kcsn-128k",
    frequency: "88.5 FM",
    description: "88.5 FM and online - Americana, Roots Music",
    color: "from-purple-400 to-pink-500"
  },
  {
    id: 6,
    name: "KEXP 90.3 FM",
    location: "Seattle (San Francisco Relay)",
    genre: "Independent, Alternative",
    stream_url: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3",
    frequency: "90.3 FM",
    description: "Where the music matters",
    color: "from-indigo-400 to-purple-500"
  },
  {
    id: 7,
    name: "KPCC 89.3 FM",
    location: "Pasadena, CA",
    genre: "NPR, News & Talk",
    stream_url: "https://stream.scpr.org/kpcc",
    frequency: "89.3 FM",
    description: "Southern California's NPR Station",
    color: "from-teal-400 to-cyan-500"
  },
  {
    id: 8,
    name: "KCSM 91.1 FM",
    location: "San Mateo, CA",
    genre: "Jazz",
    stream_url: "https://ice5.securenetsystems.net/KCSM",
    frequency: "91.1 FM",
    description: "Bay Area's jazz station",
    color: "from-rose-400 to-red-500"
  }
];

const genres = ['All', 'Rock', 'Jazz', 'NPR', 'Alternative', 'Americana'];

export default function Radio() {
  const { currentStation, isPlaying, playStation } = useRadio();
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  const filteredStations = californiaStations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(search.toLowerCase()) ||
                         station.genre.toLowerCase().includes(search.toLowerCase()) ||
                         station.location.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || station.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 pt-28 px-4 pb-32">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <RadioIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              California Radio
            </h1>
          </div>
          <p className="text-purple-600 text-lg">
            Stream live radio from across the Golden State
          </p>
        </motion.div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <Input
              placeholder="Search stations, genres, or cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-2 border-purple-200 focus:border-purple-400"
            />
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={cn(
                  "px-4 py-2 rounded-full font-medium transition-all",
                  selectedGenre === genre
                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                    : "bg-white text-purple-600 hover:bg-purple-50 border-2 border-purple-200"
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((station, i) => {
            const isCurrentlyPlaying = currentStation?.id === station.id && isPlaying;
            
            return (
              <motion.div
                key={station.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-2",
                  isCurrentlyPlaying ? "border-purple-500 ring-4 ring-purple-200" : "border-purple-100"
                )}
              >
                {/* Gradient Badge */}
                <div className={cn(
                  "absolute top-6 right-6 w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md",
                  station.color
                )}>
                  {isCurrentlyPlaying ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Headphones className="w-6 h-6 text-white" />
                    </motion.div>
                  ) : (
                    <Music className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Station Info */}
                <div className="pr-16">
                  <Badge variant="outline" className="mb-3 text-xs">
                    {station.frequency}
                  </Badge>
                  <h3 className="text-xl font-bold text-purple-900 mb-1">
                    {station.name}
                  </h3>
                  <p className="text-purple-600 text-sm mb-2">{station.location}</p>
                  <p className="text-slate-600 text-sm mb-4">{station.description}</p>
                  
                  <Badge className={cn(
                    "bg-gradient-to-r text-white",
                    station.color
                  )}>
                    {station.genre}
                  </Badge>
                </div>

                {/* Play Button */}
                <Button
                  onClick={() => playStation(station)}
                  className={cn(
                    "w-full mt-4 h-12 rounded-xl font-semibold text-base transition-all",
                    isCurrentlyPlaying
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  )}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Now Playing
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Listen Now
                    </>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {filteredStations.length === 0 && (
          <div className="text-center py-20">
            <RadioIcon className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <p className="text-purple-600 text-lg">No stations found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}