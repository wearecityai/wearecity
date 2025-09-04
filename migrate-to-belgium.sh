#!/bin/bash

echo "🇧🇪 Migrando funciones de Firebase a Bélgica (europe-west1)..."

# Lista de funciones a migrar
FUNCTIONS=(
    "chatIA"
    "chatIAVertex"
    "chatIAVertexHttp"
    "configureCityInstructions"
    "configureGenericInstructions"
    "getCityInstructions"
    "intelligentSearch"
    "searchByCategory"
    "searchEvents"
    "searchPlaces"
    "testVertexAI"
    "testVertexAIHttp"
)

echo "📋 Funciones a migrar:"
for func in "${FUNCTIONS[@]}"; do
    echo "  - $func"
done

echo ""
echo "⚠️  ADVERTENCIA: Esto eliminará las funciones existentes en us-central1"
echo "   y las recreará en europe-west1 (Bélgica)"
echo ""
read -p "¿Continuar? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migración cancelada"
    exit 1
fi

echo ""
echo "🗑️  Eliminando funciones existentes en us-central1..."

# Eliminar funciones existentes
for func in "${FUNCTIONS[@]}"; do
    echo "  Eliminando $func..."
    firebase functions:delete "$func" --region us-central1 --force
done

echo ""
echo "🚀 Desplegando funciones en europe-west1 (Bélgica)..."

# Desplegar en nueva región
firebase deploy --only functions

echo ""
echo "✅ Migración completada!"
echo "🌍 Todas las funciones ahora están en europe-west1 (Bélgica)"
echo "🇪🇸 Mejor latencia para usuarios en España"
echo "📅 Zona horaria: Europe/Brussels (CET/CEST)"
