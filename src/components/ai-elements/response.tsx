'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';
import { Streamdown } from 'streamdown';

type ResponseProps = {
  children: string;
  className?: string;
  parseIncompleteMarkdown?: boolean;
};

export const Response = memo(
  ({ className, children, ...props }: ResponseProps) => (
    <div className={cn(
      // Aplicar clases prose básicas con especificidad alta
      "prose dark:prose-invert max-w-none",
      // Títulos con tamaños específicos
      "prose-h1:text-3xl prose-h1:font-bold prose-h1:leading-tight prose-h1:text-foreground",
      "prose-h2:text-2xl prose-h2:font-semibold prose-h2:leading-snug prose-h2:text-foreground",
      "prose-h3:text-xl prose-h3:font-medium prose-h3:leading-normal prose-h3:text-foreground",
      "prose-h4:text-lg prose-h4:font-medium prose-h4:text-foreground",
      // Párrafos y texto
      "prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground",
      "prose-strong:font-bold prose-strong:text-foreground",
      "prose-em:italic",
      // Listas
      "prose-ul:list-disc prose-ol:list-decimal prose-li:my-1",
      // Código
      "prose-code:text-sm prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground",
      "prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg",
      className
    )}>
      <Streamdown 
        parseIncompleteMarkdown={true}
        {...props}
      >
        {children}
      </Streamdown>
    </div>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = 'Response';
