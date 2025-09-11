import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  return (
    <div className={`max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Código con syntax highlighting
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
          
          // Tablas
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
          
          // Blockquotes para alertas
          blockquote: ({ children }) => (
            <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg my-8">
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {children}
              </div>
            </div>
          ),
          
          // Listas con mejor visibilidad
          ul: ({ children }) => (
            <ul className={`${compact ? 'my-2' : 'my-4'} list-none ml-0 space-y-1`}>
              {children}
            </ul>
          ),
          
          ol: ({ children }) => (
            <ol className={`${compact ? 'my-2' : 'my-4'} list-none ml-0 space-y-1`}>
              {children}
            </ol>
          ),
          
          li: ({ children }) => (
            <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {children}
            </li>
          ),
          
          // Títulos con jerarquía clara
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-8 first:mt-0 border-b border-gray-200 dark:border-gray-700 pb-2">
              {children}
            </h1>
          ),
          
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-6">
              {children}
            </h2>
          ),
          
          h3: ({ children }) => (
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3 mt-5">
              {children}
            </h3>
          ),
          
          h4: ({ children }) => (
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 mt-4">
              {children}
            </h4>
          ),
          
          h5: ({ children }) => (
            <h5 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-2 mt-3">
              {children}
            </h5>
          ),
          
          h6: ({ children }) => (
            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-3">
              {children}
            </h6>
          ),
          
          // Párrafos como ChatGPT
          p: ({ children }) => (
            <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${compact ? 'mb-0' : 'mb-3'}`}>
              {children}
            </p>
          ),
          
          // Enlaces
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 sm:hover:underline"
            >
              {children}
            </a>
          ),
          
          // Separadores como ChatGPT
          hr: () => (
            <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
          ),
          
          // Checkboxes
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

export default EnhancedAIResponseRenderer;
