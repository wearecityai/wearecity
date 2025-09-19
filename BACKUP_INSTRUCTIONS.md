# 🚀 Guía Completa de Backup de Firebase

Esta guía te ayudará a crear una copia de seguridad completa de tu aplicación Firebase, incluyendo todos los servicios y datos.

## 📋 Scripts Disponibles

### 1. `backup_complete_master.sh` - ⭐ **RECOMENDADO**
**Script maestro que ejecuta todos los backups automáticamente**
```bash
./backup_complete_master.sh
```

### 2. `backup_source_code.sh` - Backup del Código Fuente
```bash
./backup_source_code.sh
```

### 3. `backup_firebase_complete.sh` - Backup de Firebase
```bash
./backup_firebase_complete.sh
```

### 4. `backup_google_cloud.sh` - Backup de Google Cloud
```bash
./backup_google_cloud.sh
```

## 🎯 ¿Qué se incluye en cada backup?

### 💻 Código Fuente (`backup_source_code.sh`)
- ✅ Todo el código fuente (src/, public/, functions/)
- ✅ Configuraciones (package.json, firebase.json, etc.)
- ✅ Dependencias (listadas, sin node_modules)
- ✅ Documentación y scripts
- ✅ Configuraciones de desarrollo
- ✅ Información del sistema

### 🔥 Firebase (`backup_firebase_complete.sh`)
- ✅ Firebase Functions (código fuente)
- ✅ Firestore (datos exportados a Google Cloud Storage)
- ✅ Authentication (usuarios y configuración)
- ✅ Hosting (archivos web)
- ✅ Storage (archivos)
- ✅ Configuración del proyecto
- ✅ Logs de servicios

### ☁️ Google Cloud (`backup_google_cloud.sh`)
- ✅ Cloud Functions (configuración)
- ✅ Firestore (exportación completa)
- ✅ Authentication (usuarios)
- ✅ Storage (archivos)
- ✅ Cloud Run (servicios)
- ✅ Configuración de IAM
- ✅ APIs habilitadas
- ✅ Logs detallados

## 🚀 Ejecución Rápida

### Opción 1: Backup Completo (Recomendado)
```bash
# Ejecutar backup completo automáticamente
./backup_complete_master.sh
```

### Opción 2: Backups Individuales
```bash
# 1. Backup del código fuente
./backup_source_code.sh

# 2. Backup de Firebase
./backup_firebase_complete.sh

# 3. Backup de Google Cloud
./backup_google_cloud.sh
```

## 📦 Resultado

Después de ejecutar cualquier script, obtendrás:

### Archivos Generados
- `backup_*.tar.gz` - Archivos comprimidos con todo el contenido
- `*_summary.txt` - Archivos de resumen con instrucciones de restauración

### Estructura de Directorios
```
backup_complete_YYYYMMDD_HHMMSS/
├── backup_source_*.tar.gz      # Código fuente
├── backup_firebase_*.tar.gz    # Firebase
├── backup_gcloud_*.tar.gz      # Google Cloud
└── COMPLETE_BACKUP_SUMMARY.txt # Resumen completo
```

## 🔧 Requisitos Previos

### Herramientas Necesarias
- ✅ Firebase CLI (`firebase --version`)
- ✅ Google Cloud CLI (`gcloud --version`)
- ✅ Node.js y npm
- ✅ Permisos de administrador en el proyecto Firebase

### Verificar Instalación
```bash
# Verificar Firebase CLI
firebase --version

# Verificar Google Cloud CLI
gcloud --version

# Verificar autenticación
firebase login
gcloud auth login
```

## 🛠️ Solución de Problemas

### Error: "Permission denied"
```bash
chmod +x *.sh
```

### Error: "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Error: "Google Cloud CLI not found"
```bash
# Instalar Google Cloud CLI según tu sistema operativo
# Ver: https://cloud.google.com/sdk/docs/install
```

### Error: "Project not found"
```bash
# Verificar proyecto actual
firebase use

# Cambiar proyecto si es necesario
firebase use wearecity-2ab89
```

## 📖 Restauración

### 1. Restaurar Código Fuente
```bash
# Extraer backup
tar -xzf backup_source_*.tar.gz
cd backup_source_*/

# Instalar dependencias
npm install
cd functions && npm install && cd ..

# Configurar Firebase
firebase use [PROJECT_ID]
```

### 2. Restaurar Firebase
```bash
# Extraer backup
tar -xzf backup_firebase_*.tar.gz
cd backup_firebase_*/

# Seguir instrucciones en backup_summary.txt
```

### 3. Restaurar Google Cloud
```bash
# Extraer backup
tar -xzf backup_gcloud_*.tar.gz
cd backup_gcloud_*/

# Seguir instrucciones en gcloud_backup_summary.txt
```

## 🔒 Seguridad

### Datos Sensibles
- ✅ Variables de entorno están ocultadas (`***HIDDEN***`)
- ✅ API keys no se incluyen en el backup
- ✅ Solo se guardan plantillas de configuración

### Recomendaciones
- 🔐 Guarda los backups en ubicaciones seguras
- 🔐 Usa cifrado para almacenar backups
- 🔐 Verifica regularmente la integridad de los archivos
- 🔐 Prueba la restauración en entornos de prueba

## 📊 Tamaños Típicos

| Tipo de Backup | Tamaño Aproximado |
|----------------|-------------------|
| Código Fuente  | 10-50 MB          |
| Firebase       | 100-500 MB        |
| Google Cloud   | 200-1000 MB       |
| **Total**      | **300-1500 MB**   |

## 🕐 Tiempo de Ejecución

| Script | Tiempo Aproximado |
|--------|-------------------|
| Código Fuente | 1-2 minutos |
| Firebase | 5-15 minutos |
| Google Cloud | 10-30 minutos |
| **Completo** | **15-45 minutos** |

## 📞 Soporte

Si encuentras problemas:

1. 📋 Revisa los archivos de log generados
2. 🔍 Verifica los permisos de tu cuenta
3. 📚 Consulta la documentación de Firebase/Google Cloud
4. 🆘 Contacta al administrador del proyecto

## 🎉 ¡Listo!

Con estos scripts tienes una solución completa de backup para tu aplicación Firebase. Ejecuta `./backup_complete_master.sh` para obtener una copia de seguridad completa y segura de todo tu proyecto.

---

**⚠️ Importante:** Siempre prueba la restauración en un entorno de prueba antes de confiar completamente en los backups.
