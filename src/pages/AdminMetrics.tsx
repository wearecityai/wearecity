import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthFirebase';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Calendar, MessageSquare, Users, TrendingUp, BarChart3, PieChart, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface MetricsData {
  totalMessages: number;
  uniqueUsers: number;
  totalConversations: number;
  avgResponseTime: number;
  dailyData: any[];
  categoriesData: any[];
  monthlyTrends: any[];
  hourlyData: any[];
}

const AdminMetrics: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [period, setPeriod] = useState<
    'all' | '24h' | '7d' | '1m' | '6m' | '1y' | '5y'
  >('all');

  if (isLoading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (profile?.role !== 'administrativo') return <Navigate to="/" replace />;

  // Obtener ID de la ciudad del admin
  useEffect(() => {
    const fetchCityId = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('cities')
        .select('id')
        .eq('admin_user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setCityId(data.id);
      }
    };
    
    fetchCityId();
  }, [user?.id]);

  // Helper para calcular fecha inicial según periodo
  const getFromDate = (): string | null => {
    const now = new Date();
    const d = new Date(now);
    switch (period) {
      case '24h': d.setDate(d.getDate() - 1); return d.toISOString();
      case '7d': d.setDate(d.getDate() - 7); return d.toISOString();
      case '1m': d.setMonth(d.getMonth() - 1); return d.toISOString();
      case '6m': d.setMonth(d.getMonth() - 6); return d.toISOString();
      case '1y': d.setFullYear(d.getFullYear() - 1); return d.toISOString();
      case '5y': d.setFullYear(d.getFullYear() - 5); return d.toISOString();
      default: return null;
    }
  };

  // Cargar métricas reales
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!cityId) return;
      
      setLoading(true);
      
      try {
        // Métricas totales (con filtro de periodo si aplica)
        const fromIso = getFromDate();
        let query = supabase
          .from('chat_analytics')
          .select('*')
          .eq('city_id', cityId);
        if (fromIso) query = query.gte('created_at', fromIso);
        const { data: analyticsData } = await query;

        const { data: categoriesData } = await supabase
          .from('chat_categories')
          .select('*');

        // Procesar datos
        const totalMessages = analyticsData?.length || 0;
        const uniqueUsers = new Set(analyticsData?.map(a => a.user_id).filter(Boolean)).size;
        const uniqueSessions = new Set(analyticsData?.map(a => a.session_id)).size;
        const avgResponseTime = analyticsData?.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / (totalMessages || 1);

        // Datos por día (últimos 7 días)
        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toDateString();
          
          const dayMessages = analyticsData?.filter(a => 
            new Date(a.created_at).toDateString() === dateStr
          ) || [];
          
          dailyData.push({
            day: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()],
            messages: dayMessages.length,
            users: new Set(dayMessages.map(m => m.user_id).filter(Boolean)).size
          });
        }

        // Datos por categoría
        const categoryStats = categoriesData?.map(category => {
          const categoryMessages = analyticsData?.filter(a => a.category_id === category.id) || [];
          return {
            name: category.name === 'tramites' ? 'Trámites' :
                  category.name === 'eventos' ? 'Eventos' :
                  category.name === 'lugares' ? 'Lugares' :
                  category.name === 'informacion_general' ? 'Información General' :
                  category.name === 'turismo' ? 'Turismo' : category.name,
            value: Math.round((categoryMessages.length / (totalMessages || 1)) * 100),
            count: categoryMessages.length,
            color: category.name === 'tramites' ? 'hsl(var(--chart-1))' :
                   category.name === 'eventos' ? 'hsl(var(--chart-2))' :
                   category.name === 'lugares' ? 'hsl(var(--chart-3))' :
                   category.name === 'informacion_general' ? 'hsl(var(--chart-4))' :
                   'hsl(var(--chart-5))'
          };
        }) || [];

        // Datos mensuales (últimos 6 meses)
        const monthlyTrends = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
          
          const monthMessages = analyticsData?.filter(a => 
            a.created_at.startsWith(monthStr)
          ) || [];
          
          monthlyTrends.push({
            month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][date.getMonth()],
            conversations: new Set(monthMessages.map(m => m.session_id)).size,
            users: new Set(monthMessages.map(m => m.user_id).filter(Boolean)).size
          });
        }

        // Datos por horas
        const hourlyData = [];
        for (let hour = 0; hour < 24; hour += 2) {
          const hourMessages = analyticsData?.filter(a => {
            const messageHour = new Date(a.created_at).getHours();
            return messageHour >= hour && messageHour < hour + 2;
          }) || [];
          
          hourlyData.push({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            messages: hourMessages.length
          });
        }

        setMetrics({
          totalMessages,
          uniqueUsers,
          totalConversations: uniqueSessions,
          avgResponseTime: Math.round(avgResponseTime),
          dailyData,
          categoriesData: categoryStats,
          monthlyTrends,
          hourlyData
        });
      } catch (error) {
        console.error('Error cargando métricas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (cityId) {
      fetchMetrics();
    }
  }, [cityId, period]);

  if (loading || !metrics) {
    return (
      <div className="flex-1 overflow-auto bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando métricas...</span>
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Métricas</h1>
            <p className="text-muted-foreground">
              Análisis detallado del uso del chat y patrones de consulta
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder={t('metrics.period.label', { defaultValue: 'Periodo' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('metrics.period.all', { defaultValue: 'Todo' })}</SelectItem>
                <SelectItem value="24h">{t('metrics.period.last24h', { defaultValue: 'Últimas 24h' })}</SelectItem>
                <SelectItem value="7d">{t('metrics.period.last7d', { defaultValue: 'Última semana' })}</SelectItem>
                <SelectItem value="1m">{t('metrics.period.last1m', { defaultValue: 'Último mes' })}</SelectItem>
                <SelectItem value="6m">{t('metrics.period.last6m', { defaultValue: 'Últimos 6 meses' })}</SelectItem>
                <SelectItem value="1y">{t('metrics.period.last1y', { defaultValue: 'Último año' })}</SelectItem>
                <SelectItem value="5y">{t('metrics.period.last5y', { defaultValue: 'Últimos 5 años' })}</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              Última actualización: Hoy
            </Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Todos los mensajes registrados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios diferentes que han usado el chat
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalConversations}</div>
              <p className="text-xs text-muted-foreground">
                Sesiones de chat diferentes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Respuesta</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                Tiempo promedio de respuesta
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="topics">Temáticas</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
            <TabsTrigger value="hours">Horarios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Uso Semanal del Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="messages" fill="hsl(var(--primary))" name="Mensajes" />
                      <Bar dataKey="users" fill="hsl(var(--secondary))" name="Usuarios" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Temáticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.categoriesData.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          />
                          <span className="font-medium">{topic.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${topic.value}%`, 
                                backgroundColor: topic.color 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">{topic.value}%</span>
                          <span className="text-xs text-muted-foreground">({topic.count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Análisis Detallado de Temáticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.categoriesData.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          />
                          <span className="font-medium">{topic.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{topic.value}%</div>
                          <div className="text-sm text-muted-foreground">
                            {topic.count} consultas
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendencias Mensuales</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={metrics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="conversations" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Conversaciones"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      name="Usuarios Únicos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actividad por Horas del Día</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={metrics.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                      name="Mensajes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminMetrics;


