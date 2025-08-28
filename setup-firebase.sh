#!/bin/bash

# Script de configuración rápida para Firebase AI
echo "🚀 Configurando Firebase AI para City Chat..."

# Verificar que Firebase CLI esté instalado
if ! command -v firebase &> /dev/null; then
    echo "📦 Instalando Firebase CLI..."
    npm install -g firebase-tools
fi

# Verificar que estemos en el directorio correcto
if [ ! -f "firebase.json" ]; then
    echo "❌ No se encontró firebase.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

echo "✅ Firebase CLI verificado"

# Verificar si ya hay un proyecto configurado
if [ ! -f ".firebaserc" ]; then
    echo "🔧 Configurando proyecto Firebase..."
    echo "Por favor, selecciona tu proyecto Firebase o crea uno nuevo:"
    firebase init --project
else
    echo "✅ Proyecto Firebase ya configurado"
fi

# Verificar variables de entorno
echo "🔍 Verificando variables de entorno..."

if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env desde env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales"
        echo "   - VITE_FIREBASE_API_KEY"
        echo "   - VITE_FIREBASE_AUTH_DOMAIN"
        echo "   - VITE_FIREBASE_PROJECT_ID"
        echo "   - GOOGLE_AI_API_KEY"
    else
        echo "❌ No se encontró env.example"
        exit 1
    fi
else
    echo "✅ Archivo .env encontrado"
fi

# Verificar que las funciones estén construidas
echo "🔨 Verificando funciones de Firebase..."
if [ ! -d "functions/lib" ]; then
    echo "📦 Construyendo funciones..."
    cd functions
    npm run build
    cd ..
else
    echo "✅ Funciones ya construidas"
fi

# Verificar configuración de Firestore
echo "🗄️  Verificando configuración de Firestore..."
if ! firebase projects:list &> /dev/null; then
    echo "🔑 Inicia sesión en Firebase:"
    firebase login
fi

echo ""
echo "🎉 Configuración completada!"
echo ""
echo "📝 Próximos pasos:"
echo "1. Edita el archivo .env con tus credenciales reales"
echo "2. Configura las reglas de Firestore si es necesario"
echo "3. Despliega las funciones: ./deploy-firebase-ai.sh"
echo "4. Prueba el chat IA en tu aplicación"
echo ""
echo "🔧 Comandos útiles:"
echo "   - firebase emulators:start (para pruebas locales)"
echo "   - firebase functions:log (para ver logs)"
echo "   - firebase console (abrir consola web)"
