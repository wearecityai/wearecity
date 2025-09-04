# 🌆 WeAreCity - Chat IA Inteligente para Ciudades

[![Firebase AI Logic](https://img.shields.io/badge/Firebase-AI%20Logic-blue.svg)](https://firebase.google.com/docs/ai-logic)
[![MCP Support](https://img.shields.io/badge/MCP-Supported-green.svg)](https://modelcontextprotocol.io/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)

## 📋 Descripción

**WeAreCity** es una aplicación de chat IA inteligente diseñada para conectar ciudadanos con sus ciudades. Utiliza **Firebase AI Logic** con Google AI (Gemini) para proporcionar respuestas contextuales sobre servicios municipales, eventos, lugares de interés y cualquier consulta relacionada con la vida urbana.

## 🚀 Características Principales

### 🤖 **Chat IA Inteligente**
- **Firebase AI Logic** con modelos Gemini 2.5 Flash/Pro
- **Respuestas contextuales** basadas en la ciudad del usuario
- **Historial de conversación** persistente
- **Modos de respuesta**: Rápido y Calidad

### 🏙️ **Sistema de Ciudades**
- **Gestión de múltiples ciudades** con configuración personalizada
- **Contexto geográfico** para respuestas localizadas
- **Cambio dinámico** entre ciudades
- **Historial de conversaciones** por ciudad

### 🔌 **Integración MCP (Model Context Protocol)**
- **Firebase MCP** para que la IA acceda a la base de datos
- **Browser MCP** para que la IA navegue en la web
- **Google Cloud MCP** para que la IA use servicios de Google
- **Herramientas para IA** - Solo para uso del asistente, no para usuarios finales

### 🎨 **Interfaz Moderna**
- **Shadcn/ui** para componentes de alta calidad
- **Material Design 3** con iconos rounded
- **Tema claro/oscuro** automático
- **Responsive design** para móvil y desktop

## 🏗️ Arquitectura

```
Frontend (React + TypeScript)
    ↓
Firebase AI Logic (Gemini 2.5)
    ↓
Firebase Services (Auth, Firestore, Functions)
    ↓
MCP Servers (Firebase, Browser, Google Cloud)
```

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **React 18.3.1** con TypeScript 5.5.3
- **Vite** para build y desarrollo
- **Tailwind CSS** con Shadcn/ui
- **React Router** para navegación
- **React Query** para gestión de estado

### **Backend & IA**
- **Firebase AI Logic** con Google AI (Gemini)
- **Firebase Authentication** para usuarios
- **Cloud Firestore** para base de datos
- **Firebase Functions** para lógica de servidor

### **MCP (Model Context Protocol)**
- **@gannonh/firebase-mcp** para servicios Firebase
- **@browsermcp/mcp** para navegación web
- **google-cloud-mcp** para servicios Google Cloud

### **Herramientas de Desarrollo**
- **ESLint** para linting de código
- **Prettier** para formateo
- **TypeScript** para tipado estático
- **Vite** para build optimizado

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+ o Bun
- Cuenta de Firebase con plan Blaze
- Google AI API habilitada

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/wearecityai/wearecity.git
cd wearecity
```

### **2. Instalar Dependencias**
```bash
npm install
# o
bun install
```

### **3. Configurar Variables de Entorno**
```bash
cp env.example .env
```

Editar `.env` con tus credenciales:
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase AI Logic Region
VITE_FIREBASE_AI_REGION=us-central1

# MCP Configuration (opcional)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
```

### **4. Configurar Firebase AI Logic**
```bash
# Habilitar Firebase AI Logic en Firebase Console
# Build → AI Logic → Get Started
```

### **5. Iniciar MCPs (Opcional)**
```bash
chmod +x start-mcps.sh
./start-mcps.sh
```

### **6. Ejecutar la Aplicación**
```bash
npm run dev
# o
bun dev
```

## 🔧 Scripts Disponibles

### **Desarrollo**
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de producción
npm run lint         # Ejecutar ESLint
```

### **Firebase**
```bash
./setup-firebase.sh      # Configuración inicial de Firebase
./deploy-firebase-ai.sh  # Desplegar funciones de Firebase AI
```

### **MCPs (Herramientas para IA)**
```bash
./start-mcps.sh          # Iniciar herramientas MCP para la IA
```

## 📱 Uso de la Aplicación

### **Chat IA**
1. **Seleccionar ciudad** desde el selector
2. **Escribir mensaje** en el chat
3. **Recibir respuesta** contextual de la IA
4. **Ver historial** de conversación

### **Gestión de MCPs (Herramientas para IA)**
1. **Acceder al componente MCPManager**
2. **Conectar herramientas** MCP para que la IA las use
3. **Monitorear estado** de conexiones
4. **Usar funcionalidades** avanzadas

### **Configuración de Ciudades**
1. **Acceder a configuración** de ciudades
2. **Añadir nueva ciudad** con datos
3. **Configurar servicios** específicos
4. **Personalizar respuestas** de IA

## 🎯 Casos de Uso

### **Para Ciudadanos**
- 📍 **Información local** sobre servicios municipales
- 🎭 **Eventos y actividades** en la ciudad
- 🏥 **Servicios de emergencia** y contacto
- 🚌 **Transporte público** y rutas
- 🏛️ **Trámites administrativos** y horarios

### **Para Administraciones**
- 📊 **Análisis de consultas** ciudadanas
- 🤖 **Automatización** de respuestas frecuentes
- 📈 **Métricas de satisfacción** ciudadana
- 🔄 **Integración** con sistemas municipales

### **Para Desarrolladores**
- 🔌 **APIs MCP** para integraciones
- 🚀 **SDK de Firebase AI Logic**
- 📱 **Componentes React** reutilizables
- 🎨 **Sistema de diseño** consistente

## 🔍 Características Técnicas

### **Firebase AI Logic**
- **Modelos Gemini 2.5** Flash y Pro
- **Contexto de ciudad** integrado
- **Historial de conversación** configurable
- **Modos de respuesta** optimizados

### **Sistema MCP**
- **Protocolo estándar** para máxima compatibilidad
- **Conexiones automáticas** a servidores
- **Gestión de estado** en tiempo real
- **Manejo robusto** de errores

### **Performance**
- **Lazy loading** de componentes
- **Optimización de imágenes** automática
- **Caching inteligente** de respuestas
- **Build optimizado** con Vite

## 🚨 Solución de Problemas

### **Error: "Firebase AI Logic not available"**
- Verificar plan de precios Blaze
- Habilitar Firebase AI Logic API
- Verificar variables de entorno

### **Error: "MCP connection failed"**
- Verificar que los servidores MCP estén ejecutándose
- Verificar credenciales de Google Cloud
- Revisar logs de conexión

### **Error: "City not found"**
- Verificar configuración de ciudades en Firebase
- Verificar permisos de Firestore
- Revisar reglas de seguridad

## 🔮 Roadmap

### **Próximas Versiones**
- 🌐 **Multiidioma** con traducción automática
- 📱 **App móvil** nativa (React Native)
- 🤖 **Chatbots** para redes sociales
- 📊 **Analytics avanzados** de uso

### **Integraciones Futuras**
- 🗺️ **Google Maps** para ubicaciones
- 📰 **APIs de noticias** locales
- 🚨 **Sistemas de alertas** municipales
- 💳 **Pagos online** para servicios

## 🤝 Contribución

### **Cómo Contribuir**
1. **Fork** del repositorio
2. **Crear branch** para tu feature
3. **Commit** tus cambios
4. **Push** al branch
5. **Abrir Pull Request**

### **Estándares de Código**
- **TypeScript** para todo el código
- **ESLint** para consistencia
- **Prettier** para formateo
- **Tests** para nuevas funcionalidades

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

### **Documentación**
- [Firebase AI Logic Setup](firebase-ai-logic-setup.md)
- [MCP Implementation](MCP_IMPLEMENTATION.md)
- [Firebase AI Implementation](FIREBASE_AI_IMPLEMENTATION.md)

### **Contacto**
- **Issues**: [GitHub Issues](https://github.com/wearecityai/wearecity/issues)
- **Discussions**: [GitHub Discussions](https://github.com/wearecityai/wearecity/discussions)
- **Wiki**: [Documentación del proyecto](https://github.com/wearecityai/wearecity/wiki)

## 🙏 Agradecimientos

- **Google Firebase** por Firebase AI Logic
- **Google AI** por los modelos Gemini
- **Shadcn/ui** por los componentes de UI
- **Model Context Protocol** por el estándar MCP
- **Comunidad open source** por las herramientas utilizadas

---

**🌆 Construyendo ciudades más inteligentes, una conversación a la vez.**

*Desarrollado con ❤️ por el equipo de WeAreCity*
