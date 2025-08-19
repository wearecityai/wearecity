import React from 'react';
import { Button } from './ui/button';
import { Calendar, SortAsc } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EventSortingControlProps {
  currentSort: 'chronological' | 'alphabetical';
  onSortChange: (sort: 'chronological' | 'alphabetical') => void;
  className?: string;
}

const EventSortingControl: React.FC<EventSortingControlProps> = ({
  currentSort,
  onSortChange,
  className = ''
}) => {
  const { t } = useTranslation();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">
        {t('events.sortBy', { defaultValue: 'Ordenar por:' })}
      </span>
      
      <div className="flex rounded-md border border-input bg-background">
        <Button
          variant={currentSort === 'chronological' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSortChange('chronological')}
          className="rounded-r-none border-r border-input"
        >
          <Calendar className="h-4 w-4 mr-2" />
          {t('events.chronological', { defaultValue: 'Cronológico' })}
        </Button>
        
        <Button
          variant={currentSort === 'alphabetical' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSortChange('alphabetical')}
          className="rounded-l-none"
        >
          <SortAsc className="h-4 w-4 mr-2" />
          {t('events.alphabetical', { defaultValue: 'Alfabético' })}
        </Button>
      </div>
    </div>
  );
};

export default EventSortingControl;
