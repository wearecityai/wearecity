import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Settings, 
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Building,
  Activity,
  Calendar,
  MapPin,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthFirebase';
import { firestoreClient } from '@/integrations/firebase/database';

interface SuperAdminStats {
  totalUsers: number;
  totalCities: number;
  totalMessages: number;
  totalConversations: number;
  activeUsers: number;
  newUsersToday: number;
  newCitiesThisWeek: number;
  averageMessagesPerUser: number;
  topCities: Array<{ name: string; messages: number; users: number }>;
  recentActivity: Array<{ type: string; description: string; timestamp: string; city?: string }>;
}

interface City {
  id: string;
  name: string;
  slug: string;
  admin_user_id: string;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  bio?: string;
  assistant_name?: string;
  service_tags?: string[];
  lat?: number;
  lng?: number;
}

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  last_login?: string;
  city?: City;
  is_active: boolean;
}

export const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showCreateCity, setShowCreateCity] = useState(false);

  // Formulario para crear admin
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    cityName: ''
  });

  // Formulario para crear ciudad
  const [newCity, setNewCity] = useState({
    name: '',
    slug: '',
    adminEmail: '',
    bio: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Cargar estadísticas generales
      await loadStats();
      
      // Cargar ciudades
      await loadCities();
      
      // Cargar usuarios admin
      await loadAdminUsers();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Simular estadísticas (en producción, estas vendrían de Cloud Functions)
      const mockStats: SuperAdminStats = {
        totalUsers: 1247,
        totalCities: 42,
        totalMessages: 15689,
        totalConversations: 3421,
        activeUsers: 892,
        newUsersToday: 23,
        newCitiesThisWeek: 3,
        averageMessagesPerUser: 12.6,
        topCities: [
          { name: 'Alicante', messages: 2341, users: 156 },
          { name: 'Benidorm', messages: 1987, users: 134 },
          { name: 'Elche', messages: 1654, users: 98 },
          { name: 'Torrevieja', messages: 1432, users: 87 },
          { name: 'La Vila Joiosa', messages: 1298, users: 76 }
        ],
        recentActivity: [
          { type: 'user', description: 'Nuevo usuario registrado', timestamp: '2024-01-15T10:30:00Z', city: 'Alicante' },
          { type: 'city', description: 'Ciudad creada', timestamp: '2024-01-15T09:15:00Z', city: 'Orihuela' },
          { type: 'message', description: '1000+ mensajes enviados', timestamp: '2024-01-15T08:45:00Z', city: 'Benidorm' },
          { type: 'admin', description: 'Admin actualizado', timestamp: '2024-01-15T07:20:00Z', city: 'Elche' }
        ]
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadCities = async () => {
    try {
      const result = await firestoreClient
        .from('cities')
        .select('*')
        .execute();

      if (result.error) {
        console.error('Error loading cities:', result.error);
        return;
      }

      setCities(result.data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const result = await firestoreClient
        .from('profiles')
        .select('*')
        .eq('role', 'administrativo')
        .execute();

      if (result.error) {
        console.error('Error loading admin users:', result.error);
        return;
      }

      const adminUsers = result.data || [];
      
      // Enriquecer con datos de ciudades
      const enrichedAdmins = await Promise.all(
        adminUsers.map(async (admin: any) => {
          const cityResult = await firestoreClient
            .from('cities')
            .select('*')
            .eq('admin_user_id', admin.id)
            .single();
          
          return {
            ...admin,
            city: cityResult.data || null
          };
        })
      );

      setAdminUsers(enrichedAdmins);
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  };

  const handleCreateAdmin = async () => {
    // Implementar creación de admin
    console.log('Creating admin:', newAdmin);
    setShowCreateAdmin(false);
    setNewAdmin({ email: '', firstName: '', lastName: '', password: '', cityName: '' });
  };

  const handleCreateCity = async () => {
    // Implementar creación de ciudad
    console.log('Creating city:', newCity);
    setShowCreateCity(false);
    setNewCity({ name: '', slug: '', adminEmail: '', bio: '' });
  };

  const filteredCities = cities.filter(city => 
    selectedCity === 'all' || city.id === selectedCity
  );

  const filteredAdmins = adminUsers.filter(admin =>
    (admin.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (admin.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (admin.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando panel superadmin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Wearecity SuperAdmin</h1>
              <p className="text-sm text-muted-foreground">Panel de control de la plataforma</p>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="h-3 w-3 mr-1" />
              Sistema Activo
            </Badge>
            <div className="text-sm text-muted-foreground">
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Estadísticas principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.newUsersToday} hoy
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ciudades Activas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCities}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.newCitiesThisWeek} esta semana
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes Totales</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.averageMessagesPerUser} por usuario
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats?.activeUsers || 0) / (stats?.totalUsers || 1) * 100)}% del total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="cities">Ciudades</TabsTrigger>
            <TabsTrigger value="admins">Administradores</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Tab Resumen */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Top Ciudades */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Ciudades por Actividad</CardTitle>
                  <CardDescription>Ciudades con mayor número de mensajes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.topCities.map((city, index) => (
                      <div key={city.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{city.name}</p>
                            <p className="text-sm text-muted-foreground">{city.users} usuarios</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{city.messages.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">mensajes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actividad Reciente */}
              <Card>
                <CardHeader>
                  <CardTitle>Actividad Reciente</CardTitle>
                  <CardDescription>Últimas acciones en la plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          {activity.type === 'user' && <UserPlus className="h-4 w-4" />}
                          {activity.type === 'city' && <Building className="h-4 w-4" />}
                          {activity.type === 'message' && <MessageSquare className="h-4 w-4" />}
                          {activity.type === 'admin' && <Settings className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(activity.timestamp).toLocaleString()}</span>
                            {activity.city && (
                              <>
                                <span>•</span>
                                <span>{activity.city}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Ciudades */}
          <TabsContent value="cities" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="city-filter">Filtrar por ciudad:</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Todas las ciudades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ciudades</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => setShowCreateCity(true)} className="rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                Crear Ciudad
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCities.map((city) => (
                <Card key={city.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{city.name}</CardTitle>
                      <div className="flex space-x-2">
                        <Badge variant={city.is_active ? "default" : "secondary"}>
                          {city.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                        <Badge variant={city.is_public ? "outline" : "secondary"}>
                          {city.is_public ? "Pública" : "Privada"}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {city.bio || "Sin descripción"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {city.lat && city.lng ? `${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}` : "Sin ubicación"}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Creada: {new Date(city.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin: {city.admin_user_id}
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Administradores */}
          <TabsContent value="admins" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar administradores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-[300px] rounded-full"
                  />
                </div>
              </div>
              <Button onClick={() => setShowCreateAdmin(true)} className="rounded-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Admin
              </Button>
            </div>

            <div className="space-y-4">
              {filteredAdmins.map((admin) => (
                <Card key={admin.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={admin.avatar_url} />
                          <AvatarFallback>
                            {admin.first_name?.[0] || 'N'}{admin.last_name?.[0] || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{admin.first_name} {admin.last_name}</h3>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={admin.is_active ? "default" : "secondary"}>
                              {admin.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                            {admin.city && (
                              <Badge variant="outline">
                                {admin.city.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Último acceso: {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : "Nunca"}</p>
                        <p>Registrado: {new Date(admin.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="rounded-full">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full text-destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Analíticas */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Uso</CardTitle>
                  <CardDescription>Estadísticas de uso de la plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tiempo promedio de sesión</span>
                      <span className="text-sm text-muted-foreground">12.5 min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Mensajes por conversación</span>
                      <span className="text-sm text-muted-foreground">4.6</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tasa de satisfacción</span>
                      <span className="text-sm text-muted-foreground">94.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Ciudades más activas</span>
                      <span className="text-sm text-muted-foreground">Alicante, Benidorm</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado del Sistema</CardTitle>
                  <CardDescription>Monitoreo de la infraestructura</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Estado de la API</span>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-600">Operativa</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Base de datos</span>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-600">Conectada</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tiempo de respuesta</span>
                      <span className="text-sm text-muted-foreground">245ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Uso de CPU</span>
                      <span className="text-sm text-muted-foreground">23%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Configuración */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de la Plataforma</CardTitle>
                <CardDescription>Ajustes globales del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maintenance">Modo Mantenimiento</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Desactivado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disabled">Desactivado</SelectItem>
                        <SelectItem value="enabled">Activado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration">Registro de Usuarios</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Abierto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Abierto</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
                        <SelectItem value="invite">Solo invitación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button className="rounded-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Datos
                  </Button>
                  <Button variant="outline" className="rounded-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración Avanzada
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales para crear admin y ciudad */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Crear Administrador</CardTitle>
              <CardDescription>Crear un nuevo administrador de ciudad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  placeholder="admin@ciudad.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={newAdmin.firstName}
                    onChange={(e) => setNewAdmin({...newAdmin, firstName: e.target.value})}
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={newAdmin.lastName}
                    onChange={(e) => setNewAdmin({...newAdmin, lastName: e.target.value})}
                    placeholder="Pérez"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cityName">Ciudad Asignada</Label>
                <Input
                  id="cityName"
                  value={newAdmin.cityName}
                  onChange={(e) => setNewAdmin({...newAdmin, cityName: e.target.value})}
                  placeholder="Alicante"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleCreateAdmin} className="flex-1 rounded-full">
                  Crear Admin
                </Button>
                <Button variant="outline" onClick={() => setShowCreateAdmin(false)} className="rounded-full">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCreateCity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Crear Ciudad</CardTitle>
              <CardDescription>Crear una nueva ciudad en la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cityName">Nombre de la Ciudad</Label>
                <Input
                  id="cityName"
                  value={newCity.name}
                  onChange={(e) => setNewCity({...newCity, name: e.target.value})}
                  placeholder="Valencia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="citySlug">Slug (URL)</Label>
                <Input
                  id="citySlug"
                  value={newCity.slug}
                  onChange={(e) => setNewCity({...newCity, slug: e.target.value})}
                  placeholder="valencia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email del Admin</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={newCity.adminEmail}
                  onChange={(e) => setNewCity({...newCity, adminEmail: e.target.value})}
                  placeholder="admin@valencia.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cityBio">Biografía</Label>
                <Input
                  id="cityBio"
                  value={newCity.bio}
                  onChange={(e) => setNewCity({...newCity, bio: e.target.value})}
                  placeholder="Descripción de la ciudad..."
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleCreateCity} className="flex-1 rounded-full">
                  Crear Ciudad
                </Button>
                <Button variant="outline" onClick={() => setShowCreateCity(false)} className="rounded-full">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
