import { useState, useEffect, useCallback } from 'react';
import { mcpManager, MCPConnection, FirebaseMCPData, BrowserMCPData, GoogleCloudMCPData } from '../services/mcpManager';

interface UseMCPsState {
  connections: MCPConnection[];
  isLoading: boolean;
  error: string | null;
}

interface UseMCPs {
  state: UseMCPsState;
  connectFirebase: () => Promise<boolean>;
  connectBrowser: () => Promise<boolean>;
  connectGoogleCloud: () => Promise<boolean>;
  disconnectMCP: (mcpId: string) => Promise<boolean>;
  getFirebaseData: () => Promise<FirebaseMCPData | null>;
  navigateToURL: (url: string) => Promise<BrowserMCPData | null>;
  getGoogleCloudData: () => Promise<GoogleCloudMCPData | null>;
  refreshConnections: () => void;
}

export const useMCPs = (): UseMCPs => {
  const [state, setState] = useState<UseMCPsState>({
    connections: [],
    isLoading: false,
    error: null
  });

  const refreshConnections = useCallback(() => {
    const connections = mcpManager.getConnectionsStatus();
    setState(prev => ({ ...prev, connections }));
  }, []);

  const connectFirebase = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const success = await mcpManager.connectFirebaseMCP();
      refreshConnections();
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [refreshConnections]);

  const connectBrowser = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const success = await mcpManager.connectBrowserMCP();
      refreshConnections();
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [refreshConnections]);

  const connectGoogleCloud = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const success = await mcpManager.connectGoogleCloudMCP();
      refreshConnections();
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [refreshConnections]);

  const disconnectMCP = useCallback(async (mcpId: string): Promise<boolean> => {
    try {
      const success = await mcpManager.disconnectMCP(mcpId);
      refreshConnections();
      return success;
    } catch (error) {
      console.error(`Error desconectando ${mcpId}:`, error);
      return false;
    }
  }, [refreshConnections]);

  const getFirebaseData = useCallback(async (): Promise<FirebaseMCPData | null> => {
    try {
      return await mcpManager.getFirebaseData();
    } catch (error) {
      console.error('Error obteniendo datos de Firebase:', error);
      return null;
    }
  }, []);

  const navigateToURL = useCallback(async (url: string): Promise<BrowserMCPData | null> => {
    try {
      return await mcpManager.navigateToURL(url);
    } catch (error) {
      console.error('Error navegando con Browser MCP:', error);
      return null;
    }
  }, []);

  const getGoogleCloudData = useCallback(async (): Promise<GoogleCloudMCPData | null> => {
    try {
      return await mcpManager.getGoogleCloudData();
    } catch (error) {
      console.error('Error obteniendo datos de Google Cloud:', error);
      return null;
    }
  }, []);

  // Actualizar conexiones al montar el hook
  useEffect(() => {
    refreshConnections();
  }, [refreshConnections]);

  // Actualizar conexiones periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      refreshConnections();
    }, 5000); // Cada 5 segundos

    return () => clearInterval(interval);
  }, [refreshConnections]);

  return {
    state,
    connectFirebase,
    connectBrowser,
    connectGoogleCloud,
    disconnectMCP,
    getFirebaseData,
    navigateToURL,
    getGoogleCloudData,
    refreshConnections
  };
};
