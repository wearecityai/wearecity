import React from 'react';
import { 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  AlertCircle
} from 'lucide-react';

interface AlertBoxProps {
  type: 'info' | 'warning' | 'success' | 'error' | 'tip';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const AlertBox: React.FC<AlertBoxProps> = ({ 
  type, 
  title, 
  children, 
  className = "" 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'info':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      case 'success':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'tip':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div className={`border-l-4 pl-4 py-3 rounded-r-lg my-4 ${getStyles()} ${className}`}>
      <div className="flex items-start space-x-2">
        {getIcon()}
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <div className="text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertBox;
