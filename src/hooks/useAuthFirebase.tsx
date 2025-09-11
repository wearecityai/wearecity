import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebase, User, Session } from '@/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { useCityNavigation } from './useCityNavigation';

interface Profile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'ciudadano' | 'administrativo';
  createdAt: string;
  updatedAt: string;
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
  console.log('🔐 AuthProvider rendering...');
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
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      // Map the role to ensure type compatibility
      const mappedProfile: Profile = {
        id: docSnap.id,
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        role: mapRole(data.role),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
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
    await firebase.auth.signOut();
  };

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = firebase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile when authenticated
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            console.log('🔍 Profile data after fetch:', profileData);
            setProfile(profileData);
            if (!profileData) {
              console.log('❌ No profile data found, creating default profile');
              console.log('🔍 User ID:', session.user.id);
              console.log('🔍 User email:', session.user.email);
              
              // Create default profile for user
              try {
                const defaultProfile = {
                  email: session.user.email,
                  firstName: session.user.user_metadata?.full_name?.split(' ')[0] || 'Usuario',
                  lastName: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                  role: 'ciudadano',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  default_chat: {
                    conversationId: '',
                    title: 'Chat de la-vila-joiosa',
                    citySlug: 'la-vila-joiosa'
                  },
                  last_visited_city: 'la-vila-joiosa',
                  recent_cities: [],
                  updated_at: new Date().toISOString()
                };
                
                console.log('📝 Creating default profile:', defaultProfile);
                
                // Import setDoc dynamically to avoid issues
                const { setDoc } = await import('firebase/firestore');
                const { db } = await import('@/integrations/firebase/config');
                const profileRef = doc(db, 'profiles', session.user.id);
                await setDoc(profileRef, defaultProfile);
                
                console.log('✅ Default profile created successfully');
                setProfile(defaultProfile);
              } catch (createError) {
                console.error('❌ Error creating default profile:', createError);
                // If we can't create profile, redirect to auth
                await firebase.auth.signOut();
                window.location.href = '/auth';
                return;
              }
            } else {
              console.log('✅ Profile data found, proceeding with auth');
              // Check for default chat and redirect if user just signed in
              if (event === 'SIGNED_IN') {
                // La redirección ahora se maneja en PersistentLayout usando useCityNavigation
                console.log('User signed in, navigation will be handled by PersistentLayout');
              }
            }
            // Delay más agresivo para asegurar que NO se muestre el sidebar prematuramente
            setTimeout(() => {
              console.log('🔄 Setting authLoading to false after profile fetch');
              setIsLoading(false);
            }, 100); // Reduced delay for testing
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
    firebase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then(async (profileData) => {
          console.log('🔍 Initial profile data after fetch:', profileData);
          setProfile(profileData);
          setIsLoading(false);
          if (!profileData) {
            console.log('❌ No initial profile data found, creating default profile');
            console.log('🔍 Initial User ID:', session.user.id);
            console.log('🔍 Initial User email:', session.user.email);
            
            // Create default profile for user
            try {
              const defaultProfile = {
                email: session.user.email,
                firstName: session.user.user_metadata?.full_name?.split(' ')[0] || 'Usuario',
                lastName: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                role: 'ciudadano',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                default_chat: {
                  conversationId: '',
                  title: 'Chat de la-vila-joiosa',
                  citySlug: 'la-vila-joiosa'
                },
                last_visited_city: 'la-vila-joiosa',
                recent_cities: [],
                updated_at: new Date().toISOString()
              };
              
              console.log('📝 Creating initial default profile:', defaultProfile);
              
              // Import setDoc dynamically to avoid issues
              const { setDoc } = await import('firebase/firestore');
              const { db } = await import('@/integrations/firebase/config');
              const profileRef = doc(db, 'profiles', session.user.id);
              await setDoc(profileRef, defaultProfile);
              
              console.log('✅ Initial default profile created successfully');
              setProfile(defaultProfile);
            } catch (createError) {
              console.error('❌ Error creating initial default profile:', createError);
              // If we can't create profile, redirect to auth
              await firebase.auth.signOut();
              window.location.href = '/auth';
              return;
            }
          } else {
            console.log('✅ Initial profile data found');
          }
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
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