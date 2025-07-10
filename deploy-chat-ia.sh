#!/bin/bash

# Script para desplegar la función chat-ia sin verificación JWT
echo "🚀 Desplegando función chat-ia..."

# Desplegar con configuración específica
supabase functions deploy chat-ia --no-verify-jwt

echo "✅ Función desplegada correctamente"
echo "🔗 Dashboard: https://supabase.com/dashboard/project/irghpvvoparqettcnpnh/functions" 