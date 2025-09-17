import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface FormButtonProps {
  title: string;
  url: string;
  description?: string;
}

export const FormButton: React.FC<FormButtonProps> = ({ title, url, description }) => {
  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="my-4">
      <Button
        onClick={handleClick}
        variant="outline"
        className="w-full justify-between h-auto p-4 text-left hover:bg-accent hover:text-accent-foreground"
      >
        <div className="flex-1">
          <div className="font-medium text-sm">{title}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-1">{description}</div>
          )}
        </div>
        <ExternalLink className="h-4 w-4 ml-2 flex-shrink-0" />
      </Button>
    </div>
  );
};

