# 🏛️ Creación Automática de Ciudades para Administradores

## ✅ Funcionalidad Implementada

Cuando un usuario se registra como **administrativo**, automáticamente se ejecutan las siguientes acciones:

### 1. **Creación del Perfil de Usuario**
- ✅ Se crea el perfil en la colección `profiles`
- ✅ Rol: `administrativo`
- ✅ Datos personales: nombre, apellido, email

### 2. **Creación Automática de Ciudad**
- ✅ Se crea una ciudad vinculada al usuario administrativo
- ✅ Nombre: `Ciudad de [Nombre]` (ejemplo: "Ciudad de Juan")
- ✅ Slug único: `ciudad-de-juan-123456` (con timestamp para unicidad)
- ✅ Estado inicial: **Privada** (el admin puede cambiarla a pública)

### 3. **Configuración Inicial de la Ciudad**

La ciudad se crea con la siguiente configuración predeterminada:

```javascript
{
  // Identificación
  name: "Ciudad de [Nombre]",
  slug: "ciudad-de-nombre-123456",
  adminUserId: "[ID del usuario]",
  
  // Estado
  isActive: true,
  isPublic: false, // Privada por defecto
  
  // Configuración del Asistente IA
  assistantName: "Asistente de Ciudad de [Nombre]",
  systemInstruction: "Eres el asistente virtual de [Ciudad]. Tu función es ayudar...",
  
  // Funcionalidades Habilitadas
  enableGoogleSearch: true,
  allowGeolocation: true,
  allowMapDisplay: true,
  currentLanguageCode: "es",
  
  // Prompts Recomendados
  recommendedPrompts: [
    "¿Cómo puedo solicitar un certificado?",
    "¿Cuáles son los horarios de atención?",
    "¿Dónde está ubicado el ayuntamiento?",
    "¿Cómo puedo pagar mis impuestos municipales?",
    "¿Qué servicios municipales están disponibles?"
  ],
  
  // Tags de Servicios
  serviceTags: ["tramites", "informacion", "servicios", "municipal", "ciudadanos"],
  
  // Campos Editables (inicialmente vacíos)
  lat: null,
  lng: null,
  sedeElectronicaUrl: null,
  profileImageUrl: null,
  agendaEventosUrls: null,
  procedureSourceUrls: null,
  uploadedProcedureDocuments: null,
  restrictedCity: null
}
```

## 🎛️ Panel de Administración

Una vez registrado, el usuario administrativo puede acceder a:

### **Ruta**: `/admin`
- ✅ Panel de finetuning del asistente IA
- ✅ Configuración de la ciudad
- ✅ Ajustes del chat y funcionalidades
- ✅ Gestión de prompts recomendados
- ✅ Configuración de restricciones

### **Funcionalidades Editables**:

1. **Información Básica**
   - Nombre de la ciudad
   - Descripción
   - Ubicación (lat/lng)
   - Imagen de perfil

2. **Configuración del Asistente**
   - Nombre del asistente
   - Instrucciones del sistema
   - Personalidad y tono

3. **Funcionalidades**
   - Habilitar/deshabilitar Google Search
   - Permitir geolocalización
   - Mostrar mapas
   - Idioma predeterminado

4. **Recursos y Enlaces**
   - Sede electrónica URL
   - URLs de agenda de eventos
   - URLs de fuentes de procedimientos
   - Documentos subidos

5. **Prompts y Servicios**
   - Prompts recomendados
   - Tags de servicios
   - Categorías

6. **Restricciones**
   - Hacer ciudad pública/privada
   - Configurar restricciones geográficas
   - Controlar acceso

## 🔧 Proceso Técnico

### Registro de Usuario Administrativo:
1. Usuario selecciona rol "Administrativo" en el formulario
2. Firebase Auth crea la cuenta
3. Se crea el documento del perfil en `profiles`
4. **Automáticamente** se ejecuta `createCityForAdmin()`
5. Se crea la ciudad en la colección `cities`
6. Usuario es redirigido a `/admin`

### Identificadores:
- **Profile ID**: `[firebase-user-uid]`
- **City ID**: `city_[firebase-user-uid]`
- **City Slug**: `ciudad-de-nombre-[timestamp]`

## 🚀 Flujo de Usuario

1. **Registro**: Usuario se registra como administrativo
2. **Creación automática**: Se crea su ciudad personal
3. **Redirección**: Va directo al panel `/admin`
4. **Personalización**: Puede editar toda la configuración
5. **Activación**: Puede hacer la ciudad pública cuando esté lista

## ✅ Ventajas

- **Automático**: No requiere pasos manuales
- **Completo**: Ciudad con configuración funcional desde el inicio
- **Personalizable**: Todo se puede editar desde el panel
- **Escalable**: Cada admin tiene su propia ciudad independiente
- **Slug único**: Sin conflictos entre ciudades

## 🔍 Verificación

Para verificar que funciona:

1. Ve a http://localhost:8081/
2. Regístrate como "Administrativo"
3. Verifica que te redirija a `/admin`
4. Comprueba que puedes editar la configuración de tu ciudad
5. Revisa que la ciudad aparece en Firestore con todos los campos