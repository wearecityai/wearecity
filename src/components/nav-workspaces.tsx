import {
  MoreHorizontal,
  Plus,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Sample data for workspaces
const workspaces = [
  {
    name: "Gestión de Vida Personal",
    emoji: "🏠",
    id: "personal",
  },
  {
    name: "Desarrollo Profesional",
    emoji: "💼",
    id: "professional",
  },
  {
    name: "Proyectos Creativos",
    emoji: "🎨",
    id: "creative",
  },
  {
    name: "Gestión del Hogar",
    emoji: "🏡",
    id: "home",
  },
  {
    name: "Viajes y Aventuras",
    emoji: "🧳",
    id: "travel",
  },
]

export function NavWorkspaces() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Espacios de Trabajo</SidebarGroupLabel>
      <SidebarMenu>
        {workspaces.map((workspace) => (
          <SidebarMenuItem key={workspace.name}>
            <SidebarMenuButton asChild>
              <a href={`#${workspace.id}`}>
                <span className="flex aspect-square size-6 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {workspace.emoji}
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{workspace.name}</span>
                </div>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">Más</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side="bottom"
                align="end"
              >
                <DropdownMenuItem>
                  <span>Renombrar espacio de trabajo</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Duplicar espacio de trabajo</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>Eliminar espacio de trabajo</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>Más</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}