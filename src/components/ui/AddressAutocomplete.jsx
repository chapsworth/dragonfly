import React, { useState, useRef } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const libraries = ['places'];
const GOOGLE_MAPS_API_KEY = 'AIzaSyAQ4EbHpq31N1np1FAmjGVdw24DiEQAVj0';

export default function AddressAutocomplete({ value, onChange, placeholder, className, onPlaceSelect }) {
  const [autocomplete, setAutocomplete] = useState(null);
  const inputRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place.formatted_address) {
        onChange(place.formatted_address);
        
        // If callback provided, pass the full place details
        if (onPlaceSelect) {
          const details = {
            address: place.formatted_address,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
            place_id: place.place_id,
            // Extract address components
            city: place.address_components?.find(c => c.types.includes('locality'))?.long_name || '',
            state: place.address_components?.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '',
            zip: place.address_components?.find(c => c.types.includes('postal_code'))?.long_name || '',
            country: place.address_components?.find(c => c.types.includes('country'))?.long_name || ''
          };
          onPlaceSelect(details);
        }
      }
    }
  };

  if (loadError) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Enter address"}
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
          placeholder={placeholder || "Enter address"}
          className={className}
          disabled
        />
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
    >
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Enter address"}
        className={className}
      />
    </Autocomplete>
  );
}