// Basic constants for the application

export const APP_NAME = 'City Chat';
export const APP_DESCRIPTION = 'Sistema de chat municipal';

export const USER_ROLES = {
  CITIZEN: 'ciudadano' as const,
  ADMIN: 'administrativo' as const,
} as const;