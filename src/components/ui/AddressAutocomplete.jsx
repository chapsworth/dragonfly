import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function AddressAutocomplete({ value, onChange, placeholder, className, onPlaceSelect }) {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sessionToken] = useState(() => Math.random().toString(36).substring(7));
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = async (input) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('googlePlacesAutocomplete', {
        input,
        sessiontoken: sessionToken,
        types: 'address'
      });

      if (response.data.status === 'success') {
        setPredictions(response.data.predictions || []);
        setShowDropdown(true);
      } else {
        console.error('Autocomplete error:', response.data.details);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  const handleSelectPrediction = async (prediction) => {
    onChange(prediction.description);
    setShowDropdown(false);
    setPredictions([]);

    if (onPlaceSelect) {
      try {
        const response = await base44.functions.invoke('googlePlaceDetails', {
          place_id: prediction.place_id
        });

        if (response.data.status === 'success') {
          onPlaceSelect(response.data.details);
        }
      } catch (error) {
        console.error('Failed to fetch place details:', error);
      }
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder || "Start typing address..."}
          className={className}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <p className="text-sm text-gray-900">{prediction.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}