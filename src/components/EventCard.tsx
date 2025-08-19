import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

const MONTH_ABBRS: Record<string, string[]> = {
  es: ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"],
  en: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
  ca: ["GEN", "FEB", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DES"],
  fr: ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUI", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"],
  de: ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"]
};

// Función auxiliar para convertir nombres de meses en español a índices
const getMonthIndexFromSpanishName = (monthName: string): number => {
  const monthMap: Record<string, number> = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
    'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
    'gen': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'oct': 9, 'nov': 10, 'dic': 11
  };
  
  return monthMap[monthName.toLowerCase()] ?? -1;
};

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
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const { i18n, t } = useTranslation();

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
      const lang = (i18n.language || 'es').split('-')[0];
      const abbrs = MONTH_ABBRS[lang] || MONTH_ABBRS.es;
      
      // Parse ISO format (YYYY-MM-DD) which is the standard from backend
      const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
      const isoMatch = cleanDateStr.match(isoDateRegex);
      
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const monthIndex = parseInt(month, 10) - 1;
        
        if (monthIndex >= 0 && monthIndex < 12) {
          return {
            day: parseInt(day, 10).toString(),
            monthAbbr: abbrs[monthIndex],
            year
          };
        }
      }
      
      // Parse Spanish date format: "21 de agosto de 2025" or "25 de agosto - 18 de septiembre de 2025"
      const spanishDateRegex = /^(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})$/i;
      const spanishMatch = cleanDateStr.match(spanishDateRegex);
      
      if (spanishMatch) {
        const [, day, monthName, year] = spanishMatch;
        const monthIndex = getMonthIndexFromSpanishName(monthName);
        
        if (monthIndex >= 0 && monthIndex < 12) {
          return {
            day: day.padStart(2, '0'),
            monthAbbr: abbrs[monthIndex],
            year
          };
        }
      }
      
      // Parse Spanish date range: "25 de agosto - 18 de septiembre de 2025"
      const spanishRangeRegex = /^(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s*-\s*(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})$/i;
      const spanishRangeMatch = cleanDateStr.match(spanishRangeRegex);
      
      if (spanishRangeMatch) {
        const [, startDay, startMonthName, endDay, endMonthName, year] = spanishRangeMatch;
        const startMonthIndex = getMonthIndexFromSpanishName(startMonthName);
        const endMonthIndex = getMonthIndexFromSpanishName(endMonthName);
        
        if (startMonthIndex >= 0 && startMonthIndex < 12 && endMonthIndex >= 0 && endMonthIndex < 12) {
          return {
            day: startDay.padStart(2, '0'),
            monthAbbr: abbrs[startMonthIndex],
            year,
            endDay: endDay.padStart(2, '0'),
            endMonthAbbr: abbrs[endMonthIndex],
            endYear: year
          };
        }
      }
      
      // Parse simple Spanish range: "2 - 30 de septiembre de 2025"
      const simpleSpanishRangeRegex = /^(\d{1,2})\s*-\s*(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})$/i;
      const simpleSpanishRangeMatch = cleanDateStr.match(simpleSpanishRangeRegex);
      
      if (simpleSpanishRangeMatch) {
        const [, startDay, endDay, monthName, year] = simpleSpanishRangeMatch;
        const monthIndex = getMonthIndexFromSpanishName(monthName);
        
        if (monthIndex >= 0 && monthIndex < 12) {
          return {
            day: startDay.padStart(2, '0'),
            monthAbbr: abbrs[monthIndex],
            year,
            endDay: endDay.padStart(2, '0'),
            endMonthAbbr: abbrs[monthIndex],
            endYear: year
          };
        }
      }
      
      // Fallback: Parse DD/MM/YYYY format for compatibility
      const dateRangeRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const rangeMatch = cleanDateStr.match(dateRangeRegex);
      
      if (rangeMatch) {
        const [, startDay, startMonth, startYear, endDay, endMonth, endYear] = rangeMatch;
        const startMonthIndex = parseInt(startMonth, 10) - 1;
        const endMonthIndex = parseInt(endMonth, 10) - 1;
        
        if (startMonthIndex >= 0 && startMonthIndex < 12 && endMonthIndex >= 0 && endMonthIndex < 12) {
          return {
            day: startDay.padStart(2, '0'),
            monthAbbr: abbrs[startMonthIndex],
            year: startYear !== endYear ? startYear : undefined,
            endDay: endDay.padStart(2, '0'),
            endMonthAbbr: abbrs[endMonthIndex],
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
              monthAbbr: abbrs[monthIndex],
              year
            };
          }
        }
      }
      
      // Nuevo fallback: intentar parsear fechas en formato más flexible
      const flexibleDateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
      const flexibleMatch = cleanDateStr.match(flexibleDateRegex);
      
      if (flexibleMatch) {
        const [, day, month, year] = flexibleMatch;
        const monthIndex = parseInt(month, 10) - 1;
        
        if (monthIndex >= 0 && monthIndex < 12) {
          return {
            day: day.padStart(2, '0'),
            monthAbbr: abbrs[monthIndex],
            year
          };
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
    
    // Patrones de tiempo más flexibles
    const timePatterns = [
      // HH:MM - HH:MM
      /^(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})$/,
      // HH:MM a HH:MM
      /^(\d{1,2}):(\d{2})\s+a\s+(\d{1,2}):(\d{2})$/,
      // HH:MM hasta HH:MM
      /^(\d{1,2}):(\d{2})\s+hasta\s+(\d{1,2}):(\d{2})$/,
      // Solo HH:MM
      /^(\d{1,2}):(\d{2})$/
    ];
    
    for (const pattern of timePatterns) {
      const match = cleanTime.match(pattern);
      if (match) {
        if (match.length === 3) {
          // Solo hora
          const [, hour, min] = match;
          return `${hour.padStart(2, '0')}:${min}`;
        } else if (match.length === 5) {
          // Rango de horas
          const [, startHour, startMin, endHour, endMin] = match;
          return `${startHour.padStart(2, '0')}:${startMin} - ${endHour.padStart(2, '0')}:${endMin}`;
        }
      }
    }
    
    // Si no coincide con ningún patrón, devolver el tiempo tal como está
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

  const renderCalendarDate = () => {
    if (!dateParts) {
      // Fallback: mostrar fecha en formato simple si no se puede parsear
      return (
        <div className="flex-shrink-0 flex flex-col justify-center items-center min-w-[70px] relative">
          <div className="text-xs font-medium text-primary/70 uppercase tracking-wide">
            FECHA
          </div>
          <div className="text-lg font-bold text-primary leading-none mt-1 text-center">
            {event.date || 'N/A'}
          </div>
          <div className="absolute -right-2 top-0 bottom-0 w-px bg-border"></div>
        </div>
      );
    }

    return (
      <div className="flex-shrink-0 flex flex-col justify-center items-center min-w-[70px] relative">
        <div className="text-xs font-medium text-primary/70 uppercase tracking-wide">
          {dateParts.monthAbbr}
        </div>
        <div className="text-3xl font-bold text-primary leading-none mt-1">
          {dateParts.day}
        </div>
        {dateParts.year && (
          <div className="text-xs text-primary/60 mt-1 font-medium">
            {dateParts.year}
          </div>
        )}
        {/* Separador vertical a la derecha */}
        <div className="absolute -right-2 top-0 bottom-0 w-px bg-border"></div>
      </div>
    );
  };

  const addToDeviceCalendar = async () => {
    if (!event.date || !event.time) {
      // Mostrar mensaje de error si no hay fecha o hora
      alert(t('events.noDateOrTime', { defaultValue: 'This event does not have a date or time specified' }));
      return;
    }

    setIsAddingToCalendar(true);
    
    try {
      // Crear objeto de evento para el calendario
      const eventData = {
        title: event.titleTranslations?.[i18n.language?.split('-')[0] || 'es'] || event.title,
        location: event.location || '',
        startDate: event.date,
        endDate: event.endDate || event.date, // Usar endDate si está disponible
        startTime: event.time?.split(' - ')[0] || '',
        endTime: event.time?.split(' - ')[1] || event.time?.split(' - ')[0] || '',
        url: event.sourceUrl || ''
      };

      // Crear archivo .ics (iCalendar)
      const icsContent = generateICSFile(eventData);
      
      // Crear blob y descargar
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error adding event to calendar:', error);
      alert(t('events.calendarError', { defaultValue: 'Error adding event to calendar' }));
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const generateICSFile = (eventData: any) => {
    const formatDate = (dateStr: string, timeStr: string = '') => {
      const date = new Date(dateStr);
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        date.setHours(hours || 0, minutes || 0, 0, 0);
      }
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDateTime = formatDate(eventData.startDate, eventData.startTime);
    const endDateTime = formatDate(eventData.endDate, eventData.endTime);

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//City Chat//Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@citychat.app`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:${eventData.title}`,
      `LOCATION:${eventData.location}`,
      `URL:${eventData.url}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  };

  return (
    <Card className="w-full max-w-md border-border md:hover:shadow-md transition-shadow">
      <div className="flex gap-4 p-4">
        {/* Fecha del calendario a la izquierda */}
        {renderCalendarDate()}
        
        {/* Contenido del evento a la derecha */}
        <div className="flex-1 min-w-0">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2">
                {(() => {
                  const lang = (i18n.language || 'es').split('-')[0];
                  const translated = event.titleTranslations?.[lang];
                  return translated || event.title;
                })()}
              </h3>
              
                             {event.time && (
                 <div className="flex items-center space-x-2 mb-2">
                   <Clock className="h-4 w-4 text-muted-foreground" />
                   <span className="text-sm text-muted-foreground">
                     {formatTimeRange(event.time)}
                   </span>
                 </div>
               )}
            </div>

            {event.location && (
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground line-clamp-2">
                  {event.location}
                </span>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              {/* Botón Ver detalles - solo mostrar si hay link de detalle */}
              {(event.eventDetailUrl && event.eventDetailUrl !== 'No disponible') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  asChild
                >
                  <a
                    href={event.eventDetailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Ver detalles</span>
                  </a>
                </Button>
              )}

              {/* Botón Añadir al calendario */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-input bg-background hover:bg-accent hover:text-accent-foreground"
                onClick={addToDeviceCalendar}
                disabled={isAddingToCalendar || !event.date}
              >
                {isAddingToCalendar ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Calendar className="h-4 w-4 mr-1" />
                )}
                <span>Añadir al calendario</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EventCard;