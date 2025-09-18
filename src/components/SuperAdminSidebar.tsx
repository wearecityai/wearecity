import * as React from "react"
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  Users,
  Building2,
  MessageSquare,
  Settings,
  User,
  Crown,
  Bot,
  Activity,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { NavActions } from "@/components/nav-actions"

interface SuperAdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: string
  onTabChange: (tab: string) => void
}

const superAdminNavItems = [
  {
    id: 'overview',
    title: 'Resumen General',
    icon: BarChart3,
    description: 'Estadísticas y métricas generales'
  },
  {
    id: 'users',
    title: 'Gestión de Usuarios',
    icon: Users,
    description: 'Administrar usuarios y administradores'
  },
  {
    id: 'cities',
    title: 'Gestión de Ciudades',
    icon: Building2,
    description: 'Administrar ciudades y configuraciones'
  },
  {
    id: 'messages',
    title: 'Mensajes y Actividad',
    icon: MessageSquare,
    description: 'Estadísticas de mensajes y uso'
  },
  {
    id: 'agents',
    title: 'Agentes Inteligentes',
    icon: Bot,
    description: 'Control de agentes de scraping y RAG'
  },
  {
    id: 'monitoring',
    title: 'Monitoreo del Sistema',
    icon: Activity,
    description: 'Estado de salud y métricas en tiempo real'
  },
  {
    id: 'settings',
    title: 'Configuración',
    icon: Settings,
    description: 'Configuraciones del sistema'
  },
]

export function SuperAdminSidebar({ 
  activeTab,
  onTabChange,
  ...props 
}: SuperAdminSidebarProps) {
  const { t } = useTranslation();

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="sidebar-transition" {...props}>
      <SidebarHeader className="sidebar-content-transition">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="group-data-[collapsible=icon]:!p-0 cursor-default hover:bg-transparent hover:text-inherit focus:bg-transparent focus:text-inherit active:bg-transparent active:text-inherit md:hover:bg-transparent md:hover:text-inherit"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold border border-border/40 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!rounded-full">
                <Crown className="h-4 w-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold tiktok-sans-title">SuperAdmin</span>
                <span className="truncate text-xs text-muted-foreground">Panel de Control</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col gap-0 h-full sidebar-content-transition">
        <SidebarGroup className="flex-1 flex flex-col min-h-0">
          <SidebarMenu className="gap-2 p-2">
            {superAdminNavItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => onTabChange(item.id)}
                  isActive={activeTab === item.id}
                  className="w-full group-data-[collapsible=icon]:justify-center h-10 md:hover:bg-sidebar-accent md:hover:text-sidebar-accent-foreground sidebar-button-transition"
                  size="sm"
                  tooltip={`${item.title} - ${item.description}`}
                >
                  <item.icon className="h-4 w-4 group-data-[collapsible=icon]:mx-auto" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="sidebar-content-transition">
        <NavActions />
      </SidebarFooter>
    </Sidebar>
  )
}