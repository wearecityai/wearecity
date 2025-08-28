#!/bin/bash

# Script para desplegar Firebase AI Functions
echo "🚀 Desplegando Firebase AI Functions..."

# Verificar que Firebase CLI esté instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado. Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar que estemos en el directorio correcto
if [ ! -f "firebase.json" ]; then
    echo "❌ No se encontró firebase.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar que las variables de entorno estén configuradas
if [ -z "$GOOGLE_AI_API_KEY" ]; then
    echo "❌ GOOGLE_AI_API_KEY no está configurada. Configúrala en tu entorno o en .env"
    exit 1
fi

echo "✅ Variables de entorno verificadas"

# Construir las funciones
echo "🔨 Construyendo funciones..."
cd functions
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error al construir las funciones"
    exit 1
fi
cd ..

echo "✅ Funciones construidas exitosamente"

# Desplegar solo las funciones
echo "🚀 Desplegando funciones a Firebase..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Firebase AI Functions desplegadas exitosamente!"
    echo "🌐 Las funciones están disponibles en: https://console.firebase.google.com/project/$(firebase use --json | jq -r '.current')/functions"
else
    echo "❌ Error al desplegar las funciones"
    exit 1
fi

echo "🎉 Despliegue completado!"
echo ""
echo "📝 Próximos pasos:"
echo "1. Verifica que las funciones estén funcionando en la consola de Firebase"
echo "2. Prueba el chat IA en tu aplicación"
echo "3. Revisa los logs de las funciones si hay problemas"
echo ""
echo "🔧 Para ver logs en tiempo real: firebase functions:log"
echo "🔧 Para probar localmente: firebase emulators:start --only functions"
