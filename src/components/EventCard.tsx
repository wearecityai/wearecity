import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, ExternalLink, AlertTriangle, Loader2, Music, Theater, Palette, Camera, BookOpen, Gamepad2, Utensils, ShoppingBag, Heart, Star, Zap, Users, Film, Building2, PartyPopper, Mic, Paintbrush, Dumbbell, Car, Plane, TreePine, Coffee, ShoppingCart, GraduationCap, Briefcase, Home, Wifi } from 'lucide-react';
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

const MONTH_FULL: Record<string, string[]> = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"],
  ca: ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  de: ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"]
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
  monthFull: string;
  year?: string;
  endDay?: string;
  endMonthAbbr?: string;
  endMonthFull?: string;
  endYear?: string;
}

// Función para detectar la categoría del evento y asignar icono
const getEventCategory = (title: string): { icon: React.ReactNode; category: string; color: string } => {
  const titleLower = title.toLowerCase();
  
  // Música y conciertos
  if (titleLower.includes('concierto') || titleLower.includes('música') || titleLower.includes('musical') || 
      titleLower.includes('banda') || titleLower.includes('orquesta') || titleLower.includes('coro') ||
      titleLower.includes('festival') || titleLower.includes('jazz') || titleLower.includes('rock') ||
      titleLower.includes('pop') || titleLower.includes('clásica') || titleLower.includes('flamenco') ||
      titleLower.includes('salsa') || titleLower.includes('reggaeton') || titleLower.includes('electrónica') ||
      titleLower.includes('cantante') || titleLower.includes('cantar') || titleLower.includes('micro') ||
      titleLower.includes('micrófono') || titleLower.includes('sonido') || titleLower.includes('audio')) {
    return { icon: <Music className="h-5 w-5" />, category: 'Música', color: 'text-purple-600' };
  }
  
  // Teatro y artes escénicas
  if (titleLower.includes('teatro') || titleLower.includes('obra') || titleLower.includes('drama') ||
      titleLower.includes('comedia') || titleLower.includes('musical') || titleLower.includes('danza') ||
      titleLower.includes('ballet') || titleLower.includes('flamenco') || titleLower.includes('baile') ||
      titleLower.includes('performance') || titleLower.includes('espectáculo') || titleLower.includes('actuación') ||
      titleLower.includes('actor') || titleLower.includes('actriz') || titleLower.includes('escenario')) {
    return { icon: <Theater className="h-5 w-5" />, category: 'Teatro', color: 'text-red-600' };
  }
  
  // Cine y películas
  if (titleLower.includes('cine') || titleLower.includes('película') || titleLower.includes('film') ||
      titleLower.includes('proyección') || titleLower.includes('estreno') || titleLower.includes('documental') ||
      titleLower.includes('cortometraje') || titleLower.includes('festival de cine') || titleLower.includes('cinema') ||
      titleLower.includes('director') || titleLower.includes('guionista') || titleLower.includes('actor de cine')) {
    return { icon: <Film className="h-5 w-5" />, category: 'Cine', color: 'text-blue-600' };
  }
  
  // Museos y cultura
  if (titleLower.includes('museo') || titleLower.includes('exposición') || titleLower.includes('expo') ||
      titleLower.includes('arte') || titleLower.includes('pintura') || titleLower.includes('escultura') ||
      titleLower.includes('fotografía') || titleLower.includes('galería') || titleLower.includes('cuadro') ||
      titleLower.includes('artista') || titleLower.includes('creativo') || titleLower.includes('cultural') ||
      titleLower.includes('patrimonio') || titleLower.includes('histórico') || titleLower.includes('arqueología')) {
    return { icon: <Building2 className="h-5 w-5" />, category: 'Museo', color: 'text-indigo-600' };
  }
  
  // Fiestas y celebraciones
  if (titleLower.includes('fiesta') || titleLower.includes('celebración') || titleLower.includes('festejo') ||
      titleLower.includes('carnaval') || titleLower.includes('verbenas') || titleLower.includes('fiestas patronales') ||
      titleLower.includes('feria') || titleLower.includes('romería') || titleLower.includes('festival popular') ||
      titleLower.includes('baile') || titleLower.includes('discoteca') || titleLower.includes('noche') ||
      titleLower.includes('party') || titleLower.includes('celebración') || titleLower.includes('aniversario')) {
    return { icon: <PartyPopper className="h-5 w-5" />, category: 'Fiestas', color: 'text-pink-600' };
  }
  
  // Deportes y actividades físicas
  if (titleLower.includes('deporte') || titleLower.includes('fútbol') || titleLower.includes('baloncesto') ||
      titleLower.includes('tenis') || titleLower.includes('natación') || titleLower.includes('carrera') ||
      titleLower.includes('maratón') || titleLower.includes('ciclismo') || titleLower.includes('gimnasio') ||
      titleLower.includes('yoga') || titleLower.includes('pilates') || titleLower.includes('fitness') ||
      titleLower.includes('atletismo') || titleLower.includes('boxeo') || titleLower.includes('artes marciales') ||
      titleLower.includes('escalada') || titleLower.includes('senderismo') || titleLower.includes('running')) {
    return { icon: <Dumbbell className="h-5 w-5" />, category: 'Deportes', color: 'text-green-600' };
  }
  
  // Gastronomía y restauración
  if (titleLower.includes('gastronomía') || titleLower.includes('comida') || titleLower.includes('cocina') ||
      titleLower.includes('chef') || titleLower.includes('degustación') || titleLower.includes('vino') ||
      titleLower.includes('cerveza') || titleLower.includes('tapas') || titleLower.includes('restaurante') ||
      titleLower.includes('cena') || titleLower.includes('almuerzo') || titleLower.includes('desayuno') ||
      titleLower.includes('café') || titleLower.includes('bar') || titleLower.includes('tasca') ||
      titleLower.includes('maridaje') || titleLower.includes('cata') || titleLower.includes('culinario')) {
    return { icon: <Coffee className="h-5 w-5" />, category: 'Gastronomía', color: 'text-orange-600' };
  }
  
  // Compras y mercados
  if (titleLower.includes('mercado') || titleLower.includes('feria') || titleLower.includes('artesanía') ||
      titleLower.includes('compra') || titleLower.includes('venta') || titleLower.includes('tienda') ||
      titleLower.includes('comercio') || titleLower.includes('bazar') || titleLower.includes('rastro') ||
      titleLower.includes('shopping') || titleLower.includes('centro comercial') || titleLower.includes('outlet') ||
      titleLower.includes('subasta') || titleLower.includes('antigüedades') || titleLower.includes('coleccionismo')) {
    return { icon: <ShoppingCart className="h-5 w-5" />, category: 'Compras', color: 'text-yellow-600' };
  }
  
  // Educación y formación
  if (titleLower.includes('curso') || titleLower.includes('taller') || titleLower.includes('formación') ||
      titleLower.includes('educación') || titleLower.includes('aprender') || titleLower.includes('enseñanza') ||
      titleLower.includes('seminario') || titleLower.includes('workshop') || titleLower.includes('masterclass') ||
      titleLower.includes('universidad') || titleLower.includes('colegio') || titleLower.includes('academia') ||
      titleLower.includes('conferencia') || titleLower.includes('charla') || titleLower.includes('presentación')) {
    return { icon: <GraduationCap className="h-5 w-5" />, category: 'Educación', color: 'text-blue-500' };
  }
  
  // Negocios y profesional
  if (titleLower.includes('negocio') || titleLower.includes('empresa') || titleLower.includes('trabajo') ||
      titleLower.includes('profesional') || titleLower.includes('networking') || titleLower.includes('congreso') ||
      titleLower.includes('convención') || titleLower.includes('feria comercial') || titleLower.includes('expo') ||
      titleLower.includes('reunión') || titleLower.includes('jornada') || titleLower.includes('simposio')) {
    return { icon: <Briefcase className="h-5 w-5" />, category: 'Negocios', color: 'text-gray-600' };
  }
  
  // Tecnología e innovación
  if (titleLower.includes('tecnología') || titleLower.includes('digital') || titleLower.includes('innovación') ||
      titleLower.includes('startup') || titleLower.includes('app') || titleLower.includes('software') ||
      titleLower.includes('programación') || titleLower.includes('hackathon') || titleLower.includes('tech') ||
      titleLower.includes('internet') || titleLower.includes('web') || titleLower.includes('online')) {
    return { icon: <Wifi className="h-5 w-5" />, category: 'Tecnología', color: 'text-cyan-600' };
  }
  
  // Eventos sociales y comunitarios
  if (titleLower.includes('social') || titleLower.includes('comunidad') || titleLower.includes('vecinos') ||
      titleLower.includes('asociación') || titleLower.includes('colectivo') || titleLower.includes('grupo') ||
      titleLower.includes('reunión') || titleLower.includes('asamblea') || titleLower.includes('encuentro') ||
      titleLower.includes('voluntariado') || titleLower.includes('solidaridad') || titleLower.includes('ayuda')) {
    return { icon: <Users className="h-5 w-5" />, category: 'Social', color: 'text-indigo-600' };
  }
  
  // Eventos especiales y celebraciones
  if (titleLower.includes('especial') || titleLower.includes('destacado') || titleLower.includes('importante') ||
      titleLower.includes('inauguración') || titleLower.includes('inaugura') || titleLower.includes('apertura') ||
      titleLower.includes('gala') || titleLower.includes('premio') || titleLower.includes('reconocimiento') ||
      titleLower.includes('homenaje') || titleLower.includes('tributo') || titleLower.includes('memorial')) {
    return { icon: <Star className="h-5 w-5" />, category: 'Especial', color: 'text-amber-600' };
  }
  
  // Por defecto, evento general
  return { icon: <Calendar className="h-5 w-5" />, category: 'Evento', color: 'text-gray-600' };
};

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('idle');
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const { i18n, t } = useTranslation();
  
  // Obtener categoría del evento
  const eventCategory = getEventCategory(event.title);

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
      const fullMonths = MONTH_FULL[lang] || MONTH_FULL.es;
      
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
            monthFull: fullMonths[monthIndex],
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
            monthFull: fullMonths[monthIndex],
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
            monthFull: fullMonths[startMonthIndex],
            year,
            endDay: endDay.padStart(2, '0'),
            endMonthAbbr: abbrs[endMonthIndex],
            endMonthFull: fullMonths[endMonthIndex],
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
            monthFull: fullMonths[monthIndex],
            year,
            endDay: endDay.padStart(2, '0'),
            endMonthAbbr: abbrs[monthIndex],
            endMonthFull: fullMonths[monthIndex],
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
            monthFull: fullMonths[startMonthIndex],
            year: startYear !== endYear ? startYear : undefined,
            endDay: endDay.padStart(2, '0'),
            endMonthAbbr: abbrs[endMonthIndex],
            endMonthFull: fullMonths[endMonthIndex],
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
              monthFull: fullMonths[monthIndex],
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
            monthFull: fullMonths[monthIndex],
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
        <div className="flex flex-col justify-center items-center">
          <div className="text-xs font-medium text-primary/70 uppercase tracking-wide">
            FECHA
          </div>
          <div className="text-lg font-bold text-primary leading-none mt-1 text-center">
            {event.date || 'N/A'}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col justify-center items-center">
        <div className="flex items-center justify-center">
          <div className="text-3xl font-bold text-primary leading-none">
            {dateParts.day}
          </div>
          <div className="text-3xl font-bold text-primary leading-none ml-2">
            {dateParts.monthFull}
          </div>
        </div>
        {dateParts.year && (
          <div className="text-xs text-primary/60 mt-1 font-medium">
            {dateParts.year}
          </div>
        )}
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
    <Card className="w-full border-t border-border flex flex-col overflow-hidden rounded-none border-0 p-0">
      {/* Sección con fecha grande a la izquierda */}
      <div className="flex-shrink-0 flex items-start relative">
        {/* Caja de fecha grande a la izquierda */}
        <div className="flex-shrink-0 w-20 sm:w-24 h-20 sm:h-24 bg-primary text-primary-foreground rounded-lg flex flex-col items-center justify-center ml-3 sm:ml-4 mt-3 sm:mt-4">
          <div className="text-2xl sm:text-3xl font-bold leading-none">
            {(() => {
              if (!dateParts) {
                return event.date ? event.date.split('-')[2] || 'N/A' : 'N/A';
              }
              return dateParts.day;
            })()}
          </div>
          <div className="text-sm sm:text-base font-medium mt-1 opacity-90">
            {(() => {
              if (!dateParts) {
                return event.date ? event.date.split('-')[1] || 'N/A' : 'N/A';
              }
              return dateParts.monthAbbr;
            })()}
          </div>
        </div>
        
        {/* Contenido del título y detalles centrado verticalmente con el cuadrado de fecha */}
        <div className="flex-1 px-3 sm:px-4 flex flex-col justify-center mt-3 sm:mt-4">
          <h3 className="font-semibold text-xl sm:text-2xl leading-tight line-clamp-1 text-foreground pr-12 sm:pr-16 mb-2">
            {(() => {
              const lang = (i18n.language || 'es').split('-')[0];
              const translated = event.titleTranslations?.[lang];
              return translated || event.title;
            })()}
          </h3>
          
          {/* Hora y ubicación a la derecha del cuadrado de fecha */}
          <div className="space-y-1">
            {/* Hora del evento */}
            <div className="flex items-center space-x-2">
              <Clock className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground truncate">
                {event.time ? formatTimeRange(event.time) : 'No especificado'}
              </span>
            </div>
            
            {/* Ubicación del evento */}
            <div className="flex items-start space-x-2">
              <MapPin className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground line-clamp-1 truncate">
                {event.location || 'No especificado'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Icono de categoría */}
        <div className={`absolute top-3 sm:top-4 right-3 sm:right-4 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0`}>
          <div className="w-4 sm:w-6 h-4 sm:h-6 flex items-center justify-center text-white">
            {eventCategory.icon}
          </div>
        </div>
      </div>
      
      {/* Descripción breve del evento (si existe) */}
      {event.description && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-2">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>
      )}

      {/* Botones de acción - Separados de la fecha */}
      <div className={`flex-shrink-0 h-12 flex items-center px-3 sm:px-4 ${!event.description ? 'mt-4' : 'mt-auto'}`}>
        <div className="flex gap-1 sm:gap-2 w-full">
          {/* Botón Ver detalles - solo mostrar si hay link de detalle */}
          {(event.eventDetailUrl && event.eventDetailUrl !== 'No disponible') && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 sm:h-8 text-xs sm:text-sm"
              asChild
            >
              <a
                href={event.eventDetailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1 sm:space-x-2"
              >
                <ExternalLink className="h-3 sm:h-4 w-3 sm:w-4" />
                <span>Detalles</span>
              </a>
            </Button>
          )}

          {/* Botón Añadir al calendario */}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 sm:h-8 text-xs sm:text-sm"
            onClick={addToDeviceCalendar}
            disabled={isAddingToCalendar || !event.date}
          >
            {isAddingToCalendar ? (
              <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 animate-spin mr-1" />
            ) : (
              <Calendar className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
            )}
            <span>Añadir</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EventCard;