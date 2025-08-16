# 🔧 Configuración de MCP en Cursor

## 📋 Pasos para Configurar Cursor

### 1. Abrir Configuración de Cursor

1. Abre Cursor
2. Presiona `Cmd + ,` (en macOS) o `Ctrl + ,` (en Windows/Linux)
3. Busca "MCP" en la barra de búsqueda

### 2. Configurar el Servidor MCP

En la configuración de MCP, añade esta configuración:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "http",
      "args": ["http://localhost:3000"],
      "env": {
        "MCP_API_KEY": "city-chat-mcp-key-2024"
      },
      "description": "Supabase MCP server for City Chat database operations"
    }
  }
}
```

### 3. Habilitar MCP

Asegúrate de que estas configuraciones estén habilitadas:

```json
{
  "mcp.enable": true,
  "mcp.servers.supabase.enabled": true
}
```

## 🚀 Verificar Configuración

### 1. Asegúrate de que el servidor esté funcionando

```bash
# En tu terminal, ejecuta:
./mcp/start-mcp-simple.sh
```

### 2. Verifica que el servidor responda

```bash
curl http://localhost:3000/.well-known/mcp-manifest
```

### 3. En Cursor, abre el chat y prueba:

```
@supabase listTables
```

## 🔑 Información de Autenticación

- **API Key**: `city-chat-mcp-key-2024`
- **URL del servidor**: `http://localhost:3000`
- **Transporte**: HTTP

## 🛠️ Solución de Problemas

### Si Cursor no se conecta:

1. **Verifica que el servidor esté funcionando**:
   ```bash
   curl http://localhost:3000/.well-known/mcp-manifest
   ```

2. **Revisa los logs de Cursor**:
   - Abre la consola de desarrollador (`Cmd + Shift + I`)
   - Busca errores relacionados con MCP

3. **Verifica la configuración**:
   - Asegúrate de que `mcp.enable` esté en `true`
   - Verifica que la URL sea correcta

### Si hay errores de autenticación:

1. **Verifica la API key**:
   - Debe ser exactamente: `city-chat-mcp-key-2024`
   - No debe tener espacios extra

2. **Reinicia Cursor** después de cambiar la configuración

## 📝 Comandos de Prueba

Una vez configurado, puedes probar estos comandos en Cursor:

- `@supabase listTables` - Listar tablas disponibles
- `@supabase queryDatabase table:cities select:name,country` - Consultar ciudades
- `@supabase queryDatabase table:conversations select:*` - Consultar conversaciones

## 🔄 Reiniciar Servicios

Si algo no funciona:

1. **Detén el servidor MCP** (Ctrl+C en la terminal)
2. **Reinicia Cursor**
3. **Vuelve a iniciar el servidor MCP**:
   ```bash
   ./mcp/start-mcp-simple.sh
   ```

## 📞 Soporte

Si sigues teniendo problemas:

1. Verifica que el servidor esté funcionando en `http://localhost:3000`
2. Revisa los logs de Cursor en la consola de desarrollador
3. Asegúrate de que no haya conflictos de puertos


