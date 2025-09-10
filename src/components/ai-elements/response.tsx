'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';
import { Streamdown } from 'streamdown';

// CSS personalizado para forzar la jerarquía de títulos
const streamdownStyles = `
  .streamdown-container h1 {
    font-size: 1.875rem !important; /* 30px */
    font-weight: 700 !important;
    line-height: 1.25 !important;
    margin-bottom: 1rem !important;
    margin-top: 1.5rem !important;
    color: inherit !important;
  }
  
  .streamdown-container h2 {
    font-size: 1.5rem !important; /* 24px */
    font-weight: 600 !important;
    line-height: 1.375 !important;
    margin-bottom: 0.75rem !important;
    margin-top: 1.25rem !important;
    color: inherit !important;
  }
  
  .streamdown-container h3 {
    font-size: 1.25rem !important; /* 20px */
    font-weight: 500 !important;
    line-height: 1.5 !important;
    margin-bottom: 0.5rem !important;
    margin-top: 1rem !important;
    color: inherit !important;
  }
  
  .streamdown-container h4 {
    font-size: 1.125rem !important; /* 18px */
    font-weight: 500 !important;
    margin-bottom: 0.5rem !important;
    margin-top: 0.75rem !important;
    color: inherit !important;
  }
  
  .streamdown-container p {
    font-size: 1rem !important;
    line-height: 1.625 !important;
    margin-bottom: 1rem !important;
  }
  
  .streamdown-container strong {
    font-weight: 700 !important;
  }
  
  .streamdown-container em {
    font-style: italic !important;
  }
  
  .streamdown-container table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin-bottom: 1rem !important;
  }
  
  .streamdown-container th,
  .streamdown-container td {
    border: 1px solid hsl(var(--border)) !important;
    padding: 0.75rem !important;
  }
  
  .streamdown-container th {
    background-color: hsl(var(--muted)) !important;
    font-weight: 600 !important;
  }
  
  .streamdown-container ul {
    list-style-type: disc !important;
    margin-left: 1.5rem !important;
    margin-bottom: 1rem !important;
  }
  
  .streamdown-container ol {
    list-style-type: decimal !important;
    margin-left: 1.5rem !important;
    margin-bottom: 1rem !important;
  }
  
  .streamdown-container li {
    margin: 0.25rem 0 !important;
  }
  
  .streamdown-container blockquote {
    border-left: 4px solid hsl(var(--primary)) !important;
    padding-left: 1rem !important;
    font-style: italic !important;
    margin-bottom: 1rem !important;
  }
  
  .streamdown-container hr {
    border-top: 1px solid hsl(var(--border)) !important;
    margin: 1.5rem 0 !important;
  }
  
  .streamdown-container pre {
    background-color: hsl(var(--muted)) !important;
    padding: 1rem !important;
    border-radius: 0.5rem !important;
    overflow-x: auto !important;
    margin-bottom: 1rem !important;
  }
  
  .streamdown-container code {
    font-size: 0.875rem !important;
    background-color: hsl(var(--muted)) !important;
    padding: 0.25rem 0.5rem !important;
    border-radius: 0.25rem !important;
  }
`;

type ResponseProps = {
  children: string;
  className?: string;
  parseIncompleteMarkdown?: boolean;
};

export const Response = memo(
  ({ className, children, ...props }: ResponseProps) => (
    <>
      {/* Inyectar estilos CSS personalizados */}
      <style dangerouslySetInnerHTML={{ __html: streamdownStyles }} />
      
      <div className={cn(
        // Clase personalizada para nuestros estilos CSS
        "streamdown-container",
        // Estilos base de prose con max-width none
        "prose dark:prose-invert max-w-none",
        className
      )}>
        <Streamdown 
          parseIncompleteMarkdown={true}
          {...props}
        >
          {children}
        </Streamdown>
      </div>
    </>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = 'Response';
