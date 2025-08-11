import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatPreloaderProps {
  cityName?: string;
  className?: string;
}

export const ChatPreloader: React.FC<ChatPreloaderProps> = ({ 
  cityName = "tu ciudad",
  className 
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[60vh] bg-background",
      className
    )}>
      <div className="flex flex-col items-center gap-6">
        {/* Avatar placeholder */}
        <div className="w-20 h-20 rounded-full bg-muted/30 border-2 border-muted animate-pulse flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
        </div>
        
        {/* Loading message */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Configurando {cityName}...
          </h2>
          <p className="text-muted-foreground max-w-md">
            Estamos preparando tu asistente personalizado con toda la información de la ciudad
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse rounded-full" style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}></div>
        </div>
      </div>
    </div>
  );
};
