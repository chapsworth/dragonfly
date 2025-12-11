import React, { useState } from 'react';
import { useRadio } from './RadioContext';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, X, Volume2, VolumeX, Radio, SkipForward, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const californiaStations = [
  { id: 1, name: "KCRW 89.9 FM", location: "Santa Monica, CA", genre: "Eclectic, NPR", stream_url: "https://kcrw.streamguys1.com/kcrw_192k_mp3_on_air" },
  { id: 2, name: "KROQ 106.7 FM", location: "Los Angeles, CA", genre: "Alternative Rock", stream_url: "https://stream.revma.ihrhls.com/zc201" },
  { id: 3, name: "KPFA 94.1 FM", location: "Berkeley, CA", genre: "Public Radio, News", stream_url: "https://streams.kpfa.org:8000/kpfa-128-mp3" },
  { id: 4, name: "The Sound 100.3 FM", location: "Los Angeles, CA", genre: "Classic Rock", stream_url: "https://stream.revma.ihrhls.com/zc6932" },
  { id: 5, name: "KCSN 88.5 FM", location: "Northridge, CA", genre: "Americana, Roots", stream_url: "https://stream.kcsn.org/kcsn-128k" },
  { id: 6, name: "KEXP 90.3 FM", location: "Seattle (San Francisco Relay)", genre: "Independent, Alternative", stream_url: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3" },
  { id: 7, name: "KPCC 89.3 FM", location: "Pasadena, CA", genre: "NPR, News & Talk", stream_url: "https://stream.scpr.org/kpcc" },
  { id: 8, name: "KCSM 91.1 FM", location: "San Mateo, CA", genre: "Jazz", stream_url: "https://ice5.securenetsystems.net/KCSM" }
];

export default function RadioPlayer() {
  const { currentStation, isPlaying, volume, isVisible, playStation, close, changeVolume } = useRadio();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!currentStation || !isVisible) return null;

  const skipToNext = () => {
    const currentIndex = californiaStations.findIndex(s => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % californiaStations.length;
    playStation(californiaStations[nextIndex]);
  };

  return (
    <AnimatePresence>
      {isMinimized ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="fixed bottom-24 left-4 z-50 w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-2xl border-2 border-purple-400/30 flex items-center justify-center cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              playStation(currentStation);
            }}
            className="text-white hover:bg-white/20 w-full h-full rounded-full"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-2xl border-2 border-purple-400/30 rounded-2xl h-24"
        >
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            {/* Station Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-bold text-sm truncate">{currentStation.name}</h3>
                <p className="text-purple-200 text-xs truncate">{currentStation.location}</p>
                <p className="text-purple-300 text-xs truncate">{currentStation.genre}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeVolume(volume > 0 ? 0 : 0.7)}
                className="text-white hover:bg-white/20 hidden sm:flex"
              >
                {volume > 0 ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <div className="w-24 hidden md:block">
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(v) => changeVolume(v[0] / 100)}
                  className="cursor-pointer"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => playStation(currentStation)}
                className="text-white hover:bg-white/20 w-12 h-12"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={skipToNext}
                className="text-white hover:bg-white/20"
                title="Skip to next station"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="text-white hover:bg-white/20"
                title="Minimize"
              >
                <Minimize2 className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                className="text-white hover:bg-white/20"
                title="Close"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}