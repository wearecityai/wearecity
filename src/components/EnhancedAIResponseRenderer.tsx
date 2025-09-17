import React from 'react';
import { Streamdown } from 'streamdown';

interface EnhancedAIResponseRendererProps {
  content: string;
  className?: string;
  compact?: boolean; // Para mensajes de usuario sin márgenes extra
}

export const EnhancedAIResponseRenderer: React.FC<EnhancedAIResponseRendererProps> = ({ 
  content, 
  className = "",
  compact = false
}) => {
  // Only log debug info if content has changed to prevent spam
  const contentRef = React.useRef<string>('');
  if (contentRef.current !== content) {
    contentRef.current = content;
    console.log('🎨 Streamdown EnhancedAIResponseRenderer DEBUG:', {
      contentLength: content?.length || 0,
      hasMarkdownHeaders: /#{1,6}\s/.test(content || ''),
      hasBoldText: /\*\*.*?\*\*/.test(content || ''),
      hasLists: /^[-*+]\s/m.test(content || ''),
      contentPreview: content?.substring(0, 200) || ''
    });
  }

  // Add error boundary
  try {
    if (!content || typeof content !== 'string') {
      return <div className={`text-gray-500 ${className}`}>No content to display</div>;
    }

  return (
    <div className={`max-w-none ${className}`}>
      <Streamdown
        parseIncompleteMarkdown={true}
        className={`prose prose-lg max-w-none dark:prose-invert ${compact ? 'prose-compact' : ''}`}
        components={{
          // Mejora sutil de jerarquía de títulos
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6 mt-8" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 mt-7" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-3 mt-6" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2 mt-5" {...props}>
              {children}
            </h4>
          ),
          
          // Mejora de párrafos con mejor espaciado
          p: ({ children, ...props }) => (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed" {...props}>
              {children}
            </p>
          ),
          
          // Listas con mejor alineación y espaciado
          ul: ({ children, ...props }) => (
            <ul className={`space-y-1 ${compact ? 'mb-2' : 'mb-4'} ml-4`} {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className={`space-y-1 ${compact ? 'mb-2' : 'mb-4'} ml-4`} {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-gray-700 dark:text-gray-300 leading-relaxed" {...props}>
              {children}
            </li>
          ),
          
          // Texto destacado con estilos sutiles
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
              {children}
            </strong>
          ),
          
          // Enlaces con mejor contraste
          a: ({ children, href, ...props }) => (
            <a 
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
              {...props}
            >
              {children}
            </a>
          ),
          
          // Citas con estilo más limpio
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-3 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 text-gray-600 dark:text-gray-400 italic" {...props}>
              {children}
            </blockquote>
          ),
          
          // Código inline con fondo sutil
          code: ({ children, ...props }) => (
            <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          )
        }}
        // Configuración de seguridad
        allowedImagePrefixes={["*"]}
        allowedLinkPrefixes={["*"]}
        // Controles habilitados para tablas, código y diagramas
        controls={{
          table: true,
          code: true,
          mermaid: true
        }}
        // Tema de código
        shikiTheme={["github-light", "github-dark"]}
      >
        {content}
      </Streamdown>
    </div>
  );
  } catch (error) {
    console.error('Error rendering enhanced content:', error);
    return (
      <div className={`text-red-500 ${className}`}>
        Error rendering content. Please try again.
      </div>
    );
  }
};

export default EnhancedAIResponseRenderer;