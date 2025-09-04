import React from 'react';

interface HierarchicalListProps {
  items: Array<{
    content: React.ReactNode;
    level: 1 | 2 | 3;
  }>;
  className?: string;
}

export const HierarchicalList: React.FC<HierarchicalListProps> = ({ 
  items, 
  className = "" 
}) => {
  const getIndentClass = (level: number) => {
    switch (level) {
      case 1:
        return "ml-0";
      case 2:
        return "ml-6";
      case 3:
        return "ml-12";
      default:
        return "ml-0";
    }
  };

  const getBulletSize = (level: number) => {
    switch (level) {
      case 1:
        return "w-2 h-2";
      case 2:
        return "w-1.5 h-1.5";
      case 3:
        return "w-1 h-1";
      default:
        return "w-2 h-2";
    }
  };

  const getBulletColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-gray-400 dark:bg-gray-500";
      case 2:
        return "bg-gray-300 dark:bg-gray-600";
      case 3:
        return "bg-gray-200 dark:bg-gray-700";
      default:
        return "bg-gray-400 dark:bg-gray-500";
    }
  };

  return (
    <div className={`space-y-2 my-4 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className={`flex items-start text-gray-700 dark:text-gray-300 leading-relaxed ${getIndentClass(item.level)}`}>
          <span className={`${getBulletSize(item.level)} ${getBulletColor(item.level)} rounded-full mt-2 mr-3 flex-shrink-0`}></span>
          <span className="flex-1">{item.content}</span>
        </div>
      ))}
    </div>
  );
};

export default HierarchicalList;
