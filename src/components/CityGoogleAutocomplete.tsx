import React from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';

export default function CityGoogleAutocomplete({ onSelect, disabled }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { types: ['(cities)'] },
    debounce: 300,
  });

  const handleInput = (event) => {
    setValue(event.target.value, true);
  };

  const handleSelect = async (suggestion) => {
    setValue(suggestion, false);
    clearSuggestions();
    const results = await getGeocode({ address: suggestion });
    const place = results[0];
    const { lat, lng } = await getLatLng(place);
    const country = place.address_components.find(c => c.types.includes('country'))?.long_name || '';
    onSelect({
      name: suggestion,
      place_id: place.place_id,
      lat,
      lng,
      country,
      address_components: place.address_components,
      formatted_address: place.formatted_address,
    });
  };

  return (
    <div className="relative w-full">
      <Label htmlFor="city-search">Busca tu ciudad</Label>
      <div className="relative">
        <Input
          id="city-search"
          type="text"
          value={value}
          onChange={handleInput}
          disabled={!ready || disabled}
          placeholder="Busca tu ciudad"
          className="w-full"
        />
        {!ready && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
      
      {/* Suggestions dropdown */}
      {status === 'OK' && data.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {data.map((suggestion, index) => (
            <div
              key={index}
                              className="px-4 py-2 cursor-pointer md:hover:bg-muted text-sm"
              onClick={() => handleSelect(suggestion.description)}
            >
              {suggestion.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}