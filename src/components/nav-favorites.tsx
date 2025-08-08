import {
  MoreHorizontal,
  Star,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Sample data from the dashboard context
const favorites = [
  {
    title: "Gestión de Proyectos & Seguimiento de Tareas",
    emoji: "📊",
    url: "#",
  },
  {
    title: "Colección de Recetas Familiares & Planificación de Comidas",
    emoji: "🍳",
    url: "#",
  },
  {
    title: "Rastreador de Fitness & Rutinas de Ejercicio",
    emoji: "💪",
    url: "#",
  },
  {
    title: "Notas de Libros & Lista de Lectura",
    emoji: "📚",
    url: "#",
  },
  {
    title: "Consejos de Jardinería Sostenible & Cuidado de Plantas",
    emoji: "🌱",
    url: "#",
  },
]

export function NavFavorites() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Favoritos</SidebarGroupLabel>
      <SidebarMenu>
        {favorites.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <a href={item.url} title={item.title}>
                <span className="flex aspect-square size-6 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {item.emoji}
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{item.title}</span>
                </div>
              </a>
            </SidebarMenuButton>
            <MoreHorizontal className="opacity-0 md:group-hover:opacity-100 ml-auto mr-2 size-4 shrink-0" />
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