# 🌐 Browser MCP Setup para City Chat

## 🎯 **¿Qué es Browser MCP?**

Browser MCP es un servidor que permite que **Cursor controle tu navegador web** automáticamente. Puedes:

- **🌐 Navegar por sitios web** automáticamente
- **📝 Llenar formularios** programáticamente
- **📊 Extraer información** de páginas web
- **🤖 Automatizar tareas** del navegador
- **🔍 Hacer web scraping** de sitios de ciudades

## ✅ **Instalación Completada**

- ✅ **Paquete instalado**: `@browsermcp/mcp`
- ✅ **Servidor creado**: `mcp/start-browsermcp-server.js`
- ✅ **Script automático**: `mcp/start-browsermcp-auto.sh`
- ✅ **Configuración Cursor**: Actualizada para incluir Browser MCP

## 🚀 **Cómo Usar**

### **Opción 1: Iniciar Solo Browser MCP**
```bash
./mcp/start-browsermcp-auto.sh
```

### **Opción 2: Iniciar Ambos Servidores (Recomendado)**
```bash
./mcp/start-all-mcp-servers.sh
```

### **Opción 3: Iniciar Manualmente**
```bash
node mcp/start-browsermcp-server.js
```

## 🧪 **Comandos Disponibles en Cursor**

Una vez configurado, podrás usar:

- `@browsermcp navigate https://example.com` - Navegar a una URL
- `@browsermcp click "button text"` - Hacer clic en elementos
- `@browsermcp fill "form field" "value"` - Llenar formularios
- `@browsermcp extract "selector"` - Extraer información
- `@browsermcp screenshot` - Tomar captura de pantalla

## 🔧 **Configuración en Cursor**

Tu configuración ya está actualizada para incluir ambos servidores:

```json
{
  "mcpServers": {
    "supabase": { /* Supabase MCP */ },
    "browsermcp": { /* Browser MCP */ }
  }
}
```

## 📱 **Extensiones del Navegador**

Para funcionalidad completa, instala la extensión Browser MCP en tu navegador:

1. **Chrome/Edge**: [Browser MCP Extension](https://chrome.google.com/webstore/detail/browser-mcp/...)
2. **Firefox**: [Browser MCP Add-on](https://addons.mozilla.org/firefox/addon/browser-mcp/)

## 🎯 **Casos de Uso para City Chat**

### **Automatización de Sitios Web de Ciudades**
- Extraer información de eventos de sitios oficiales
- Obtener datos de procedimientos administrativos
- Actualizar información de ciudades automáticamente

### **Web Scraping Inteligente**
- Recopilar datos de múltiples fuentes
- Monitorear cambios en sitios web
- Extraer contenido estructurado

## 🔄 **Reiniciar Cursor**

Después de la configuración:

1. **Cierra Cursor completamente**
2. **Vuelve a abrirlo**
3. **Inicia los servidores MCP**
4. **Prueba los comandos**

## 🚨 **Solución de Problemas**

### **Browser MCP no responde**
- Verifica que la extensión del navegador esté instalada
- Asegúrate de que el servidor esté ejecutándose
- Revisa los logs de Cursor

### **Errores de conexión**
- Verifica que no haya conflictos de puertos
- Asegúrate de que las dependencias estén instaladas
- Revisa la configuración de Cursor

## 📚 **Documentación Adicional**

- [Browser MCP Official Docs](https://docs.browsermcp.io/welcome)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Cursor MCP Integration](https://cursor.sh/docs/mcp)

---

**Estado**: 🟢 **BROWSER MCP INSTALADO Y CONFIGURADO**  
**Próximo**: Reiniciar Cursor e iniciar servidores MCP

