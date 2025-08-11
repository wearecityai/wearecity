import React, { useEffect, useMemo, useState } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Check, ChevronsUpDown, Loader2, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RestrictedCityInfo } from '@/types';

interface CityComboboxProps {
  value: RestrictedCityInfo | null;
  onChange: (city: RestrictedCityInfo | null) => void;
  placeholder?: string;
  disabled?: boolean;
  countryCode?: string; // ISO code to restrict results
}

const CityCombobox: React.FC<CityComboboxProps> = ({ value, onChange, placeholder = 'Selecciona ciudad', disabled, countryCode }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const {
    ready,
    value: placesValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({ requestOptions: { types: ['(cities)'], componentRestrictions: countryCode ? { country: countryCode } : undefined as any }, debounce: 250 });

  useEffect(() => {
    setValue(query, true);
  }, [query, setValue]);

  const handleSelect = async (description: string) => {
    try {
      setValue(description, false);
      clearSuggestions();
      const results = await getGeocode({ address: description });
      const place = results[0];
      const { lat, lng } = await getLatLng(place);
      const country = place.address_components?.find((c) => c.types.includes('country'))?.long_name || '';
      const selected: RestrictedCityInfo = {
        name: description,
        placeId: place.place_id,
        formattedAddress: place.formatted_address,
      } as RestrictedCityInfo;
      // Attach extra fields for downstream consumers if they exist
      // @ts-ignore
      selected['lat'] = lat;
      // @ts-ignore
      selected['lng'] = lng;
      // @ts-ignore
      selected['country'] = country;
      onChange(selected);
      setOpen(false);
      setQuery('');
    } catch (e) {
      console.error('City selection failed:', e);
    }
  };

  const buttonLabel = useMemo(() => {
    if (value?.name) return value.name;
    return placeholder;
  }, [value, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <span className={cn('truncate', !value && 'text-muted-foreground flex items-center gap-2')}>
            {!value && <MapPin className="h-4 w-4" />} {buttonLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command>
          <div className="relative">
            <CommandInput placeholder="Buscar ciudad..." value={query} onValueChange={setQuery} />
            {!ready && (
              <div className="absolute right-2 top-2.5 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          <CommandList>
            <CommandEmpty>
              {query ? 'Sin resultados' : 'Escribe para buscar ciudades'}
            </CommandEmpty>
            <CommandGroup>
              {status === 'OK' && data.map((sug) => (
                <CommandItem key={sug.place_id} value={sug.description} onSelect={() => handleSelect(sug.description)} className="cursor-pointer">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{sug.description}</span>
                  {value?.name === sug.description && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CityCombobox;


