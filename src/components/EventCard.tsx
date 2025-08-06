import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { EventInfo } from '../types';

interface EventCardProps {
  event: EventInfo;
}

type LinkStatus = 'idle' | 'loading' | 'valid' | 'notFound' | 'serverError' | 'networkOrCorsError';

const spanishMonthAbbreviations = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

interface EventDateDisplayParts {
  day: string;
  monthAbbr: string;
  year?: string;
  endDay?: string;
  endMonthAbbr?: string;
  endYear?: string;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('idle');

  useEffect(() => {
    if (event.sourceUrl) {
      setLinkStatus('loading');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => { 
        controller.abort(); 
        setLinkStatus(prev => prev === 'loading' ? 'networkOrCorsError' : prev); 
      }, 7000);
      
      fetch(event.sourceUrl, { method: 'HEAD', signal: controller.signal, mode: 'cors' })
        .then(response => {
          clearTimeout(timeoutId);
          if (response.ok || (response.status >= 200 && response.status < 400)) setLinkStatus('valid');
          else if (response.status === 404) setLinkStatus('notFound');
          else setLinkStatus('serverError');
        })
        .catch(error => {
          clearTimeout(timeoutId);
          if (error.name !== 'AbortError') console.warn(`Link check for ${event.sourceUrl} failed:`, error);
          setLinkStatus('networkOrCorsError');
        });
      
      return () => { 
        clearTimeout(timeoutId); 
        if (controller.signal && !controller.signal.aborted) controller.abort(); 
      };
    } else {
      setLinkStatus('idle');
    }
  }, [event.sourceUrl]);

  const parseEventDate = (dateStr: string): EventDateDisplayParts | null => {
    try {
      const cleanDateStr = dateStr.trim();
      const dateRangeRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const rangeMatch = cleanDateStr.match(dateRangeRegex);
      
      if (rangeMatch) {
        const [, startDay, startMonth, startYear, endDay, endMonth, endYear] = rangeMatch;
        const startMonthIndex = parseInt(startMonth, 10) - 1;
        const endMonthIndex = parseInt(endMonth, 10) - 1;
        
        if (startMonthIndex >= 0 && startMonthIndex < 12 && endMonthIndex >= 0 && endMonthIndex < 12) {
          return {
            day: startDay.padStart(2, '0'),
            monthAbbr: spanishMonthAbbreviations[startMonthIndex],
            year: startYear !== endYear ? startYear : undefined,
            endDay: endDay.padStart(2, '0'),
            endMonthAbbr: spanishMonthAbbreviations[endMonthIndex],
            endYear: endYear
          };
        }
      } else {
        const singleDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const singleMatch = cleanDateStr.match(singleDateRegex);
        
        if (singleMatch) {
          const [, day, month, year] = singleMatch;
          const monthIndex = parseInt(month, 10) - 1;
          
          if (monthIndex >= 0 && monthIndex < 12) {
            return {
              day: day.padStart(2, '0'),
              monthAbbr: spanishMonthAbbreviations[monthIndex],
              year
            };
          }
        }
      }
      return null;
    } catch (error) {
      console.warn('Error parsing event date:', dateStr, error);
      return null;
    }
  };

  const dateParts = event.date ? parseEventDate(event.date) : null;

  const formatTimeRange = (timeStr: string): string => {
    if (!timeStr || timeStr.trim() === '') return '';
    
    const cleanTime = timeStr.trim();
    const timeRangeRegex = /^(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})$/;
    const match = cleanTime.match(timeRangeRegex);
    
    if (match) {
      const [, startHour, startMin, endHour, endMin] = match;
      return `${startHour.padStart(2, '0')}:${startMin} - ${endHour.padStart(2, '0')}:${endMin}`;
    }
    
    return cleanTime;
  };

  const getLinkStatusColor = (): string => {
    switch (linkStatus) {
      case 'valid': return 'text-success';
      case 'notFound': return 'text-warning-foreground';
      case 'serverError': return 'text-error';
      case 'networkOrCorsError': return 'text-warning-foreground';
      case 'loading': return 'text-muted-foreground';
      default: return 'text-primary';
    }
  };

  const getLinkStatusIcon = () => {
    switch (linkStatus) {
      case 'loading': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'notFound': return <AlertTriangle className="h-3 w-3" />;
      case 'serverError': return <AlertTriangle className="h-3 w-3" />;
      case 'networkOrCorsError': return <AlertTriangle className="h-3 w-3" />;
      default: return <ExternalLink className="h-3 w-3" />;
    }
  };

  const renderDateBadge = () => {
    if (!dateParts) return null;

    return (
      <div className="flex items-center space-x-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className="text-xs font-semibold">
            {dateParts.endDay ? 
              `${dateParts.day}-${dateParts.endDay} ${dateParts.monthAbbr}${dateParts.endYear ? ` ${dateParts.endYear}` : ''}` :
              `${dateParts.day} ${dateParts.monthAbbr}${dateParts.year ? ` ${dateParts.year}` : ''}`
            }
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-sm border-border hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {event.title}
          </h3>
          
          <div className="flex flex-wrap gap-2 text-xs">
            {renderDateBadge()}
            
            {event.time && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {formatTimeRange(event.time)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {event.location && (
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground line-clamp-2">
                {event.location}
              </span>
            </div>
          )}


          {event.sourceUrl && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full ${getLinkStatusColor()}`}
                    asChild
                  >
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2"
                    >
                      {getLinkStatusIcon()}
                      <span>Ver detalles</span>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {linkStatus === 'loading' && 'Verificando enlace...'}
                  {linkStatus === 'valid' && 'Enlace verificado'}
                  {linkStatus === 'notFound' && 'Enlace no encontrado (404)'}
                  {linkStatus === 'serverError' && 'Error del servidor'}
                  {linkStatus === 'networkOrCorsError' && 'No se pudo verificar el enlace'}
                  {linkStatus === 'idle' && 'Abrir enlace'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;