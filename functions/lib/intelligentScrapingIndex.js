"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleAgentScraping = exports.getAgentStats = exports.cleanupRAGForCity = exports.cleanupBeforeIntelligentScraping = exports.intelligentScrapingAllCities = exports.intelligentScraping = exports.healthCheck = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
// Importar agente de escrapeo inteligente
const intelligentScrapingFunction_1 = require("./intelligentScrapingFunction");
Object.defineProperty(exports, "intelligentScraping", { enumerable: true, get: function () { return intelligentScrapingFunction_1.intelligentScraping; } });
Object.defineProperty(exports, "intelligentScrapingAllCities", { enumerable: true, get: function () { return intelligentScrapingFunction_1.intelligentScrapingAllCities; } });
Object.defineProperty(exports, "cleanupBeforeIntelligentScraping", { enumerable: true, get: function () { return intelligentScrapingFunction_1.cleanupBeforeIntelligentScraping; } });
Object.defineProperty(exports, "cleanupRAGForCity", { enumerable: true, get: function () { return intelligentScrapingFunction_1.cleanupRAGForCity; } });
Object.defineProperty(exports, "getAgentStats", { enumerable: true, get: function () { return intelligentScrapingFunction_1.getAgentStats; } });
Object.defineProperty(exports, "scheduleAgentScraping", { enumerable: true, get: function () { return intelligentScrapingFunction_1.scheduleAgentScraping; } });
// Inicializar Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
// Configure CORS
const corsHandler = (0, cors_1.default)({ origin: true });
// Basic health check function
exports.healthCheck = functions.https.onRequest((req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Intelligent Scraping Functions are running'
    });
});
//# sourceMappingURL=intelligentScrapingIndex.js.map