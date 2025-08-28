import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

export interface MCPConnection {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected?: Date;
  error?: string;
}

export interface FirebaseMCPData {
  projectId: string;
  collections: string[];
  documents: any[];
  functions: string[];
}

export interface BrowserMCPData {
  url: string;
  title: string;
  content: string;
  screenshots: string[];
}

/**
 * Gestor de MCPs para Firebase y Browser View
 */
export class MCPManager {
  private static instance: MCPManager;
  private connections: Map<string, MCPConnection> = new Map();
  private clients: Map<string, Client> = new Map();

  private constructor() {
    this.initializeConnections();
  }

  public static getInstance(): MCPManager {
    if (!MCPManager.instance) {
      MCPManager.instance = new MCPManager();
    }
    return MCPManager.instance;
  }

  /**
   * Inicializar conexiones MCP
   */
  private async initializeConnections() {
    // Firebase MCP
    this.addConnection({
      id: 'firebase',
      name: 'Firebase MCP',
      status: 'disconnected'
    });

    // Browser MCP
    this.addConnection({
      id: 'browser',
      name: 'Browser MCP',
      status: 'disconnected'
    });

    // Google Cloud MCP
    this.addConnection({
      id: 'google-cloud',
      name: 'Google Cloud MCP',
      status: 'disconnected'
    });
  }

  /**
   * Añadir nueva conexión MCP
   */
  private addConnection(connection: MCPConnection) {
    this.connections.set(connection.id, connection);
  }

  /**
   * Conectar a Firebase MCP
   */
  async connectFirebaseMCP(): Promise<boolean> {
    try {
      const connection = this.connections.get('firebase');
      if (!connection) return false;

      connection.status = 'connecting';
      this.connections.set('firebase', connection);

      // Iniciar proceso del servidor Firebase MCP
      const firebaseMCP = spawn('npx', ['@gannonh/firebase-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
          GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS
        }
      });

      // Crear cliente MCP
      const transport = new StdioClientTransport(firebaseMCP.stdin, firebaseMCP.stdout);
      const client = new Client({
        name: 'firebase-mcp-client',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      });

      await client.connect(transport);
      this.clients.set('firebase', client);

      // Actualizar estado de conexión
      connection.status = 'connected';
      connection.lastConnected = new Date();
      this.connections.set('firebase', connection);

      console.log('🚀 Firebase MCP conectado exitosamente');
      return true;

    } catch (error) {
      console.error('❌ Error conectando Firebase MCP:', error);
      
      const connection = this.connections.get('firebase');
      if (connection) {
        connection.status = 'error';
        connection.error = error instanceof Error ? error.message : 'Error desconocido';
        this.connections.set('firebase', connection);
      }
      
      return false;
    }
  }

  /**
   * Conectar a Browser MCP
   */
  async connectBrowserMCP(): Promise<boolean> {
    try {
      const connection = this.connections.get('browser');
      if (!connection) return false;

      connection.status = 'connecting';
      this.connections.set('browser', connection);

      // Iniciar proceso del servidor Browser MCP
      const browserMCP = spawn('npx', ['@browsermcp/mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          BROWSER_MCP_PORT: '3001'
        }
      });

      // Crear cliente MCP
      const transport = new StdioClientTransport(browserMCP.stdin, browserMCP.stdout);
      const client = new Client({
        name: 'browser-mcp-client',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      });

      await client.connect(transport);
      this.clients.set('browser', client);

      // Actualizar estado de conexión
      connection.status = 'connected';
      connection.lastConnected = new Date();
      this.connections.set('browser', connection);

      console.log('🌐 Browser MCP conectado exitosamente');
      return true;

    } catch (error) {
      console.error('❌ Error conectando Browser MCP:', error);
      
      const connection = this.connections.get('browser');
      if (connection) {
        connection.status = 'error';
        connection.error = error instanceof Error ? error.message : 'Error desconocido';
        this.connections.set('browser', connection);
      }
      
      return false;
    }
  }

  /**
   * Obtener datos de Firebase usando MCP
   */
  async getFirebaseData(): Promise<FirebaseMCPData | null> {
    try {
      const client = this.clients.get('firebase');
      if (!client) {
        throw new Error('Firebase MCP no está conectado');
      }

      // Aquí implementarías las llamadas específicas al MCP de Firebase
      // Por ahora retornamos datos de ejemplo
      return {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'unknown',
        collections: ['conversations', 'users', 'cities'],
        documents: [],
        functions: ['chatIA']
      };

    } catch (error) {
      console.error('❌ Error obteniendo datos de Firebase MCP:', error);
      return null;
    }
  }

  /**
   * Navegar a una URL usando Browser MCP
   */
  async navigateToURL(url: string): Promise<BrowserMCPData | null> {
    try {
      const client = this.clients.get('browser');
      if (!client) {
        throw new Error('Browser MCP no está conectado');
      }

      // Aquí implementarías las llamadas específicas al MCP del navegador
      // Por ahora retornamos datos de ejemplo
      return {
        url,
        title: 'Página cargada',
        content: 'Contenido de la página',
        screenshots: []
      };

    } catch (error) {
      console.error('❌ Error navegando con Browser MCP:', error);
      return null;
    }
  }

  /**
   * Obtener estado de todas las conexiones
   */
  getConnectionsStatus(): MCPConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Verificar si un MCP está conectado
   */
  isConnected(mcpId: string): boolean {
    const connection = this.connections.get(mcpId);
    return connection?.status === 'connected';
  }

  /**
   * Desconectar un MCP
   */
  async disconnectMCP(mcpId: string): Promise<boolean> {
    try {
      const client = this.clients.get(mcpId);
      if (client) {
        await client.close();
        this.clients.delete(mcpId);
      }

      const connection = this.connections.get(mcpId);
      if (connection) {
        connection.status = 'disconnected';
        this.connections.set(mcpId, connection);
      }

      console.log(`🔌 ${mcpId} MCP desconectado`);
      return true;

    } catch (error) {
      console.error(`❌ Error desconectando ${mcpId} MCP:`, error);
      return false;
    }
  }

  /**
   * Desconectar todos los MCPs
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map(id => this.disconnectMCP(id));
    await Promise.all(promises);
  }
}

// Exportar instancia singleton
export const mcpManager = MCPManager.getInstance();
