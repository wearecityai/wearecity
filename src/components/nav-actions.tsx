import * as React from "react"
import {
  MoreHorizontal,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function NavActions() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="hidden font-medium text-muted-foreground md:inline-block">
        Editar Octubre 2024
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Plus />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 data-[state=open]:bg-accent"
          >
            <MoreHorizontal />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 rounded-lg" align="end">
          <div className="grid">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="justify-start">
                  Personalizar página
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="right">
                <DropdownMenuItem>
                  Convertir en wiki
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="justify-start">
              Copiar enlace
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Duplicar
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Mover a
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Mover a papelera
            </Button>
            <DropdownMenuSeparator />
            <Button variant="ghost" size="sm" className="justify-start">
              Deshacer
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Ver analíticas
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Historial de versiones
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Mostrar páginas eliminadas
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Notificaciones
            </Button>
            <DropdownMenuSeparator />
            <Button variant="ghost" size="sm" className="justify-start">
              Importar
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Exportar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}