import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { httpsCallable, getFunctions } from 'firebase/functions';

const functions = getFunctions();

const DebugMetrics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompleteSetup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const setupFn = httpsCallable(functions, 'setupAndFixMetrics');
      const result = await setupFn({});
      console.log('🔧 Complete setup results:', result.data);
      setData(result.data);
    } catch (err) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'Error en setup completo');
    }
    
    setLoading(false);
  };

  const handleMigration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const migrateFn = httpsCallable(functions, 'migrateMetricsData');
      const result = await migrateFn({});
      console.log('🔄 Migration results:', result.data);
      setData({ migration: result.data });
    } catch (err) {
      console.error('Migration error:', err);
      setError(err instanceof Error ? err.message : 'Error en migración');
    }
    
    setLoading(false);
  };

  const handleDebugMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const debugFn = httpsCallable(functions, 'debugMetrics');
      const result = await debugFn({});
      setData(result.data);
      console.log('🔍 Debug results:', result.data);
    } catch (err) {
      console.error('Debug error:', err);
      setError(err instanceof Error ? err.message : 'Error al hacer debugging');
    }
    
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🔍 Debug Métricas</h3>
      
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={handleCompleteSetup} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? 'Configurando...' : '🔧 Setup Completo'}
        </Button>
        
        <Button 
          onClick={handleDebugMetrics} 
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Debugeando...' : 'Debug Data'}
        </Button>
        
        <Button 
          onClick={handleMigration} 
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Migrando...' : 'Migrar Datos'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {data.migration && (
            <div>
              <h4 className="font-semibold">🔄 Resultados de Migración:</h4>
              <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                {JSON.stringify(data.migration, null, 2)}
              </pre>
            </div>
          )}
          
          {data.counts && (
            <div>
              <h4 className="font-semibold">📊 Contadores:</h4>
              <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                {JSON.stringify(data.counts, null, 2)}
              </pre>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold">📂 Categorías ({data.categories?.length || 0}):</h4>
            <pre className="text-sm bg-white p-2 rounded border overflow-x-auto max-h-40">
              {JSON.stringify(data.categories, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="font-semibold">📈 Analytics (10 primeros):</h4>
            <pre className="text-sm bg-white p-2 rounded border overflow-x-auto max-h-40">
              {JSON.stringify(data.analytics, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="font-semibold">🏙️ Datos de la-vila-joiosa ({data.cityData?.length || 0}):</h4>
            <pre className="text-sm bg-white p-2 rounded border overflow-x-auto max-h-40">
              {JSON.stringify(data.cityData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugMetrics;