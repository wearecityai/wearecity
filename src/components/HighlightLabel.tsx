import React from 'react';

interface HighlightLabelProps {
  children: React.ReactNode;
  variant?: 'recommendation' | 'note' | 'highlight' | 'tip';
  className?: string;
}

export const HighlightLabel: React.FC<HighlightLabelProps> = ({ 
  children, 
  variant = 'highlight',
  className = "" 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'recommendation':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-600';
      case 'note':
        return 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700';
      case 'highlight':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600';
      case 'tip':
        return 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <span className={`inline-block px-2 py-1 text-sm font-medium rounded-sm ${getVariantStyles()} ${className}`}>
      {children}
    </span>
  );
};

export default HighlightLabel;
