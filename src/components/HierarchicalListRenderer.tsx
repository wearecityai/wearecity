import React from 'react';

interface ListItem {
  content: string;
  level: number;
  type?: 'bullet' | 'number' | 'dash';
}

interface HierarchicalListRendererProps {
  content: string;
  className?: string;
}

export const HierarchicalListRenderer: React.FC<HierarchicalListRendererProps> = ({ 
  content, 
  className = "" 
}) => {
  // Función para parsear el contenido markdown y convertirlo en estructura jerárquica
  const parseContent = (text: string): ListItem[] => {
    const lines = text.split('\n');
    const items: ListItem[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Detectar nivel de indentación
      const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)/);
      if (match) {
        const [, indent, marker, content] = match;
        const level = Math.floor(indent.length / 2) + 1;
        
        items.push({
          content: content.trim(),
          level: Math.min(level, 3), // Máximo 3 niveles
          type: marker.match(/\d+/) ? 'number' : 'bullet'
        });
      } else if (trimmedLine.startsWith('#')) {
        // Es un título, lo tratamos como nivel 0
        items.push({
          content: trimmedLine.replace(/^#+\s*/, ''),
          level: 0,
          type: 'bullet'
        });
      } else if (trimmedLine) {
        // Es texto normal, lo agregamos al último item
        if (items.length > 0) {
          items[items.length - 1].content += '\n' + trimmedLine;
        }
      }
    }
    
    return items;
  };

  const getIndentClass = (level: number) => {
    switch (level) {
      case 0: return 'ml-0';   // Títulos sin indentación
      case 1: return 'ml-0';   // Padres sin indentación
      case 2: return 'ml-8';   // Hijos con indentación media
      case 3: return 'ml-16';  // Nietos con más indentación
      default: return 'ml-0';
    }
  };

  const getBulletStyle = (level: number, type: string) => {
    switch (level) {
      case 0:
        return 'w-0 h-0'; // Sin bullet para títulos
      case 1:
        return type === 'number' ? 'w-6 h-6' : 'w-2 h-2';
      case 2:
        return type === 'number' ? 'w-5 h-5' : 'w-1.5 h-1.5';
      case 3:
        return type === 'number' ? 'w-4 h-4' : 'w-1 h-1';
      default:
        return 'w-2 h-2';
    }
  };

  const getBulletColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-transparent';
      case 1: return 'bg-gray-400 dark:bg-gray-500';
      case 2: return 'bg-gray-300 dark:bg-gray-600';
      case 3: return 'bg-gray-200 dark:bg-gray-700';
      default: return 'bg-gray-400 dark:bg-gray-500';
    }
  };

  const getTextStyle = (level: number) => {
    switch (level) {
      case 0:
        return 'text-2xl font-bold text-gray-900 dark:text-white mb-6';
      case 1:
        return 'text-gray-700 dark:text-gray-300 leading-relaxed';
      case 2:
        return 'text-gray-600 dark:text-gray-400 leading-relaxed';
      case 3:
        return 'text-gray-500 dark:text-gray-500 leading-relaxed';
      default:
        return 'text-gray-700 dark:text-gray-300 leading-relaxed';
    }
  };

  const renderContent = (content: string) => {
    // Dividir por saltos de línea y renderizar cada línea
    const lines = content.split('\n');
    return lines.map((line, index) => (
      <div key={index} className={index > 0 ? 'mt-1' : ''}>
        {line}
      </div>
    ));
  };

  const items = parseContent(content);

  return (
    <div className={`space-y-3 my-6 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className={`flex items-start ${getIndentClass(item.level)}`}>
          {item.level > 0 && (
            <span 
              className={`${getBulletStyle(item.level, item.type || 'bullet')} ${getBulletColor(item.level)} rounded-full mt-2 mr-3 flex-shrink-0`}
            ></span>
          )}
          <div className={`flex-1 ${getTextStyle(item.level)}`}>
            {renderContent(item.content)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HierarchicalListRenderer;
