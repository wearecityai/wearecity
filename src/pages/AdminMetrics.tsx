import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthFirebase';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Calendar, MessageSquare, Users, TrendingUp, BarChart3, PieChart, RefreshCw } from 'lucide-react';
import { db } from '@/integrations/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
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
  qualityMetrics: any[];
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
  // Función temporal para inicializar categorías
  const initializeCategoriesIfNeeded = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'chat_categories'));
      if (categoriesSnapshot.empty) {
        console.log('🔧 No categories found');
      }
    } catch (error) {
      console.error('Error checking/initializing categories:', error);
    }
  };

  useEffect(() => {
    const fetchCityId = async () => {
      if (!user?.id) {
        console.log('🔍 AdminMetrics: No user ID available');
        return;
      }
      
      console.log('🔍 AdminMetrics: Fetching city ID for user:', user.id);
      
      try {
        const citiesRef = collection(db, 'cities');
        const q = query(citiesRef, where('adminUserId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        console.log('🔍 AdminMetrics: Query result:', querySnapshot.docs.length, 'cities found');
        
        if (!querySnapshot.empty) {
          const cityDoc = querySnapshot.docs[0];
          console.log('🔍 AdminMetrics: City found:', cityDoc.id, 'slug:', cityDoc.data().slug);
          setCityId(cityDoc.data().slug);
        } else {
          console.log('🔍 AdminMetrics: No city found for user:', user.id);
          // Try alternative approach - look for city with user ID as document ID
          const alternativeCityId = `city_${user.id}`;
          console.log('🔍 AdminMetrics: Trying alternative city ID:', alternativeCityId);
          setCityId(alternativeCityId);
        }
      } catch (error) {
        console.error('Error fetching city ID:', error);
      }
    };
    
    fetchCityId();
    initializeCategoriesIfNeeded();
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
      if (!cityId) {
        console.log('🔍 AdminMetrics: No cityId available, skipping metrics fetch');
        return;
      }
      
      console.log('🔍 AdminMetrics: Starting metrics fetch for cityId:', cityId);
      setLoading(true);
      
      try {
        console.log('🔍 Fetching metrics for cityId:', cityId);
        
        // Métricas totales (con filtro de periodo si aplica)
        const fromIso = getFromDate();
        let analyticsQuery = query(
          collection(db, 'chat_analytics'),
          where('city_id', '==', cityId)
        );
        
        console.log('📊 Fetching analytics for cityId:', cityId);
        const analyticsSnapshot = await getDocs(analyticsQuery);
        let analyticsData = analyticsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as any));
        
        console.log('📈 Analytics data found:', analyticsData.length, 'records');

        // Aplicar filtro de fecha si es necesario
        if (fromIso) {
          analyticsData = analyticsData.filter(item => {
            const itemDate = new Date(item.created_at?.toDate?.() || item.created_at);
            return itemDate >= new Date(fromIso);
          });
        }

        // Obtener categorías
        console.log('📂 Fetching categories...');
        const categoriesSnapshot = await getDocs(collection(db, 'chat_categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('📁 Categories found:', categoriesData.length, 'categories');
        console.log('📁 Sample categories data:', categoriesData);
        console.log('📁 Categories by name:', categoriesData.map(c => ({ id: c.id, name: c.name })));

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
          
          const dayMessages = analyticsData?.filter(a => {
            const itemDate = new Date(a.created_at?.toDate?.() || a.created_at);
            return itemDate.toDateString() === dateStr;
          }) || [];
          
          dailyData.push({
            day: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()],
            messages: dayMessages.length,
            users: new Set(dayMessages.map(m => m.user_id).filter(Boolean)).size
          });
        }

        // Mapeo de categorías con más detalles
        const categoryMapping: Record<string, { name: string, icon: string, color: string, description: string }> = {
          'tramites': { 
            name: 'Trámites', 
            icon: '🏛️', 
            color: 'hsl(var(--chart-1))',
            description: 'Consultas sobre procedimientos administrativos'
          },
          'eventos': { 
            name: 'Eventos', 
            icon: '🎉', 
            color: 'hsl(var(--chart-2))',
            description: 'Información sobre eventos y actividades'
          },
          'lugares': { 
            name: 'Lugares', 
            icon: '📍', 
            color: 'hsl(var(--chart-3))',
            description: 'Ubicaciones y puntos de interés'
          },
          'informacion_general': { 
            name: 'Información General', 
            icon: 'ℹ️', 
            color: 'hsl(var(--chart-4))',
            description: 'Consultas generales sobre la ciudad'
          },
          'turismo': { 
            name: 'Turismo', 
            icon: '🏖️', 
            color: 'hsl(var(--chart-5))',
            description: 'Información turística y recomendaciones'
          },
          'servicios_publicos': {
            name: 'Servicios Públicos',
            icon: '🚰',
            color: 'hsl(210, 100%, 50%)',
            description: 'Consultas sobre servicios municipales'
          },
          'transporte': {
            name: 'Transporte',
            icon: '🚌',
            color: 'hsl(150, 100%, 40%)',
            description: 'Información sobre transporte público'
          },
          'cultura': {
            name: 'Cultura',
            icon: '🎭',
            color: 'hsl(280, 100%, 50%)',
            description: 'Actividades culturales y patrimonio'
          }
        };

        // Datos por categoría con información enriquecida
        console.log('🔍 Processing categories. Analytics data category_ids:', analyticsData.map(a => a.category_id));
        console.log('🔍 Categories available:', categoriesData.map(c => ({ id: c.id, name: c.name })));
        
        const categoryStats = categoriesData?.map(category => {
          const categoryMessages = analyticsData?.filter(a => a.category_id === category.id) || [];
          console.log(`🔍 Category "${category.name}" (id: ${category.id}) has ${categoryMessages.length} messages`);
          const mapping = categoryMapping[category.name] || {
            name: category.name,
            icon: '📋',
            color: 'hsl(var(--muted))',
            description: 'Categoría personalizada'
          };
          
          return {
            name: mapping.name,
            icon: mapping.icon,
            description: mapping.description,
            value: Math.round((categoryMessages.length / (totalMessages || 1)) * 100),
            count: categoryMessages.length,
            color: mapping.color,
            avgResponseTime: categoryMessages.length > 0 ? 
              Math.round(categoryMessages.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / categoryMessages.length) : 0,
            uniqueUsers: new Set(categoryMessages.map(m => m.user_id).filter(Boolean)).size
          };
        }) || [];

        // Datos mensuales (últimos 6 meses)
        const monthlyTrends = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
          
          const monthMessages = analyticsData?.filter(a => {
            const itemDate = new Date(a.created_at?.toDate?.() || a.created_at);
            return itemDate.toISOString().slice(0, 7) === monthStr;
          }) || [];
          
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
            const itemDate = new Date(a.created_at?.toDate?.() || a.created_at);
            const messageHour = itemDate.getHours();
            return messageHour >= hour && messageHour < hour + 2;
          }) || [];
          
          hourlyData.push({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            messages: hourMessages.length,
            avgResponseTime: hourMessages.length > 0 ? 
              Math.round(hourMessages.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / hourMessages.length) : 0
          });
        }

        // Métricas de calidad por categoría
        const qualityMetrics = categoryStats.map(cat => ({
          name: cat.name,
          efficiency: Math.max(0, 100 - (cat.avgResponseTime / 10)), // Score inverso basado en tiempo de respuesta
          engagement: Math.min(100, (cat.uniqueUsers / Math.max(1, cat.count)) * 100), // Ratio usuarios/consultas
          popularity: cat.value, // Porcentaje de uso
          color: cat.color
        }));

        setMetrics({
          totalMessages,
          uniqueUsers,
          totalConversations: uniqueSessions,
          avgResponseTime: Math.round(avgResponseTime),
          dailyData,
          categoriesData: categoryStats,
          monthlyTrends,
          hourlyData,
          qualityMetrics
        });
      } catch (error) {
        console.error('Error cargando métricas:', error);
        // Mostrar métricas vacías en caso de error para evitar carga infinita
        setMetrics({
          totalMessages: 0,
          uniqueUsers: 0,
          totalConversations: 0,
          avgResponseTime: 0,
          dailyData: [],
          categoriesData: [],
          monthlyTrends: [],
          hourlyData: [],
          qualityMetrics: []
        });
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
          <Card className="border-0 bg-input">
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
          
          <Card className="border-0 bg-input">
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
          
          <Card className="border-0 bg-input">
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
          
          <Card className="border-0 bg-input">
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
            <TabsTrigger value="quality">Calidad</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-0 bg-input">
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

              <Card className="border-0 bg-input">
                <CardHeader>
                  <CardTitle>Distribución por Temáticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.categoriesData.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{topic.icon}</span>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: topic.color }}
                            />
                          </div>
                          <div>
                            <span className="font-medium">{topic.name}</span>
                            <p className="text-xs text-muted-foreground">{topic.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs">
                            <div className="font-medium">{topic.uniqueUsers} usuarios</div>
                            <div className="text-muted-foreground">{topic.avgResponseTime}ms avg</div>
                          </div>
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
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2 border-0 bg-input">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Análisis Detallado de Temáticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {metrics.categoriesData.map((topic, index) => (
                      <Card key={index} className="border-0 bg-background/50">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                style={{ backgroundColor: `${topic.color}20`, color: topic.color }}
                              >
                                {topic.icon}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">{topic.name}</h3>
                                <Badge variant="outline" className="ml-2">
                                  {topic.value}%
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {topic.description}
                              </p>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Consultas</div>
                                  <div className="font-semibold">{topic.count}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Usuarios</div>
                                  <div className="font-semibold">{topic.uniqueUsers}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">T. Respuesta</div>
                                  <div className="font-semibold">{topic.avgResponseTime}ms</div>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-3">
                                <div 
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${topic.value}%`, 
                                    backgroundColor: topic.color 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card className="border-0 bg-input">
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
            <Card className="border-0 bg-input">
              <CardHeader>
                <CardTitle>Actividad por Horas del Día</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={metrics.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="messages" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                      name="Mensajes"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="avgResponseTime" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      name="Tiempo de Respuesta (ms)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-0 bg-input">
                <CardHeader>
                  <CardTitle>Radar de Calidad por Temática</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={metrics.qualityMetrics}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        name="Eficiencia"
                        dataKey="efficiency"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Engagement"
                        dataKey="engagement"
                        stroke="hsl(var(--secondary))"
                        fill="hsl(var(--secondary))"
                        fillOpacity={0.3}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 bg-input">
                <CardHeader>
                  <CardTitle>Índices de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.qualityMetrics.map((item, index) => (
                      <div key={index} className="p-4 rounded-lg bg-background/50 border">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{item.name}</h3>
                          <Badge 
                            variant={item.efficiency > 80 ? "default" : item.efficiency > 60 ? "secondary" : "destructive"}
                          >
                            {Math.round(item.efficiency)}% eficiente
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-muted-foreground mb-1">Eficiencia</div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${item.efficiency}%`, 
                                  backgroundColor: item.color 
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium">{Math.round(item.efficiency)}%</span>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Engagement</div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${item.engagement}%`, 
                                  backgroundColor: item.color 
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium">{Math.round(item.engagement)}%</span>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Popularidad</div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${item.popularity}%`, 
                                  backgroundColor: item.color 
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium">{Math.round(item.popularity)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
      </div>
    </div>
  );
};

export default AdminMetrics;


