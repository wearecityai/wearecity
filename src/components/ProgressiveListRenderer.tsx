import React from 'react';

interface ProgressiveListRendererProps {
  content: string;
  className?: string;
}

export const ProgressiveListRenderer: React.FC<ProgressiveListRendererProps> = ({ 
  content, 
  className = "" 
}) => {
  // Función para parsear el contenido y detectar niveles de indentación
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const items: Array<{ content: string; level: number; type: 'title' | 'list' | 'text' }> = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Detectar títulos
      if (trimmedLine.startsWith('#')) {
        const level = (trimmedLine.match(/^#+/) || [''])[0].length;
        items.push({
          content: trimmedLine.replace(/^#+\s*/, ''),
          level: level,
          type: 'title'
        });
      }
      // Detectar listas con indentación
      else if (line.match(/^\s*[-*+]\s/)) {
        const indentMatch = line.match(/^(\s*)([-*+])\s+(.+)/);
        if (indentMatch) {
          const [, indent, , content] = indentMatch;
          // Contar espacios de indentación (cada 2 espacios = 1 nivel)
          const level = Math.floor(indent.length / 2) + 1;
          console.log(`Lista detectada: "${content.trim()}", indentación: ${indent.length} espacios, nivel: ${level}`);
          items.push({
            content: content.trim(),
            level: Math.min(level, 3),
            type: 'list'
          });
        }
      }
      // Detectar listas numeradas
      else if (line.match(/^\s*\d+\.\s/)) {
        const indentMatch = line.match(/^(\s*)(\d+\.)\s+(.+)/);
        if (indentMatch) {
          const [, indent, , content] = indentMatch;
          // Contar espacios de indentación (cada 2 espacios = 1 nivel)
          const level = Math.floor(indent.length / 2) + 1;
          console.log(`Lista numerada detectada: "${content.trim()}", indentación: ${indent.length} espacios, nivel: ${level}`);
          items.push({
            content: content.trim(),
            level: Math.min(level, 3),
            type: 'list'
          });
        }
      }
      // Texto normal
      else {
        items.push({
          content: trimmedLine,
          level: 0,
          type: 'text'
        });
      }
    }
    
    return items;
  };

  const getIndentClass = (level: number, type: string) => {
    if (type === 'title') return 'ml-0';
    
    switch (level) {
      case 1: return 'ml-0';   // Padres sin indentación
      case 2: return 'ml-8';   // Hijos con indentación media (32px)
      case 3: return 'ml-16';  // Nietos con más indentación (64px)
      default: return 'ml-0';
    }
  };

  const getBulletStyle = (level: number) => {
    switch (level) {
      case 1: return 'w-2 h-2';
      case 2: return 'w-1.5 h-1.5';
      case 3: return 'w-1 h-1';
      default: return 'w-2 h-2';
    }
  };

  const getBulletColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-gray-400 dark:bg-gray-500';
      case 2: return 'bg-gray-300 dark:bg-gray-600';
      case 3: return 'bg-gray-200 dark:bg-gray-700';
      default: return 'bg-gray-400 dark:bg-gray-500';
    }
  };

  const getTextStyle = (level: number, type: string) => {
    if (type === 'title') {
      switch (level) {
        case 1: return 'text-2xl font-bold text-gray-900 dark:text-white mb-4';
        case 2: return 'text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4';
        case 3: return 'text-lg font-medium text-gray-900 dark:text-white mb-2 mt-3';
        default: return 'text-2xl font-bold text-gray-900 dark:text-white mb-4';
      }
    }
    
    return 'text-gray-700 dark:text-gray-300 leading-relaxed';
  };

  const items = parseContent(content);

  return (
    <div className={`space-y-2 my-4 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className={`flex items-start ${getIndentClass(item.level, item.type)}`}>
          {item.type === 'list' && (
            <span 
              className={`${getBulletStyle(item.level)} ${getBulletColor(item.level)} rounded-full mt-2 mr-3 flex-shrink-0`}
            ></span>
          )}
          <div className={`flex-1 ${getTextStyle(item.level, item.type)}`}>
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressiveListRenderer;
