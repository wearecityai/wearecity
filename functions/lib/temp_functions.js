"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleAgentScraping = exports.getAgentStats = exports.cleanupRAGForCity = exports.cleanupBeforeIntelligentScraping = exports.intelligentScrapingAllCities = exports.intelligentScraping = void 0;

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

// Importar las funciones del archivo TypeScript compilado
const { 
    intelligentScraping: intelligentScrapingTS, 
    intelligentScrapingAllCities: intelligentScrapingAllCitiesTS, 
    cleanupBeforeIntelligentScraping: cleanupBeforeIntelligentScrapingTS,
    cleanupRAGForCity: cleanupRAGForCityTS,
    getAgentStats: getAgentStatsTS,
    scheduleAgentScraping: scheduleAgentScrapingTS
} = require('./intelligentScrapingFunction');

// Exportar las funciones
exports.intelligentScraping = intelligentScrapingTS;
exports.intelligentScrapingAllCities = intelligentScrapingAllCitiesTS;
exports.cleanupBeforeIntelligentScraping = cleanupBeforeIntelligentScrapingTS;
exports.cleanupRAGForCity = cleanupRAGForCityTS;
exports.getAgentStats = getAgentStatsTS;
exports.scheduleAgentScraping = scheduleAgentScrapingTS;
