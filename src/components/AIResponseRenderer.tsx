import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { HierarchicalListRenderer } from './HierarchicalListRenderer';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Star, 
  Calendar, 
  Users, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

interface AIResponseRendererProps {
  content: string;
  className?: string;
}

export const AIResponseRenderer: React.FC<AIResponseRendererProps> = ({ 
  content, 
  className = "" 
}) => {
  return (
    <div className={`prose prose-lg max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Código con syntax highlighting y espaciado coherente
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-8">
                <SyntaxHighlighter
                  language={match[1]}
                  PreTag="div"
                  style={tomorrow}
                  className="rounded-lg"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code 
                className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono" 
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // Tablas con espaciado coherente
          table: ({ children }) => (
            <div className="overflow-x-auto my-8">
              <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                {children}
              </table>
            </div>
          ),
          
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-800">
              {children}
            </thead>
          ),
          
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              {children}
            </th>
          ),
          
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              {children}
            </td>
          ),
          
          // Blockquotes para alertas y tips - espaciado coherente
          blockquote: ({ children }) => (
            <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg my-8">
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {children}
              </div>
            </div>
          ),
          
          // Listas con indentación correcta y alineación perfecta del texto
          ul: ({ children }) => (
            <ul className="space-y-2 my-4 list-none ml-0">
              {children}
            </ul>
          ),
          
          ol: ({ children }) => (
            <ol className="space-y-2 my-4 list-none ml-0">
              {children}
            </ol>
          ),
          
          li: ({ children }) => {
            // Convertir children a string para procesar el contenido
            const content = React.Children.toArray(children);
            
            return (
              <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <div className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div className="flex-1">
                    {content.map((child, index) => {
                      if (typeof child === 'string') {
                        // Si es texto, dividir por saltos de línea y renderizar correctamente
                        const lines = child.split('\n');
                        return lines.map((line, lineIndex) => (
                          <div key={`${index}-${lineIndex}`} className={lineIndex > 0 ? 'ml-0' : ''}>
                            {line}
                          </div>
                        ));
                      }
                      return child;
                    })}
                  </div>
                </div>
              </li>
            );
          },
          
          // Títulos con espaciado coherente
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 pb-3 border-b border-gray-200 dark:border-gray-700">
              {children}
            </h1>
          ),
          
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 mt-10">
              {children}
            </h2>
          ),
          
          h3: ({ children }) => (
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4 mt-8">
              {children}
            </h3>
          ),
          
          // Párrafos con espaciado coherente
          p: ({ children, ...props }) => {
            // Si está dentro de una lista, no aplicar margen inferior
            const isInList = props.className?.includes('list-item') || false;
            return (
              <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${isInList ? 'mb-0' : 'mb-6'}`}>
                {children}
              </p>
            );
          },
          
          // Enlaces con colores neutros
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
            >
              {children}
            </a>
          ),
          
          // Separadores horizontales con más espacio
          hr: () => (
            <div className="my-12 border-t border-gray-200 dark:border-gray-700"></div>
          ),
          
          // Listas de tareas (checkboxes)
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input 
                  type="checkbox" 
                  checked={checked} 
                  readOnly
                  className="mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AIResponseRenderer;
