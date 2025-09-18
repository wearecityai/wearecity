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
exports.getSystemMetrics = exports.getSystemHealth = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Endpoint para obtener el estado de salud del sistema
 */
exports.getSystemHealth = functions.https.onRequest(async (req, res) => {
    // Configurar CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    try {
        console.log('📊 Verificando estado de salud del sistema...');
        const health = {
            timestamp: new Date().toISOString(),
            services: {
                agentEngine: 'healthy',
                puppeteerService: 'healthy',
                vectorSearch: 'healthy',
                firestore: 'healthy',
                cloudScheduler: 'healthy'
            },
            metrics: {
                totalEvents: 0,
                totalRAGSources: 0,
                activeCities: 0,
                lastScrapingTime: null,
                averageResponseTime: 0,
                errorRate: 0
            },
            alerts: []
        };
        // 🔍 VERIFICAR FIRESTORE
        try {
            const db = admin.firestore();
            // Contar eventos por ciudad
            const cities = ['valencia', 'la-vila-joiosa', 'alicante'];
            let totalEvents = 0;
            let activeCities = 0;
            for (const city of cities) {
                const eventsSnapshot = await db
                    .collection('cities')
                    .doc(city)
                    .collection('events')
                    .get();
                if (!eventsSnapshot.empty) {
                    totalEvents += eventsSnapshot.size;
                    activeCities += 1;
                }
            }
            health.metrics.totalEvents = totalEvents;
            health.metrics.activeCities = activeCities;
            // Verificar logs de sistema
            const systemLogsSnapshot = await db
                .collection('system_logs')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();
            let errorCount = 0;
            systemLogsSnapshot.docs.forEach(doc => {
                const logData = doc.data();
                if (logData.type && logData.type.includes('error')) {
                    errorCount++;
                }
            });
            health.metrics.errorRate = systemLogsSnapshot.size > 0 ?
                (errorCount / systemLogsSnapshot.size) * 100 : 0;
            console.log('✅ Firestore: Operativo');
        }
        catch (error) {
            console.error('❌ Firestore: Error', error);
            health.services.firestore = 'down';
            health.alerts.push({
                type: 'error',
                message: 'Firestore no disponible',
                service: 'firestore',
                timestamp: new Date().toISOString()
            });
        }
        // 🔍 VERIFICAR PUPPETEER SERVICE
        try {
            const puppeteerResponse = await fetch('https://wearecity-puppeteer-service-294062779330.us-central1.run.app/health', { method: 'GET', signal: AbortSignal.timeout(10000) });
            if (puppeteerResponse.ok) {
                console.log('✅ Puppeteer Service: Operativo');
            }
            else {
                health.services.puppeteerService = 'degraded';
                health.alerts.push({
                    type: 'warning',
                    message: 'Puppeteer Service respondiendo con errores',
                    service: 'puppeteerService',
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            console.error('❌ Puppeteer Service: Error', error);
            health.services.puppeteerService = 'down';
            health.alerts.push({
                type: 'error',
                message: 'Puppeteer Service no disponible',
                service: 'puppeteerService',
                timestamp: new Date().toISOString()
            });
        }
        // 🔍 VERIFICAR AGENT ENGINE
        try {
            const agentResponse = await fetch('https://us-central1-wearecity-2ab89.cloudfunctions.net/simpleAgentProxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: 'health check',
                    citySlug: 'valencia',
                    userId: 'health-check',
                    isAdmin: false
                }),
                signal: AbortSignal.timeout(15000)
            });
            if (agentResponse.ok) {
                console.log('✅ Agent Engine: Operativo');
            }
            else {
                health.services.agentEngine = 'degraded';
                health.alerts.push({
                    type: 'warning',
                    message: 'Agent Engine respondiendo lentamente',
                    service: 'agentEngine',
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            console.error('❌ Agent Engine: Error', error);
            health.services.agentEngine = 'down';
            health.alerts.push({
                type: 'error',
                message: 'Agent Engine no disponible',
                service: 'agentEngine',
                timestamp: new Date().toISOString()
            });
        }
        // 📊 CALCULAR MÉTRICAS ADICIONALES
        if (health.metrics.totalEvents === 0) {
            health.alerts.push({
                type: 'warning',
                message: 'No hay eventos en el sistema',
                service: 'data',
                timestamp: new Date().toISOString()
            });
        }
        if (health.metrics.activeCities === 0) {
            health.alerts.push({
                type: 'error',
                message: 'No hay ciudades con datos',
                service: 'data',
                timestamp: new Date().toISOString()
            });
        }
        // 📈 GUARDAR MÉTRICAS PARA HISTÓRICO
        await admin.firestore().collection('system_metrics').add({
            ...health,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('📊 Estado de salud del sistema verificado');
        res.json(health);
    }
    catch (error) {
        console.error('❌ Error verificando estado del sistema:', error);
        res.status(500).json({
            timestamp: new Date().toISOString(),
            error: 'Error verificando estado del sistema',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Endpoint para obtener métricas históricas
 */
exports.getSystemMetrics = functions.https.onRequest(async (req, res) => {
    // Configurar CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    try {
        const { period = '24h' } = req.query;
        console.log(`📈 Obteniendo métricas históricas: ${period}`);
        const db = admin.firestore();
        // Calcular fecha de inicio según el período
        const now = new Date();
        let startDate = new Date();
        switch (period) {
            case '1h':
                startDate.setHours(now.getHours() - 1);
                break;
            case '24h':
                startDate.setDate(now.getDate() - 1);
                break;
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            default:
                startDate.setDate(now.getDate() - 1);
        }
        // Obtener métricas históricas
        const metricsSnapshot = await db
            .collection('system_metrics')
            .where('createdAt', '>=', startDate)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        const metrics = metricsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Calcular estadísticas del período
        const stats = {
            period,
            totalChecks: metrics.length,
            averageEvents: metrics.reduce((sum, m) => sum + (m.metrics?.totalEvents || 0), 0) / metrics.length || 0,
            averageResponseTime: metrics.reduce((sum, m) => sum + (m.metrics?.averageResponseTime || 0), 0) / metrics.length || 0,
            errorRate: metrics.reduce((sum, m) => sum + (m.metrics?.errorRate || 0), 0) / metrics.length || 0,
            serviceUptime: {
                agentEngine: metrics.filter(m => m.services?.agentEngine === 'healthy').length / metrics.length * 100 || 0,
                puppeteerService: metrics.filter(m => m.services?.puppeteerService === 'healthy').length / metrics.length * 100 || 0,
                firestore: metrics.filter(m => m.services?.firestore === 'healthy').length / metrics.length * 100 || 0
            }
        };
        res.json({
            success: true,
            period,
            stats,
            metrics: metrics.slice(0, 50),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error obteniendo métricas:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
