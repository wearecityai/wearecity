"use strict";
exports.__esModule = true;
exports.scheduleAgentScraping = exports.getAgentStats = exports.cleanupRAGForCity = exports.cleanupBeforeIntelligentScraping = exports.intelligentScrapingAllCities = exports.intelligentScraping = void 0;
var admin = require("firebase-admin");
// Inicializar Firebase Admin
admin.initializeApp();
// Importar las funciones que necesitamos
var intelligentScrapingFunction_1 = require("./intelligentScrapingFunction");
exports.intelligentScraping = intelligentScrapingFunction_1.intelligentScraping;
exports.intelligentScrapingAllCities = intelligentScrapingFunction_1.intelligentScrapingAllCities;
exports.cleanupBeforeIntelligentScraping = intelligentScrapingFunction_1.cleanupBeforeIntelligentScraping;
exports.cleanupRAGForCity = intelligentScrapingFunction_1.cleanupRAGForCity;
exports.getAgentStats = intelligentScrapingFunction_1.getAgentStats;
exports.scheduleAgentScraping = intelligentScrapingFunction_1.scheduleAgentScraping;
