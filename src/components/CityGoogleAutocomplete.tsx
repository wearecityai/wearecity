import React from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';

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

  const handleInput = (event, newValue) => {
    setValue(newValue, true);
  };

  const handleSelect = async (event, newValue) => {
    if (!newValue) return;
    setValue(newValue, false);
    clearSuggestions();
    const results = await getGeocode({ address: newValue });
    const place = results[0];
    const { lat, lng } = await getLatLng(place);
    const country = place.address_components.find(c => c.types.includes('country'))?.long_name || '';
    onSelect({
      name: newValue,
      place_id: place.place_id,
      lat,
      lng,
      country,
      address_components: place.address_components,
      formatted_address: place.formatted_address,
    });
  };

  return (
    <Autocomplete
      freeSolo
      options={status === 'OK' ? data.map(suggestion => suggestion.description) : []}
      inputValue={value}
      onInputChange={handleInput}
      onChange={handleSelect}
      disabled={!ready || disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Busca tu ciudad"
          variant="outlined"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {!ready ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
} 