# Supabase MCP Server para City Chat

Este servidor MCP (Model Context Protocol) te permite interactuar con tu base de datos de Supabase directamente desde asistentes de IA compatibles con MCP.

## 🚀 Instalación

Las dependencias ya están instaladas en tu proyecto:
- `supabase-mcp`: Servidor MCP para Supabase
- `@modelcontextprotocol/sdk`: SDK oficial de MCP

## 📁 Archivos

- `supabase-mcp-advanced.js`: Servidor MCP principal con configuración completa
- `supabase-mcp.js`: Versión básica del servidor
- `cursor-mcp-config.json`: Configuración para Cursor
- `start-mcp.sh`: Script de inicio automático
- `README.md`: Este archivo

## 🔧 Uso

### 1. Iniciar el servidor MCP

```bash
# Opción 1: Usar el script automático
./mcp/start-mcp.sh

# Opción 2: Ejecutar directamente
node mcp/supabase-mcp-advanced.js
```

### 2. Configurar en Cursor

1. Abre la configuración de Cursor
2. Busca "MCP" en la configuración
3. Añade la configuración del archivo `cursor-mcp-config.json`

### 3. Operaciones disponibles

El servidor MCP te permite realizar operaciones CRUD en:

- **cities**: Tabla de ciudades con ubicación y metadatos
- **conversations**: Conversaciones de chat para cada ciudad
- **messages**: Mensajes individuales de chat
- **crawls_documents**: Documentos extraídos de sitios web de ciudades

## 🛠️ Funcionalidades

- ✅ Operaciones CRUD completas
- ✅ Consultas SQL personalizadas
- ✅ Manejo de errores robusto
- ✅ Configuración automática de tablas
- ✅ Integración con tu base de datos existente

## 🔒 Seguridad

- Usa la clave pública de Supabase (segura para el cliente)
- No almacena sesiones de autenticación
- Operaciones limitadas a las tablas especificadas

## 📝 Ejemplos de uso

Una vez configurado, podrás usar comandos como:

- "Muestra todas las ciudades"
- "Crea una nueva conversación para Valencia"
- "Busca mensajes sobre eventos en Barcelona"
- "Actualiza la información de la ciudad de Madrid"

## 🚨 Solución de problemas

### El servidor no inicia
- Verifica que Node.js esté instalado
- Ejecuta `npm install` para instalar dependencias
- Revisa los logs de error

### No se conecta a la base de datos
- Verifica que las credenciales de Supabase sean correctas
- Asegúrate de que la base de datos esté activa
- Revisa la conectividad de red

## 🔗 Enlaces útiles

- [Documentación de MCP](https://modelcontextprotocol.io/)
- [Supabase MCP](https://www.npmjs.com/package/supabase-mcp)
- [Documentación de Supabase](https://supabase.com/docs)

## 📞 Soporte

Para problemas específicos del servidor MCP, revisa los logs del servidor. Para problemas de Supabase, consulta la documentación oficial.


