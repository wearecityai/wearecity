import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Users, TrendingUp, BarChart3, PieChart } from 'lucide-react';
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

// Datos simulados para el dashboard
const chatUsageData = [
  { day: 'Lun', messages: 65, users: 23 },
  { day: 'Mar', messages: 89, users: 34 },
  { day: 'Mié', messages: 78, users: 29 },
  { day: 'Jue', messages: 95, users: 41 },
  { day: 'Vie', messages: 112, users: 52 },
  { day: 'Sáb', messages: 87, users: 38 },
  { day: 'Dom', messages: 73, users: 31 }
];

const topicsData = [
  { name: 'Trámites', value: 35, color: 'hsl(var(--chart-1))' },
  { name: 'Eventos', value: 25, color: 'hsl(var(--chart-2))' },
  { name: 'Lugares', value: 20, color: 'hsl(var(--chart-3))' },
  { name: 'Información General', value: 15, color: 'hsl(var(--chart-4))' },
  { name: 'Turismo', value: 5, color: 'hsl(var(--chart-5))' }
];

const monthlyTrendsData = [
  { month: 'Ene', conversations: 145, users: 89 },
  { month: 'Feb', conversations: 178, users: 112 },
  { month: 'Mar', conversations: 203, users: 134 },
  { month: 'Abr', conversations: 167, users: 98 },
  { month: 'May', conversations: 221, users: 156 },
  { month: 'Jun', conversations: 289, users: 201 }
];

const peakHoursData = [
  { hour: '00:00', messages: 2 },
  { hour: '02:00', messages: 1 },
  { hour: '04:00', messages: 0 },
  { hour: '06:00', messages: 3 },
  { hour: '08:00', messages: 15 },
  { hour: '10:00', messages: 28 },
  { hour: '12:00', messages: 42 },
  { hour: '14:00', messages: 38 },
  { hour: '16:00', messages: 35 },
  { hour: '18:00', messages: 45 },
  { hour: '20:00', messages: 32 },
  { hour: '22:00', messages: 18 }
];

const AdminMetrics: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (profile?.role !== 'administrativo') return <Navigate to="/" replace />;

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Métricas</h1>
            <p className="text-muted-foreground">
              Análisis detallado del uso del chat y patrones de consulta
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            Última actualización: Hoy
          </Badge>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">
                +12% desde la semana pasada
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +8% desde la semana pasada
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">845</div>
              <p className="text-xs text-muted-foreground">
                +15% desde la semana pasada
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">
                +2% desde la semana pasada
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
                    <BarChart data={chatUsageData}>
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
                    {topicsData.map((topic, index) => (
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
                    {topicsData.map((topic, index) => (
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
                            ~{Math.round(topic.value * 28.47)} consultas
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
                  <LineChart data={monthlyTrendsData}>
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
                  <AreaChart data={peakHoursData}>
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


