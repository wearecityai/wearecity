import { useState, useEffect, useCallback } from 'react';
import { PlaceCardInfo } from '../types';
import { useGoogleMaps } from './useGoogleMaps';

export const usePlaceCardFilter = () => {
  const { validatePlaceCardLocation } = useGoogleMaps(undefined, undefined, undefined);
  const [filteredPlaceCards, setFilteredPlaceCards] = useState<PlaceCardInfo[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Función para filtrar PlaceCard que estén en la ciudad correcta
  const filterPlaceCards = useCallback(async (
    placeCards: PlaceCardInfo[],
    restrictedCityName?: string
  ): Promise<PlaceCardInfo[]> => {
    if (!placeCards || placeCards.length === 0) {
      return [];
    }

    if (!restrictedCityName) {
      console.log('⚠️ No restricted city configured, returning all place cards');
      return placeCards;
    }

    console.log(`🔍 Filtering ${placeCards.length} place cards for city: ${restrictedCityName}`);
    setIsFiltering(true);

    try {
      const validPlaceCards: PlaceCardInfo[] = [];
      
      // Validar cada PlaceCard individualmente
      for (const placeCard of placeCards) {
        console.log(`🔍 Validating place card: ${placeCard.name}`);
        
        try {
          const isValid = await validatePlaceCardLocation(placeCard, restrictedCityName);
          
          if (isValid) {
            console.log(`✅ Place card ${placeCard.name} is valid for ${restrictedCityName}`);
            validPlaceCards.push(placeCard);
          } else {
            console.log(`❌ Place card ${placeCard.name} rejected - not in ${restrictedCityName}`);
          }
        } catch (error) {
          console.error(`❌ Error validating place card ${placeCard.name}:`, error);
          // Por seguridad, rechazar si hay error en la validación
        }
      }

      console.log(`✅ Filtering complete: ${validPlaceCards.length}/${placeCards.length} place cards valid`);
      return validPlaceCards;
      
    } catch (error) {
      console.error('❌ Error in place card filtering:', error);
      return []; // Por seguridad, retornar array vacío si hay error
    } finally {
      setIsFiltering(false);
    }
  }, [validatePlaceCardLocation]);

  // Función para filtrar PlaceCard y actualizar el estado
  const filterAndSetPlaceCards = useCallback(async (
    placeCards: PlaceCardInfo[],
    restrictedCityName?: string
  ) => {
    const filtered = await filterPlaceCards(placeCards, restrictedCityName);
    setFilteredPlaceCards(filtered);
    return filtered;
  }, [filterPlaceCards]);

  // Función para limpiar el estado
  const clearFilteredPlaceCards = useCallback(() => {
    setFilteredPlaceCards([]);
  }, []);

  return {
    filteredPlaceCards,
    isFiltering,
    filterPlaceCards,
    filterAndSetPlaceCards,
    clearFilteredPlaceCards
  };
};
