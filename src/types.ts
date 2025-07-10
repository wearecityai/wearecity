// Basic types for authentication and user management

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'ciudadano' | 'administrativo';
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  admin_user_id: string | null;
  created_at: string;
}

export interface PublicChat {
  id: string;
  assistant_name: string;
  chat_slug: string;
  is_public: boolean;
  created_at: string;
  user_id: string;
}