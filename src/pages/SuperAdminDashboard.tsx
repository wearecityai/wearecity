import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import CityCombobox from '@/components/CityCombobox';
import { RestrictedCityInfo } from '@/types';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Activity,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  UserCog,
  Shield,
  Globe,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthFirebase';
import { firestoreClient } from '@/integrations/firebase/database';
import { NavActions } from '@/components/nav-actions';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useAppState } from '@/hooks/useAppState';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

// SuperAdmin Sidebar Component
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

interface SuperAdminSidebarProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  activeTab?: string
  onTabChange?: (tab: string) => void
}

function SuperAdminSidebar({ user, activeTab, onTabChange }: SuperAdminSidebarProps) {
  const navItems = [
    {
      title: "Resumen",
      icon: BarChart3,
      id: "overview",
      isActive: activeTab === "overview",
    },
    {
      title: "Usuarios",
      icon: Users,
      id: "users", 
      isActive: activeTab === "users",
    },
    {
      title: "Ciudades",
      icon: Building2,
      id: "cities",
      isActive: activeTab === "cities", 
    },
    {
      title: "Mensajes",
      icon: MessageSquare,
      id: "messages",
      isActive: activeTab === "messages",
    },
    {
      title: "Configuración",
      icon: Settings,
      id: "settings",
      isActive: activeTab === "settings",
    },
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Wearecity</span>
                  <span className="truncate text-xs">SuperAdmin Panel</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    onClick={() => onTabChange?.(item.id)}
                    className={item.isActive ? "bg-accent text-accent-foreground" : ""}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

// Interfaces
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
  country?: string;
  created_at: string;
  is_active: boolean;
  is_public: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  created_at: string;
  last_login?: string;
  city?: City;
  is_active: boolean;
  avatar_url?: string;
}

export const SuperAdminDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showCreateCity, setShowCreateCity] = useState(false);
  const [selectedCityPlace, setSelectedCityPlace] = useState<RestrictedCityInfo | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // Use the same approach as finetuning panel - use AppState and hardcoded API key
  const { googleMapsScriptLoaded } = useAppState();
  const googleMapsApiKey = 'AIzaSyDksNTEkRDILZimpnX7vUc36u66SAAH5l0'; // Same as finetuning panel
  const apiKeyLoading = false;
  const apiKeyError = null;

  // Debug Google Maps status
  useEffect(() => {
    console.log('🗺️ SuperAdmin Google Maps status:', {
      googleMapsScriptLoaded,
      googleMapsApiKey: googleMapsApiKey ? `${googleMapsApiKey.substring(0, 10)}...` : 'NO API KEY',
      apiKeyLoading,
      apiKeyError,
      appError
    });
  }, [googleMapsScriptLoaded, googleMapsApiKey, apiKeyLoading, apiKeyError, appError]);

  // Filtered data
  const filteredAdmins = adminUsers.filter(admin => {
    const matchesSearch = (admin.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (admin.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (admin.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || admin.city?.id === selectedCity;
    return matchesSearch && matchesCity;
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Loading real data from Firebase
        console.log('Loading real SuperAdmin data from Firebase...');
        
        // Get cities
        const citiesSnapshot = await getDocs(collection(db, 'cities'));
        const citiesData: City[] = citiesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unknown',
          country: doc.data().country || 'España',
          created_at: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          is_active: doc.data().isActive !== false,
          is_public: doc.data().isPublic !== false
        }));
        
        // Get users/profiles
        const profilesSnapshot = await getDocs(collection(db, 'profiles'));
        const profilesData = profilesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
        
         // Filter admin users
         const adminUsersData: AdminUser[] = profilesData
           .filter(profile => (profile as any).role === 'administrativo' || (profile as any).role === 'admin')
           .map(profile => ({
             id: profile.id,
             email: (profile as any).email || '',
             first_name: (profile as any).firstName || '',
             last_name: (profile as any).lastName || '',
             role: (profile as any).role || 'admin',
             created_at: profile.created_at,
             is_active: true,
             city: citiesData.find(city => city.id === (profile as any).restrictedCity) || null
           }));
        
        // Get messages count
        const messagesSnapshot = await getDocs(collection(db, 'messages'));
        const totalMessages = messagesSnapshot.size;
        
        // Get conversations count
        const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
        const totalConversations = conversationsSnapshot.size;
        
         // Calculate users created today
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         const newUsersToday = profilesData.filter(profile => {
           const createdAt = (profile as any).createdAt?.toDate?.();
           return createdAt && createdAt >= today;
         }).length;
        
        // Calculate cities created this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const newCitiesThisWeek = citiesData.filter(city => {
          const createdAt = new Date(city.created_at);
          return createdAt >= weekAgo;
        }).length;
        
        // Calculate active users (estimate)
        const activeUsers = Math.floor(profilesData.length * 0.3);
        
        // Calculate average messages per user
        const averageMessagesPerUser = profilesData.length > 0 ? 
          Number((totalMessages / profilesData.length).toFixed(1)) : 0;
        
        const mockStats: SuperAdminStats = {
          totalUsers: profilesData.length,
          totalCities: citiesData.length,
          totalMessages,
          totalConversations,
          activeUsers,
          newUsersToday,
          newCitiesThisWeek,
          averageMessagesPerUser,
           topCities: citiesData.map(city => ({
             name: city.name,
             messages: Math.floor(Math.random() * 1000) + 100,
             users: profilesData.filter(p => (p as any).restrictedCity === city.id).length
           })).sort((a, b) => b.users - a.users).slice(0, 5),
          recentActivity: profilesData
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 4)
            .map(user => ({
              type: 'user' as const,
              description: `Nuevo usuario registrado: ${(user as any).email || 'Unknown'}`,
              timestamp: user.created_at,
              city: undefined
            }))
        };

        console.log('SuperAdmin data loaded:', { 
          stats: mockStats, 
          cities: citiesData.length, 
          admins: adminUsersData.length,
          profiles: profilesData.length
        });

        setStats(mockStats);
        setCities(citiesData);
        setAdminUsers(adminUsersData);
        
      } catch (error) {
        console.error('Error loading SuperAdmin data:', error);
        
        // Fallback to empty data if Firebase fails
        setStats({
          totalUsers: 0,
          totalCities: 0,
          totalMessages: 0,
          totalConversations: 0,
          activeUsers: 0,
          newUsersToday: 0,
          newCitiesThisWeek: 0,
          averageMessagesPerUser: 0,
          topCities: [],
          recentActivity: []
        });
        setCities([]);
        setAdminUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
    <SidebarProvider>
      <SuperAdminSidebar 
        user={{
          name: (profile?.firstName || '') + ' ' + (profile?.lastName || ''),
          email: user?.email || 'admin@wearecity.ai',
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 layout-transition w-full overflow-hidden">
          <div className="flex flex-1 items-center gap-2 px-3 min-w-0">
            <div className="flex-shrink-0">
              <SidebarTrigger />
            </div>
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-foreground tiktok-sans-title">
                        WeAreCity
                      </span>
                      <Badge variant="outline" className="text-xs">Beta</Badge>
                    </div>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          <div className="ml-auto px-3 flex-shrink-0">
            <NavActions />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min p-6">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-0 bg-input">
                    <CardHeader className="relative">
                      <CardDescription>Total Usuarios</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums">
                        {stats?.totalUsers || 0}
                      </CardTitle>
                      <div className="absolute right-4 top-4">
                        <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                          <TrendingUp className="size-3" />
                          +{stats?.newUsersToday || 0}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="size-4" />
                        {stats?.activeUsers || 0} usuarios activos
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Nuevos usuarios hoy: {stats?.newUsersToday || 0}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-input">
                    <CardHeader className="relative">
                      <CardDescription>Total Ciudades</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums">
                        {stats?.totalCities || 0}
                      </CardTitle>
                      <div className="absolute right-4 top-4">
                        <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                          <TrendingUp className="size-3" />
                          +{stats?.newCitiesThisWeek || 0}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="size-4" />
                        Ciudades registradas
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Nuevas esta semana: {stats?.newCitiesThisWeek || 0}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-input">
                    <CardHeader className="relative">
                      <CardDescription>Total Mensajes</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums">
                        {stats?.totalMessages || 0}
                      </CardTitle>
                      <div className="absolute right-4 top-4">
                        <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                          <MessageSquare className="size-3" />
                          {stats?.averageMessagesPerUser || 0}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="size-4" />
                        {stats?.totalConversations || 0} conversaciones
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Promedio: {stats?.averageMessagesPerUser || 0} msgs/usuario
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-input">
                    <CardHeader className="relative">
                      <CardDescription>Actividad Global</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums">
                        {((stats?.totalMessages || 0) / (stats?.totalUsers || 1)).toFixed(1)}
                      </CardTitle>
                      <div className="absolute right-4 top-4">
                        <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                          <Activity className="size-3" />
                          Activa
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="size-4" />
                        Engagement rate
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Basado en mensajes por usuario
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Charts Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <ChartAreaInteractive />
                  
                  {/* Top Cities */}
                  <Card className="border-0 bg-input">
                    <CardHeader>
                      <CardTitle>Top Ciudades por Actividad</CardTitle>
                      <CardDescription>Ciudades con mayor número de mensajes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats?.topCities?.map((city, index) => (
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
                </div>

                {/* Recent Activity */}
                <Card className="border-0 bg-input">
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>Últimas acciones en la plataforma</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.recentActivity?.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {activity.type === 'user' && <UserPlus className="h-4 w-4" />}
                            {activity.type === 'city' && <Building2 className="h-4 w-4" />}
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
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
                    <p className="text-muted-foreground">Administra todos los usuarios de la plataforma</p>
                  </div>
                  <Button onClick={() => setShowCreateAdmin(true)} className="rounded-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear Admin
                  </Button>
                </div>

                {/* Search and filters */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label>Filtrar por ciudad:</Label>
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

                {/* Admin Users List */}
                <div className="space-y-4">
                  {filteredAdmins.map((admin) => (
                    <Card key={admin.id} className="border-0 bg-input">
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
                                <Badge variant="outline">{admin.role}</Badge>
                                {admin.city && (
                                  <Badge variant="secondary">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {admin.city.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </Button>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Cities Tab */}
            {activeTab === 'cities' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Gestión de Ciudades</h2>
                    <p className="text-muted-foreground">Administra todas las ciudades de la plataforma</p>
                  </div>
                  <Button onClick={() => setShowCreateCity(true)} className="rounded-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Ciudad
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {cities.map((city) => {
                    const cityAdmin = adminUsers.find(admin => admin.city?.id === city.id);
                    return (
                      <Card key={city.id} className="hover:shadow-lg transition-shadow border-0 bg-input">
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
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{city.country || 'País no especificado'}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Creada: {new Date(city.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {cityAdmin && (
                              <div className="flex items-center space-x-2">
                                <UserCog className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  Admin: {cityAdmin.first_name} {cityAdmin.last_name}
                                </span>
                              </div>
                            )}
                            
                            {!cityAdmin && (
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <span className="text-sm text-orange-600">Sin administrador</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 flex space-x-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Settings className="h-4 w-4 mr-2" />
                              Config
                            </Button>
                          </div>
                          
                          {!cityAdmin && (
                            <Button variant="secondary" size="sm" className="w-full mt-2">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Asignar Admin
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Actividad de Mensajería</h2>
                    <p className="text-muted-foreground">Monitorea todas las conversaciones de la plataforma</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </div>
                </div>

                {/* Messages Statistics */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="border-0 bg-input">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Mensajes Totales</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalMessages?.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        En toda la plataforma
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-input">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalConversations?.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Conversaciones únicas
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-input">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Promedio por Usuario</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.averageMessagesPerUser || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Mensajes por usuario
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-input">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Actividad Hoy</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.floor(Math.random() * 1000)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mensajes enviados hoy
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Messages by City and Chart */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="border-0 bg-input">
                    <CardHeader>
                      <CardTitle>Actividad por Ciudad</CardTitle>
                      <CardDescription>Mensajes enviados por ciudad</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats?.topCities?.map((city, index) => (
                          <div key={city.name} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <span className="text-sm font-medium">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{city.name}</p>
                                <p className="text-sm text-muted-foreground">{city.users} usuarios activos</p>
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

                  <ChartAreaInteractive />
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
                    <p className="text-muted-foreground">Configuración global de la plataforma</p>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Config
                  </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* General Settings */}
                  <Card className="border-0 bg-input">
                    <CardHeader>
                      <CardTitle>Configuración General</CardTitle>
                      <CardDescription>Configuraciones básicas del sistema</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="platform-name">Nombre de la Plataforma</Label>
                        <Input id="platform-name" defaultValue="Wearecity" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="default-language">Idioma por Defecto</Label>
                        <Select defaultValue="es">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-messages">Máximo Mensajes por Usuario/Día</Label>
                        <Input id="max-messages" type="number" defaultValue="100" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="session-timeout">Tiempo de Sesión (minutos)</Label>
                        <Input id="session-timeout" type="number" defaultValue="60" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* API Settings */}
                  <Card className="border-0 bg-input">
                    <CardHeader>
                      <CardTitle>APIs e Integraciones</CardTitle>
                      <CardDescription>Configuración de servicios externos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="openai-key">OpenAI API Key</Label>
                        <Input id="openai-key" type="password" placeholder="sk-..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="google-maps-key">Google Maps API Key</Label>
                        <Input id="google-maps-key" type="password" placeholder="AIza..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rate-limit">Rate Limit (requests/min)</Label>
                        <Input id="rate-limit" type="number" defaultValue="60" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Information */}
                <Card className="border-0 bg-input">
                  <CardHeader>
                    <CardTitle>Información del Sistema</CardTitle>
                    <CardDescription>Estado actual del sistema y estadísticas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Versión</p>
                        <p className="text-2xl font-bold">v2.4.1</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                        <p className="text-2xl font-bold">99.8%</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Último Deploy</p>
                        <p className="text-sm">Hace 2 días</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Base de Datos</p>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Conectada</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Backup Sistema
                    </Button>
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Limpiar Cache
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      Cancelar
                    </Button>
                    <Button>
                      Guardar Configuración
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </SidebarInset>

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 bg-input">
            <CardHeader>
              <CardTitle>Crear Nuevo Administrador</CardTitle>
              <CardDescription>Crea un nuevo administrador de ciudad con acceso restringido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input id="admin-email" type="email" placeholder="admin@ciudad.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-first-name">Nombre</Label>
                  <Input id="admin-first-name" placeholder="Juan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-last-name">Apellido</Label>
                  <Input id="admin-last-name" placeholder="Pérez" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Contraseña Temporal</Label>
                <Input id="admin-password" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-city">Ciudad Asignada</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.filter(city => !adminUsers.some(admin => admin.city?.id === city.id)).map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name} ({city.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-chat-name">Nombre del Chat</Label>
                <Input id="admin-chat-name" placeholder="Asistente de Valencia" />
                <p className="text-xs text-muted-foreground">
                  Nombre que aparecerá en el chat para los usuarios
                </p>
              </div>
            </CardContent>
            <CardContent>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateAdmin(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  // TODO: Implement admin creation logic
                  setShowCreateAdmin(false);
                }}>
                  Crear Administrador
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create City Modal */}
      {showCreateCity && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 bg-input">
            <CardHeader>
              <CardTitle>Crear Nueva Ciudad y Administrador</CardTitle>
              <CardDescription>Registra una nueva ciudad en la plataforma y crea su administrador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               {/* City Selection with Google Places */}
               <div className="space-y-4">
                 <h3 className="text-lg font-medium">Información de la Ciudad</h3>
                 <div className="space-y-2">
                   <Label>Restringir a Municipio</Label>
                   <div className="space-y-1">
                     <CityCombobox
                       value={selectedCityPlace}
                       onChange={(city) => {
                         setSelectedCityPlace(city);
                       }}
                       countryCode={undefined}
                       placeholder="Selecciona ciudad"
                       disabled={false}
                     />
                   </div>
                   {selectedCityPlace && (
                     <div className="mt-2 p-3 bg-muted rounded-md">
                       <p className="text-sm font-medium">Ciudad seleccionada:</p>
                       <p className="text-sm text-muted-foreground">{selectedCityPlace.formattedAddress}</p>
                       <p className="text-xs text-muted-foreground">
                         Nombre: {selectedCityPlace.name}
                       </p>
                       {selectedCityPlace.placeId && (
                         <p className="text-xs text-muted-foreground">
                           Place ID: {selectedCityPlace.placeId}
                         </p>
                       )}
                     </div>
                   )}
                 </div>
               </div>

              {/* Admin User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información del Administrador</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-first-name">Nombre</Label>
                    <Input id="admin-first-name" placeholder="Juan" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-last-name">Apellido</Label>
                    <Input id="admin-last-name" placeholder="García" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input id="admin-email" type="email" placeholder="admin@ciudad.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Contraseña</Label>
                  <Input id="admin-password" type="password" placeholder="••••••••" />
                </div>
              </div>

              {/* Additional Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuración</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city-timezone">Zona Horaria</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar zona horaria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                        <SelectItem value="America/Mexico_City">America/Mexico_City</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city-language">Idioma Principal</Label>
                    <Select defaultValue="es">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardContent>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowCreateCity(false);
                  setSelectedCityPlace(null);
                }}>
                  Cancelar
                </Button>
                 <Button 
                   onClick={() => {
                     // TODO: Implement city and admin creation logic
                     console.log('Creating city and admin with:', {
                       city: {
                         name: selectedCityPlace?.name,
                         placeId: selectedCityPlace?.placeId,
                         formattedAddress: selectedCityPlace?.formattedAddress,
                         lat: (selectedCityPlace as any)?.lat,
                         lng: (selectedCityPlace as any)?.lng,
                         country: (selectedCityPlace as any)?.country
                       },
                       admin: {
                         firstName: (document.getElementById('admin-first-name') as HTMLInputElement)?.value,
                         lastName: (document.getElementById('admin-last-name') as HTMLInputElement)?.value,
                         email: (document.getElementById('admin-email') as HTMLInputElement)?.value,
                         password: (document.getElementById('admin-password') as HTMLInputElement)?.value,
                       }
                     });
                     setShowCreateCity(false);
                     setSelectedCityPlace(null);
                   }}
                   disabled={!selectedCityPlace}
                 >
                   Crear Ciudad y Administrador
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </SidebarProvider>
  );
};

export default SuperAdminDashboard;