# 🔧 Configuración Final de MCP en Cursor

## 🎯 Configuración Recomendada

Para que Cursor funcione correctamente con el servidor MCP de Supabase, usa esta configuración:

### 📋 Configuración en Cursor

1. **Abre Cursor**
2. **Presiona `Cmd + ,`** (en macOS) o `Ctrl + ,` (en Windows/Linux)
3. **Busca "MCP"** en la barra de búsqueda
4. **Añade esta configuración:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["mcp/start-mcp-for-cursor.js"],
      "env": {
        "SUPABASE_URL": "https://irghpvvoparqettcnpnh.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo",
        "MCP_API_KEY": "city-chat-mcp-key-2024"
      },
      "description": "Supabase MCP server for City Chat database operations"
    }
  }
}
```

5. **Habilita MCP:**
```json
{
  "mcp.enable": true,
  "mcp.servers.supabase.enabled": true
}
```

## 🚀 Pasos de Configuración

### Paso 1: Preparar el Servidor
```bash
# Asegúrate de estar en el directorio del proyecto
cd /Users/tonillorens/Desktop/CITY%20CHAT/city-chat-app/CITY%20CHAT/city-chat

# Verifica que las dependencias estén instaladas
npm install
```

### Paso 2: Configurar Cursor
1. Copia la configuración JSON de arriba
2. Pégalo en la configuración de MCP de Cursor
3. Guarda la configuración

### Paso 3: Reiniciar Cursor
1. **Cierra Cursor completamente**
2. **Vuelve a abrirlo**
3. **Verifica que la configuración se haya guardado**

## 🧪 Probar la Configuración

### 1. Abrir Chat en Cursor
1. Presiona `Cmd + Shift + L` (o `Ctrl + Shift + L`)
2. Escribe: `@supabase listTables`

### 2. Verificar Respuesta
Deberías ver una respuesta del servidor MCP con las tablas disponibles.

## 🔧 Solución de Problemas

### ❌ Si Cursor no responde:

1. **Verifica la configuración:**
   - Asegúrate de que `mcp.enable` esté en `true`
   - Verifica que la ruta del script sea correcta

2. **Revisa los logs de Cursor:**
   - Abre la consola de desarrollador (`Cmd + Shift + I`)
   - Busca errores relacionados con MCP

3. **Verifica el script:**
   - Asegúrate de que `mcp/start-mcp-for-cursor.js` existe
   - Verifica que tenga permisos de ejecución

### ❌ Si hay errores de conexión:

1. **Verifica que el proyecto esté en la ruta correcta**
2. **Asegúrate de que las dependencias estén instaladas**
3. **Reinicia Cursor después de cambiar la configuración**

## 📝 Comandos de Prueba

Una vez configurado, prueba estos comandos:

- `@supabase listTables` - Listar tablas
- `@supabase queryDatabase table:cities select:name,country` - Consultar ciudades
- `@supabase queryDatabase table:conversations select:*` - Consultar conversaciones

## 🔄 Reiniciar si es Necesario

Si algo no funciona:

1. **Detén cualquier servidor MCP en ejecución**
2. **Reinicia Cursor**
3. **Verifica la configuración**
4. **Prueba de nuevo**

## 📞 Estado de la Instalación

- ✅ **Servidor MCP**: Instalado y configurado
- ✅ **Dependencias**: Instaladas
- ✅ **Scripts**: Creados y configurados
- 🔧 **Cursor**: Requiere configuración manual
- 🧪 **Pruebas**: Listas para ejecutar

## 🎉 ¡Listo!

Una vez configurado Cursor, podrás:

- Consultar tu base de datos directamente desde el asistente
- Crear y gestionar conversaciones programáticamente
- Analizar datos de mensajes y ciudades
- Gestionar contenido extraído de sitios web

---

**Archivo de configuración**: `mcp/cursor-mcp-config-simple.json`  
**Script de inicio**: `mcp/start-mcp-for-cursor.js`  
**Estado**: 🟢 Listo para configurar en Cursor


