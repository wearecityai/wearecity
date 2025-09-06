import { db } from '@/integrations/firebase/config';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

// Categorías por defecto para inicializar
const DEFAULT_CATEGORIES = {
  tramites: {
    name: 'tramites',
    keywords: ['trámite', 'documento', 'certificado', 'licencia', 'permiso', 'registro', 'padrón', 'empadronamiento', 'dni', 'pasaporte'],
    description: 'Consultas sobre procedimientos administrativos'
  },
  eventos: {
    name: 'eventos',
    keywords: ['evento', 'concierto', 'festival', 'fiesta', 'celebración', 'actividad', 'espectáculo', 'teatro'],
    description: 'Información sobre eventos y actividades'
  },
  lugares: {
    name: 'lugares',
    keywords: ['dónde', 'ubicación', 'dirección', 'lugar', 'sitio', 'zona', 'barrio', 'calle', 'plaza', 'parque'],
    description: 'Ubicaciones y puntos de interés'
  },
  informacion_general: {
    name: 'informacion_general',
    keywords: ['información', 'horario', 'teléfono', 'contacto', 'ayuntamiento', 'gobierno', 'municipal'],
    description: 'Consultas generales sobre la ciudad'
  },
  turismo: {
    name: 'turismo',
    keywords: ['turismo', 'visitar', 'monumento', 'museo', 'restaurante', 'hotel', 'alojamiento', 'guía'],
    description: 'Información turística y recomendaciones'
  },
  servicios_publicos: {
    name: 'servicios_publicos',
    keywords: ['agua', 'luz', 'basura', 'limpieza', 'alcantarillado', 'servicio', 'público', 'municipal'],
    description: 'Consultas sobre servicios municipales'
  },
  transporte: {
    name: 'transporte',
    keywords: ['autobús', 'metro', 'tren', 'transporte', 'público', 'parada', 'estación', 'horario'],
    description: 'Información sobre transporte público'
  },
  cultura: {
    name: 'cultura',
    keywords: ['cultura', 'biblioteca', 'centro', 'cultural', 'arte', 'exposición', 'taller', 'curso'],
    description: 'Actividades culturales y patrimonio'
  }
};

/**
 * Inicializa las categorías por defecto en Firestore
 * Solo se ejecuta si no existen categorías previas
 */
export const initializeChatCategories = async (): Promise<boolean> => {
  try {
    console.log('🔧 Checking if categories need initialization...');
    
    // Verificar si ya existen categorías
    const categoriesSnapshot = await getDocs(collection(db, 'chat_categories'));
    
    if (!categoriesSnapshot.empty) {
      console.log('✅ Categories already exist, skipping initialization');
      return false;
    }

    console.log('🚀 Initializing chat categories...');

    // Crear categorías por defecto
    const promises = Object.entries(DEFAULT_CATEGORIES).map(async ([id, category]) => {
      const categoryRef = doc(db, 'chat_categories', id);
      await setDoc(categoryRef, {
        ...category,
        created_at: new Date().toISOString()
      });
      console.log(`✅ Created category: ${category.name}`);
    });

    await Promise.all(promises);

    console.log('🎉 Chat categories initialized successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error initializing categories:', error);
    throw error;
  }
};

/**
 * Función para verificar la configuración de métricas
 */
export const verifyMetricsSetup = async (): Promise<boolean> => {
  try {
    console.log('🔍 Verifying metrics setup...');

    // Verificar que existan las colecciones necesarias
    const categoriesSnapshot = await getDocs(collection(db, 'chat_categories'));
    const analyticsSnapshot = await getDocs(collection(db, 'chat_analytics'));

    const categoriesExist = !categoriesSnapshot.empty;
    const analyticsCollectionExists = true; // La colección se crea automáticamente al escribir

    console.log('📊 Metrics setup status:');
    console.log(`  - Categories: ${categoriesExist ? '✅' : '❌'} (${categoriesSnapshot.size} found)`);
    console.log(`  - Analytics collection: ${analyticsCollectionExists ? '✅' : '❌'} (${analyticsSnapshot.size} records)`);

    return categoriesExist && analyticsCollectionExists;

  } catch (error) {
    console.error('❌ Error verifying metrics setup:', error);
    return false;
  }
};

/**
 * Hook para inicializar métricas en componentes
 */
export const useMetricsInitialization = () => {
  const initializeCategories = async () => {
    try {
      await initializeChatCategories();
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  };

  const verifySetup = async () => {
    try {
      return await verifyMetricsSetup();
    } catch (error) {
      console.error('Error verifying setup:', error);
      return false;
    }
  };

  return {
    initializeCategories,
    verifySetup
  };
};