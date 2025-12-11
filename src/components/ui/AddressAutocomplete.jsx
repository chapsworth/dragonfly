import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyC4Lu7mjc3xzoD7rx2jMo1fqfYe3IN8J-I';

let scriptLoadPromise = null;

function loadGoogleMapsScript() {
  if (scriptLoadPromise) return scriptLoadPromise;
  
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export default function AddressAutocomplete({ value, onChange, placeholder, className, onPlaceSelect }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setIsReady(true))
      .catch(err => {
        console.error('Google Maps load error:', err);
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    if (!isReady || !inputRef.current || autocompleteRef.current) return;

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place.formatted_address) {
          onChange(place.formatted_address);
          
          if (onPlaceSelect) {
            const details = {
              address: place.formatted_address,
              lat: place.geometry?.location?.lat(),
              lng: place.geometry?.location?.lng(),
              place_id: place.place_id,
              city: place.address_components?.find(c => c.types.includes('locality'))?.long_name || '',
              state: place.address_components?.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '',
              zip: place.address_components?.find(c => c.types.includes('postal_code'))?.long_name || '',
              country: place.address_components?.find(c => c.types.includes('country'))?.long_name || ''
            };
            onPlaceSelect(details);
          }
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (err) {
      console.error('Autocomplete init error:', err);
      setError(err.message);
    }
  }, [isReady, onChange, onPlaceSelect]);

  if (error) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Enter address"}
        className={className}
      />
    );
  }

  if (!isReady) {
    return (
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Loading..."}
          className={className}
        />
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "Start typing address..."}
      className={className}
    />
  );
}