import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const RadioContext = createContext();

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within RadioProvider');
  }
  return context;
};

export function RadioProvider({ children }) {
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playStation = (station) => {
    if (audioRef.current) {
      if (currentStation?.id === station.id) {
        // Toggle play/pause for same station
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      } else {
        // Switch to new station
        audioRef.current.src = station.stream_url;
        audioRef.current.play();
        setCurrentStation(station);
        setIsPlaying(true);
      }
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <RadioContext.Provider
      value={{
        currentStation,
        isPlaying,
        volume,
        playStation,
        stop,
        changeVolume,
      }}
    >
      <audio ref={audioRef} />
      {children}
    </RadioContext.Provider>
  );
}