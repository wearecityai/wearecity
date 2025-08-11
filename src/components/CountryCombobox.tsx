import React, { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CountryOption {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag?: string;
}

const DEFAULT_COUNTRIES: CountryOption[] = [
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NL', name: 'Países Bajos', flag: '🇳🇱' },
  { code: 'BE', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'IE', name: 'Irlanda', flag: '🇮🇪' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
];

interface CountryComboboxProps {
  value?: string; // country code
  onChange: (code: string | undefined) => void;
  placeholder?: string;
  countries?: CountryOption[];
}

const CountryCombobox: React.FC<CountryComboboxProps> = ({ value, onChange, placeholder = 'Selecciona país', countries = DEFAULT_COUNTRIES }) => {
  const [open, setOpen] = useState(false);
  const current = useMemo(() => countries.find(c => c.code === value), [countries, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <span className={cn('truncate flex items-center gap-2', !current && 'text-muted-foreground')}>
            <Globe className="h-4 w-4" />
            {current ? `${current.flag ?? ''} ${current.name}` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {countries.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.code}`}
                  onSelect={() => { onChange(c.code); setOpen(false); }}
                  className="cursor-pointer"
                >
                  <span className="mr-2">{c.flag ?? '🌍'}</span>
                  <span className="truncate">{c.name}</span>
                  <span className="ml-2 text-muted-foreground">({c.code})</span>
                  {value === c.code && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CountryCombobox;


