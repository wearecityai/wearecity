import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin
admin.initializeApp();

// Importar las funciones que necesitamos
import { 
  intelligentScraping, 
  intelligentScrapingAllCities, 
  cleanupBeforeIntelligentScraping,
  cleanupRAGForCity,
  getAgentStats,
  scheduleAgentScraping
} from './intelligentScrapingFunction';

// Exportar las funciones
export {
  intelligentScraping,
  intelligentScrapingAllCities,
  cleanupBeforeIntelligentScraping,
  cleanupRAGForCity,
  getAgentStats,
  scheduleAgentScraping
};
