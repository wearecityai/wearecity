import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemMarkers {
  SHOW_MAP_MARKER_START: string;
  SHOW_MAP_MARKER_END: string;
  EVENT_CARD_START_MARKER: string;
  EVENT_CARD_END_MARKER: string;
  PLACE_CARD_START_MARKER: string;
  PLACE_CARD_END_MARKER: string;
  TECA_LINK_BUTTON_START_MARKER: string;
  TECA_LINK_BUTTON_END_MARKER: string;
  MAX_INITIAL_EVENTS: number;
}

export const useSystemMarkers = () => {
  const [markers, setMarkers] = useState<SystemMarkers>({
    SHOW_MAP_MARKER_START: '[SHOW_MAP:',
    SHOW_MAP_MARKER_END: ']',
    EVENT_CARD_START_MARKER: '[EVENT_CARD_START]',
    EVENT_CARD_END_MARKER: '[EVENT_CARD_END]',
    PLACE_CARD_START_MARKER: '[PLACE_CARD_START]',
    PLACE_CARD_END_MARKER: '[PLACE_CARD_END]',
    TECA_LINK_BUTTON_START_MARKER: '[TECA_LINK_BUTTON_START]',
    TECA_LINK_BUTTON_END_MARKER: '[TECA_LINK_BUTTON_END]',
    MAX_INITIAL_EVENTS: 6,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadMarkers = async () => {
      try {
        const { data, error } = await supabase.rpc('get_all_system_instructions');
        
        if (error) {
          console.error('Error loading system markers:', error);
          setIsLoaded(true); // Use fallback values
          return;
        }

        const markersMap: Record<string, string> = {};
        data?.forEach((instruction: any) => {
          markersMap[instruction.instruction_key] = instruction.instruction_value;
        });
        
        // Update markers with values from database or keep fallbacks
        const newMarkers = {
          SHOW_MAP_MARKER_START: markersMap['SHOW_MAP_MARKER_START'] || '[SHOW_MAP:',
          SHOW_MAP_MARKER_END: markersMap['SHOW_MAP_MARKER_END'] || ']',
          EVENT_CARD_START_MARKER: markersMap['EVENT_CARD_START_MARKER'] || '[EVENT_CARD_START]',
          EVENT_CARD_END_MARKER: markersMap['EVENT_CARD_END_MARKER'] || '[EVENT_CARD_END]',
          PLACE_CARD_START_MARKER: markersMap['PLACE_CARD_START_MARKER'] || '[PLACE_CARD_START]',
          PLACE_CARD_END_MARKER: markersMap['PLACE_CARD_END_MARKER'] || '[PLACE_CARD_END]',
          TECA_LINK_BUTTON_START_MARKER: markersMap['TECA_LINK_BUTTON_START_MARKER'] || '[TECA_LINK_BUTTON_START]',
          TECA_LINK_BUTTON_END_MARKER: markersMap['TECA_LINK_BUTTON_END_MARKER'] || '[TECA_LINK_BUTTON_END]',
          MAX_INITIAL_EVENTS: parseInt(markersMap['MAX_INITIAL_EVENTS'] || '6'),
        };
        
        console.log('🔧 System markers loaded from database:', newMarkers);
        console.log('📊 Raw database data:', data);
        
        setMarkers(newMarkers);
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading system markers:', error);
        setIsLoaded(true); // Use fallback values
      }
    };

    loadMarkers();
  }, []);

  return { markers, isLoaded };
};
