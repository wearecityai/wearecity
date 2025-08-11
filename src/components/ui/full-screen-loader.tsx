import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullScreenLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  className,
  size = 'lg'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background flex items-center justify-center",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )} />
    </div>
  );
};
