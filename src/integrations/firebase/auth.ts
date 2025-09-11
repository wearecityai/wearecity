import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  getAuth,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { ProfilesDoc } from './types';

// Auth types
export interface User {
  id: string;
  email: string | null;
  created_at?: string;
}

export interface Session {
  user: User;
  access_token: string;
}

export interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: Error | null;
}

// Convert Firebase User to our User interface
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    created_at: firebaseUser.metadata.creationTime,
  };
};

// Create session object
const createSession = (firebaseUser: FirebaseUser): Session => {
  return {
    user: convertFirebaseUser(firebaseUser),
    access_token: 'firebase_token', // Firebase handles tokens internally
  };
};

// Sign in with email and password
export const signInWithPassword = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    const user = convertFirebaseUser(userCredential.user);
    const session = createSession(userCredential.user);

    return {
      data: { user, session },
      error: null,
    };
  } catch (error) {
    return {
      data: { user: null, session: null },
      error: error as Error,
    };
  }
};

// Sign up with email and password
export const signUp = async (credentials: { 
  email: string; 
  password: string; 
  options?: {
    data?: {
      first_name?: string;
      last_name?: string;
      role?: string;
    };
    emailRedirectTo?: string;
  };
}): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    
    // Update display name if provided
    if (credentials.options?.data?.first_name) {
      await updateProfile(userCredential.user, {
        displayName: `${credentials.options.data.first_name} ${credentials.options.data.last_name || ''}`.trim(),
      });
    }

    const userRole = (credentials.options?.data?.role as any) || 'ciudadano';

    // Create profile document in Firestore
    const profileData: ProfilesDoc = {
      id: userCredential.user.uid,
      email: credentials.email,
      firstName: credentials.options?.data?.first_name || null,
      lastName: credentials.options?.data?.last_name || null,
      role: userRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'profiles', userCredential.user.uid), profileData);

    // If user is administrativo, automatically create a city for them
    if (userRole === 'administrativo') {
      await createCityForAdmin(userCredential.user.uid, credentials.options?.data?.first_name || 'Admin');
    }

    const user = convertFirebaseUser(userCredential.user);
    const session = createSession(userCredential.user);

    return {
      data: { user, session },
      error: null,
    };
  } catch (error) {
    return {
      data: { user: null, session: null },
      error: error as Error,
    };
  }
};

// Helper function to create a city for admin users
const createCityForAdmin = async (userId: string, firstName: string) => {
  try {
    const cityName = `Ciudad de ${firstName}`;
    const citySlug = generateSlugFromName(cityName);
    
    const cityData = {
      id: `city_${userId}`, // Use a predictable ID
      name: cityName,
      slug: citySlug,
      adminUserId: userId,
      isActive: true,
      isPublic: false, // Privada por defecto - el admin puede cambiarla a pública
      
      // Configuración del asistente (editable desde finetuning)
      assistantName: `Asistente de ${cityName}`,
      systemInstruction: "", // Instructions are now securely stored in backend
      
      // Funcionalidades habilitadas (configurables desde ajustes)
      enableGoogleSearch: true,
      allowGeolocation: true,
      allowMapDisplay: true,
      currentLanguageCode: 'es',
      
      // Ubicación (editable)
      lat: null,
      lng: null,
      
      // URLs y recursos (editables desde panel admin)
      sedeElectronicaUrl: null,
      profileImageUrl: null,
      agendaEventosUrls: null,
      procedureSourceUrls: null,
      uploadedProcedureDocuments: null,
      
      // Prompts recomendados (editables)
      recommendedPrompts: [
        "¿Cómo puedo solicitar un certificado?",
        "¿Cuáles son los horarios de atención?", 
        "¿Dónde está ubicado el ayuntamiento?",
        "¿Cómo puedo pagar mis impuestos municipales?",
        "¿Qué servicios municipales están disponibles?"
      ],
      
      // Tags de servicios (editables)
      serviceTags: ["tramites", "informacion", "servicios", "municipal", "ciudadanos"],
      
      // Restricciones de ciudad (configurable)
      restrictedCity: null, // El admin puede restringir la ciudad desde ajustes
      
      // Metadatos
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'cities', cityData.id), cityData);
    console.log('✅ Ciudad creada automáticamente para usuario administrativo:', {
      cityName,
      citySlug,
      userId,
      cityId: cityData.id
    });
  } catch (error) {
    console.error('❌ Error creando ciudad para admin:', error);
    throw error; // Re-throw para que el registro falle si no se puede crear la ciudad
  }
};

// Helper function to generate slug from city name
const generateSlugFromName = (name: string): string => {
  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}-${timestamp}`;
};

// Sign in with OAuth (Google)
export const signInWithOAuth = async ({ provider }: { provider: 'google' }): Promise<AuthResponse> => {
  try {
    let authProvider;
    if (provider === 'google') {
      authProvider = new GoogleAuthProvider();
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const result = await signInWithPopup(auth, authProvider);
    const user = convertFirebaseUser(result.user);
    const session = createSession(result.user);

    // Check if user profile exists, if not create one
    const profileDoc = await getDoc(doc(db, 'profiles', result.user.uid));
    if (!profileDoc.exists()) {
      const profileData: ProfilesDoc = {
        id: result.user.uid,
        email: result.user.email || '',
        firstName: result.user.displayName?.split(' ')[0] || null,
        lastName: result.user.displayName?.split(' ').slice(1).join(' ') || null,
        role: 'ciudadano',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(doc(db, 'profiles', result.user.uid), profileData);
    }

    return {
      data: { user, session },
      error: null,
    };
  } catch (error) {
    return {
      data: { user: null, session: null },
      error: error as Error,
    };
  }
};

// Sign out
export const signOutUser = async (): Promise<{ error: Error | null }> => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// Get current session
export const getSession = async (): Promise<{ data: { session: Session | null }; error: Error | null }> => {
  try {
    const user = auth.currentUser;
    if (user) {
      const session = createSession(user);
      return {
        data: { session },
        error: null,
      };
    }
    return {
      data: { session: null },
      error: null,
    };
  } catch (error) {
    return {
      data: { session: null },
      error: error as Error,
    };
  }
};

// Auth state change listener
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      const session = createSession(user);
      callback('SIGNED_IN', session);
    } else {
      callback('SIGNED_OUT', null);
    }
  });
};