import * as React from "react"
import {
  Building2,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Activity,
  Globe,
  Shield,
  Database,
  UserCog,
} from "lucide-react"

import { NavMainSuperAdmin } from "@/components/nav-main-superadmin"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

export function SuperAdminSidebar({ user, activeTab, onTabChange }: SuperAdminSidebarProps) {
  const data = {
    user: user || {
      name: "SuperAdmin",
      email: "admin@wearecity.ai",
      avatar: "/avatars/superadmin.jpg",
    },
    navMain: [
      {
        title: "Resumen",
        url: "#overview",
        icon: BarChart3,
        isActive: activeTab === "overview",
        onClick: () => onTabChange?.("overview"),
      },
      {
        title: "Usuarios",
        url: "#users", 
        icon: Users,
        isActive: activeTab === "users",
        onClick: () => onTabChange?.("users"),
      },
      {
        title: "Ciudades",
        url: "#cities",
        icon: Building2,
        isActive: activeTab === "cities", 
        onClick: () => onTabChange?.("cities"),
      },
      {
        title: "Mensajes",
        url: "#messages",
        icon: MessageSquare,
        isActive: activeTab === "messages",
        onClick: () => onTabChange?.("messages"),
      },
      {
        title: "Configuración",
        url: "#settings",
        icon: Settings,
        isActive: activeTab === "settings",
        onClick: () => onTabChange?.("settings"),
      },
    ],
  }

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
        <NavMainSuperAdmin items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}