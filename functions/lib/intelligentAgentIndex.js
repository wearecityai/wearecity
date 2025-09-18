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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupBeforeIntelligentScraping = exports.intelligentScrapingAllCities = exports.intelligentScraping = void 0;
const admin = __importStar(require("firebase-admin"));
const intelligentScrapingFunction_1 = require("./intelligentScrapingFunction");
Object.defineProperty(exports, "intelligentScraping", { enumerable: true, get: function () { return intelligentScrapingFunction_1.intelligentScraping; } });
Object.defineProperty(exports, "intelligentScrapingAllCities", { enumerable: true, get: function () { return intelligentScrapingFunction_1.intelligentScrapingAllCities; } });
Object.defineProperty(exports, "cleanupBeforeIntelligentScraping", { enumerable: true, get: function () { return intelligentScrapingFunction_1.cleanupBeforeIntelligentScraping; } });
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
//# sourceMappingURL=intelligentAgentIndex.js.map