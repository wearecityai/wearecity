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
  role: 'ciudadano' | 'administrativo' | 'superadmin';
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
  // console.log('🔐 AuthProvider rendering...');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapRole = (role: string): 'ciudadano' | 'administrativo' | 'superadmin' => {
    switch (role) {
      case 'superadmin':
        return 'superadmin';
      case 'admin':
      case 'administrativo':
        return 'administrativo';
      case 'citizen':
      case 'ciudadano':
      default:
        return 'ciudadano';
    }
  };

  const fetchProfile = async (userId: string, email?: string): Promise<Profile | null> => {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Special case for SuperAdmin - create a virtual profile
        if (userId && email === 'wearecity.ai@gmail.com') {
          return {
            id: userId,
            email: 'wearecity.ai@gmail.com',
            firstName: 'Super',
            lastName: 'Admin',
            role: 'superadmin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
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
      const profileData = await fetchProfile(user.id, user.email);
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

        // Handle sign out explicitly
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing state');
          setProfile(null);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          // Fetch user profile when authenticated
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id, session.user.email);
            console.log('🔍 Profile data after fetch:', profileData);
            setProfile(profileData);
            if (!profileData) {
              console.log('❌ No profile data found, but allowing anonymous usage');
              // DISABLED: This was preventing anonymous users from using the app
              // await firebase.auth.signOut();
              // window.location.href = '/auth';
            } else {
              console.log('✅ Profile data found, proceeding with auth');
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
      // console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id, session.user.email).then(async (profileData) => {
          console.log('🔍 Initial profile data after fetch:', profileData);
          setProfile(profileData);
          setIsLoading(false);
          if (!profileData) {
            console.log('❌ No initial profile data found, but allowing anonymous usage');
            // DISABLED: This was preventing anonymous users from using the app
            // await firebase.auth.signOut();
            // window.location.href = '/auth';
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