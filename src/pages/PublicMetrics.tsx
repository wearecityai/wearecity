import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { db } from '@/integrations/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface MetricsData {
  totalMessages: number;
  uniqueUsers: number;
  totalConversations: number;
  avgResponseTime: number;
  categoriesData: any[];
}

const PublicMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        console.log('🔍 PublicMetrics: Fetching data for la-vila-joiosa');
        
        // Buscar métricas para la ciudad específica
        const analyticsQuery = query(
          collection(db, 'chat_analytics'),
          where('city_id', '==', 'la-vila-joiosa')
        );
        
        const analyticsSnapshot = await getDocs(analyticsQuery);
        const analyticsData = analyticsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as any));
        
        console.log('📊 Analytics data found:', analyticsData.length, 'records');
        
        // Obtener categorías
        const categoriesSnapshot = await getDocs(collection(db, 'chat_categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as any));
        
        console.log('📂 Categories found:', categoriesData.length);
        
        // Procesar datos
        const totalMessages = analyticsData.length;
        const uniqueUsers = new Set(analyticsData.map(a => a.user_id).filter(Boolean)).size;
        const uniqueSessions = new Set(analyticsData.map(a => a.session_id)).size;
        const avgResponseTime = analyticsData.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / (totalMessages || 1);

        // Mapeo de categorías
        const categoryMapping: Record<string, { name: string, icon: string, color: string }> = {
          'tramites': { name: 'Trámites', icon: '🏛️', color: 'hsl(var(--chart-1))' },
          'eventos': { name: 'Eventos', icon: '🎉', color: 'hsl(var(--chart-2))' },
          'lugares': { name: 'Lugares', icon: '📍', color: 'hsl(var(--chart-3))' },
          'informacion_general': { name: 'Información General', icon: 'ℹ️', color: 'hsl(var(--chart-4))' },
          'turismo': { name: 'Turismo', icon: '🏖️', color: 'hsl(var(--chart-5))' }
        };

        // Estadísticas por categoría
        const categoryStats = categoriesData.map(category => {
          const categoryMessages = analyticsData.filter(a => a.category_id === category.id);
          const mapping = categoryMapping[category.name] || {
            name: category.name,
            icon: '📋',
            color: 'hsl(var(--muted))'
          };
          
          return {
            name: mapping.name,
            icon: mapping.icon,
            value: Math.round((categoryMessages.length / (totalMessages || 1)) * 100),
            count: categoryMessages.length,
            color: mapping.color
          };
        }).filter(cat => cat.count > 0);

        console.log('📈 Processed metrics:', {
          totalMessages,
          uniqueUsers,
          uniqueSessions,
          avgResponseTime: Math.round(avgResponseTime),
          categoryStats
        });

        setMetrics({
          totalMessages,
          uniqueUsers,
          totalConversations: uniqueSessions,
          avgResponseTime: Math.round(avgResponseTime),
          categoriesData: categoryStats
        });
      } catch (error) {
        console.error('❌ Error fetching metrics:', error);
        setMetrics({
          totalMessages: 0,
          uniqueUsers: 0,
          totalConversations: 0,
          avgResponseTime: 0,
          categoriesData: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <span>Cargando métricas...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Métricas Públicas - La Vila Joiosa</h1>
            <p className="text-muted-foreground">
              Datos reales del chat (para debugging)
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            Última actualización: Hoy
          </Badge>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-input">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalMessages || 0}</div>
              <p className="text-xs text-muted-foreground">
                Todos los mensajes registrados
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-input">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.uniqueUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios diferentes que han usado el chat
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-input">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalConversations || 0}</div>
              <p className="text-xs text-muted-foreground">
                Sesiones de chat diferentes
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-input">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Respuesta</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.avgResponseTime || 0}ms</div>
              <p className="text-xs text-muted-foreground">
                Tiempo promedio de respuesta
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <Card className="border-0 bg-input">
          <CardHeader>
            <CardTitle>Distribución por Temáticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(metrics?.categoriesData || []).map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{topic.icon}</span>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: topic.color }}
                      />
                    </div>
                    <span className="font-medium">{topic.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${topic.value}%`, 
                          backgroundColor: topic.color 
                        }}
                      />
                    </div>
                    <div className="text-right min-w-[60px]">
                      <span className="text-sm font-medium">{topic.value}%</span>
                      <div className="text-xs text-muted-foreground">({topic.count})</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicMetrics;