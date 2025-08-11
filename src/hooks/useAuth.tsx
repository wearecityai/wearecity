
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useCityNavigation } from './useCityNavigation';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'ciudadano' | 'administrativo';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapRole = (role: string): 'ciudadano' | 'administrativo' => {
    switch (role) {
      case 'admin':
      case 'administrativo':
        return 'administrativo';
      case 'citizen':
      case 'ciudadano':
      default:
        return 'ciudadano';
    }
  };

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Map the role to ensure type compatibility
      const mappedProfile: Profile = {
        ...data,
        role: mapRole(data.role)
      };

      console.log('Profile fetched:', mappedProfile);
      return mappedProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile when authenticated
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
            if (!profileData) {
              await supabase.auth.signOut();
              window.location.href = '/auth';
            } else {
              // Check for default chat and redirect if user just signed in
              if (event === 'SIGNED_IN') {
                // La redirección ahora se maneja en PersistentLayout usando useCityNavigation
                console.log('User signed in, navigation will be handled by PersistentLayout');
              }
            }
            // Delay más agresivo para asegurar que NO se muestre el sidebar prematuramente
            setTimeout(() => {
              setIsLoading(false);
            }, 1500);
          }, 500);
        } else {
          setProfile(null);
          // Delay más agresivo para estabilizar completamente la UI
          setTimeout(() => {
            setIsLoading(false);
          }, 800);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then(async (profileData) => {
          setProfile(profileData);
          setIsLoading(false);
          if (!profileData) {
            await supabase.auth.signOut();
            window.location.href = '/auth';
          }
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};
