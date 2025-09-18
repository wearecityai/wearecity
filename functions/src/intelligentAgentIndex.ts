import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { 
  intelligentScraping, 
  intelligentScrapingAllCities, 
  cleanupBeforeIntelligentScraping 
} from './intelligentScrapingFunction';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

// Exportar las funciones del agente inteligente
export {
  intelligentScraping,
  intelligentScrapingAllCities,
  cleanupBeforeIntelligentScraping
};
