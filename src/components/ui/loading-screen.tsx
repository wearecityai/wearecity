import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  subtitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Cargando...',
  subtitle,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className={cn(
      "flex items-center justify-center min-h-screen bg-background",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Loader2 className={cn(
            "animate-spin border-b-2 border-primary",
            sizeClasses[size]
          )} />
          <span className={cn(
            "text-muted-foreground font-medium",
            textSizes[size]
          )}>
            {message}
          </span>
        </div>
        {subtitle && (
          <div className={cn(
            "text-muted-foreground text-center max-w-md",
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          )}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
