import React, { useState } from 'react';
import { useRadio } from './RadioContext';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, X, Volume2, VolumeX, Radio, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function RadioPlayer() {
  const { currentStation, isPlaying, volume, playStation, stop, changeVolume } = useRadio();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!currentStation) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          "fixed bottom-24 left-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-2xl border-2 border-purple-400/30 rounded-2xl",
          isMinimized ? "h-16" : "h-24"
        )}
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
              {!isMinimized && (
                <p className="text-purple-300 text-xs truncate">{currentStation.genre}</p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!isMinimized && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => changeVolume(volume > 0 ? 0 : 0.7)}
                  className="text-white hover:bg-white/20"
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
              </>
            )}

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
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20"
            >
              {isMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={stop}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}