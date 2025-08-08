
// SECURITY NOTE: This file is deprecated and should not build system instructions in frontend
// All system instructions are now handled securely in the backend edge function
// This file is kept for compatibility but returns empty instructions

import { useCallback } from 'react';
import { CustomChatConfig } from '../types';
import { DEFAULT_LANGUAGE_CODE } from '../constants';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useSystemInstructionBuilder = () => {
  const buildFullSystemInstruction = useCallback((config: CustomChatConfig, location: UserLocation | null): string => {
    // SECURITY: All system instructions are now handled in the backend edge function
    // This function should NOT build instructions in frontend as it's insecure
    // Return empty string - the backend will handle all instruction building
    console.warn('useSystemInstructionBuilder is deprecated for security. Backend handles instructions.');
    return '';
  }, []);

  return { buildFullSystemInstruction };
};
