# 🚀 Implementación de Firebase AI Logic para Chat IA

## 📋 Resumen

Esta implementación reemplaza la simulación del chat IA con un sistema real basado en **Firebase AI Logic** y **Google AI (Gemini)**, proporcionando respuestas inteligentes y contextuales en tiempo real usando el SDK oficial de Firebase.

## 🏗️ Arquitectura

```
Frontend (React) → Firebase AI Logic → Google AI (Gemini) → Respuesta IA
                ↓
            Firestore (Historial de conversaciones)
```

## 🛠️ Componentes Implementados

### 1. Firebase AI Logic (SDK Oficial)
- **Integración directa**: Uso del SDK oficial de Firebase AI Logic
- **Integración con Google AI**: Uso de modelos Gemini 2.5 Flash/Pro
- **Manejo de contexto**: Historial de conversación y configuración de ciudad
- **Configuración optimizada**: Parámetros de generación configurados para mejor rendimiento

### 2. Servicio Firebase AI (`src/services/firebaseAI.ts`)
- **Cliente TypeScript**: Integración con Firebase Functions
- **Manejo de errores**: Timeouts, reintentos y fallbacks
- **Singleton pattern**: Instancia única del servicio
- **Verificación de disponibilidad**: Health checks del servicio

### 3. Hook Personalizado (`src/hooks/useFirebaseAI.ts`)
- **Estado del servicio**: Disponibilidad, conexión y errores
- **Verificación automática**: Health checks periódicos
- **Manejo de estado**: Loading, errores y respuestas

### 4. Componente de Estado (`src/components/FirebaseAIStatus.tsx`)
- **UI de estado**: Indicadores visuales del servicio
- **Controles**: Botones de verificación y acceso a consola
- **Información del servicio**: Detalles de proveedores y modelos

## 🔧 Configuración Requerida

### Variables de Entorno
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google AI API Key (para Firebase Functions)
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### Dependencias
```json
{
  "dependencies": {
    "firebase": "^12.1.0",
    "@google/generative-ai": "^0.24.1"
  }
}
```

## 🚀 Despliegue

### 1. Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Configurar proyecto Firebase
```bash
firebase login
firebase use your-project-id
```

### 3. Desplegar funciones
```bash
# Usar el script automático
./deploy-firebase-ai.sh

# O manualmente
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 4. Verificar despliegue
```bash
firebase functions:log
firebase functions:list
```

## 🧪 Pruebas Locales

### 1. Iniciar emuladores
```bash
firebase emulators:start
```

### 2. Configurar variables de entorno para emulador
```bash
export GOOGLE_AI_API_KEY=your_key_here
```

### 3. Probar función localmente
```bash
curl -X POST http://localhost:5001/your-project-id/us-central1/chatIA \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Hola, ¿cómo estás?"}'
```

## 📱 Uso en la Aplicación

### 1. Importar el servicio
```typescript
import { firebaseAIService } from '../services/firebaseAI';
```

### 2. Enviar mensaje
```typescript
const response = await firebaseAIService.sendMessage({
  userMessage: "¿Qué eventos hay en mi ciudad?",
  citySlug: "valencia",
  mode: "quality"
});
```

### 3. Usar el hook
```typescript
const { state, sendMessage } = useFirebaseAI();

const handleSend = async () => {
  try {
    const response = await sendMessage({
      userMessage: userInput,
      citySlug: currentCity
    });
    // Procesar respuesta
  } catch (error) {
    // Manejar error
  }
};
```

## 🔍 Características del Sistema

### ✅ Funcionalidades Implementadas
- **Chat en tiempo real** con Google AI (Gemini)
- **Contexto de ciudad** para respuestas personalizadas
- **Historial de conversación** con ventana configurable
- **Modos de respuesta**: Rápido (Flash) y Calidad (Pro)
- **Manejo de ubicación** del usuario
- **Almacenamiento automático** de conversaciones
- **Sistema de fallbacks** para timeouts
- **Health checks** automáticos del servicio

### 🎯 Modelos de IA Disponibles
- **Gemini 1.5 Flash**: Respuestas rápidas (modo 'fast')
- **Gemini 1.5 Pro**: Respuestas de alta calidad (modo 'quality')

### 📊 Métricas y Monitoreo
- **Logs detallados** en Firebase Functions
- **Estado del servicio** en tiempo real
- **Verificación automática** de disponibilidad
- **Manejo de errores** con reintentos inteligentes

## 🚨 Solución de Problemas

### Error: "GOOGLE_AI_API_KEY not configured"
```bash
# Configurar variable de entorno
export GOOGLE_AI_API_KEY=your_key_here

# O añadir al archivo .env
echo "GOOGLE_AI_API_KEY=your_key_here" >> .env
```

### Error: "Function not found"
```bash
# Verificar que las funciones estén desplegadas
firebase functions:list

# Redesplegar si es necesario
firebase deploy --only functions
```

### Error: "Permission denied"
```bash
# Verificar reglas de Firestore
# Asegurar que el usuario tenga permisos para escribir en la colección 'conversations'
```

### Error: "Timeout"
- El sistema automáticamente reintenta con modo 'fast'
- Verificar conectividad a internet
- Revisar logs de Firebase Functions

## 🔮 Próximas Mejoras

### Funcionalidades Planificadas
- **Extracción automática** de eventos y lugares de las respuestas
- **Integración con APIs** de ciudades para datos en tiempo real
- **Sistema de caché** para respuestas frecuentes
- **Análisis de sentimiento** de las conversaciones
- **Métricas de uso** y análisis de conversaciones

### Optimizaciones Técnicas
- **Streaming de respuestas** para mejor UX
- **Compresión de contexto** para conversaciones largas
- **Sistema de rate limiting** inteligente
- **Múltiples proveedores** de IA como fallback

## 📚 Recursos Adicionales

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Google AI (Gemini) Documentation](https://ai.google.dev/)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

## 🤝 Contribución

Para contribuir a esta implementación:

1. **Fork** del repositorio
2. **Crear branch** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. **Abrir Pull Request**

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.
