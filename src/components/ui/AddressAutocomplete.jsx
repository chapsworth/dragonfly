import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAQ4EbHpq31N1np1FAmjGVdw24DiEQAVj0';

export default function AddressAutocomplete({ value, onChange, placeholder, className, onPlaceSelect }) {
  const [autocomplete, setAutocomplete] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const inputRef = useRef(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Prevent multiple script loads
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
      setLoadError(false);
    };
    
    script.onerror = () => {
      setLoadError(true);
      setIsLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount to avoid reloading
    };
  }, []);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocomplete) {
      try {
        const autocompleteInstance = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
        });
        
        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();
          
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

        setAutocomplete(autocompleteInstance);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setLoadError(true);
      }
    }
  }, [isLoaded, autocomplete, onChange, onPlaceSelect]);

  if (loadError) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Enter address (autocomplete unavailable)"}
        className={className}
      />
    );
  }

  if (!isLoaded) {
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
      placeholder={placeholder || "Enter address"}
      className={className}
    />
  );
}