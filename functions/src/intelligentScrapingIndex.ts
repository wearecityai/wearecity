import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

// Importar agente de escrapeo inteligente
import { 
  intelligentScraping, 
  intelligentScrapingAllCities, 
  cleanupBeforeIntelligentScraping,
  cleanupRAGForCity,
  getAgentStats,
  scheduleAgentScraping
} from './intelligentScrapingFunction';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configure CORS
const corsHandler = cors({ origin: true });

// Basic health check function
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Intelligent Scraping Functions are running'
  });
});

// NUEVO: Agente de escrapeo inteligente con IA
export {
  intelligentScraping,
  intelligentScrapingAllCities,
  cleanupBeforeIntelligentScraping,
  cleanupRAGForCity,
  getAgentStats,
  scheduleAgentScraping
};