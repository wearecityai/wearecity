import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Link, CircularProgress, useTheme, Tooltip, Stack, IconButton } from '@mui/material';
import EventIcon from '@mui/icons-material/Event'; // Replaces CalendarIcon
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Replaces ClockIcon
import LocationOnIcon from '@mui/icons-material/LocationOn'; // Replaces LocationPinIcon
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; // For warnings/errors

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
  const theme = useTheme();

  useEffect(() => {
    if (event.sourceUrl) {
      setLinkStatus('loading');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => { controller.abort(); setLinkStatus(prev => prev === 'loading' ? 'networkOrCorsError' : prev); }, 7000);
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
      return () => { clearTimeout(timeoutId); if (controller.signal && !controller.signal.aborted) controller.abort(); };
    } else setLinkStatus('idle');
  }, [event.sourceUrl]);

  const getEventDateParts = (dateString: string, endDateString?: string): EventDateDisplayParts => {
    const parseSingle = (ds: string) => {
      try {
        const [year, month, day] = ds.split('-').map(Number);
        if (year && month && day) {
          const monthIndex = month - 1;
          if (monthIndex >= 0 && monthIndex < 12) return { day: day.toString(), monthAbbr: spanishMonthAbbreviations[monthIndex], year: year.toString() };
        }
      } catch (e) { /* fallback */ }
      return { day: '??', monthAbbr: 'ERR', year: '????' };
    };
    const startParts = parseSingle(dateString);
    if (endDateString && endDateString !== dateString) {
      const endParts = parseSingle(endDateString);
      return { ...startParts, endDay: endParts.day, endMonthAbbr: endParts.monthAbbr, endYear: endParts.year };
    }
    return startParts;
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return timeString;
      const date = new Date(); date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) { return timeString; }
  };
  
  const dateParts = getEventDateParts(event.date, event.endDate);

  const renderDateDisplay = () => {
    let dateText = `${dateParts.day} ${dateParts.monthAbbr}`;
    if (dateParts.year && new Date().getFullYear().toString() !== dateParts.year) {
        dateText += ` ${dateParts.year}`;
    }
    if (dateParts.endDay && dateParts.endMonthAbbr) {
        let endDateText = `${dateParts.endDay} ${dateParts.endMonthAbbr}`;
        if (dateParts.endYear && dateParts.endYear !== dateParts.year) {
            endDateText += ` ${dateParts.endYear}`;
        } else if (dateParts.endYear && dateParts.endYear === dateParts.year && new Date().getFullYear().toString() !== dateParts.endYear){
            // If start year was shown, and end year is same, no need to repeat, unless it's not current year
        }
        dateText += ` - ${endDateText}`;
    }
    return dateText;
  };
  
  let buttonProps: any = {
    variant: "outlined",
    size: "small",
    color: "primary",
    startIcon: <OpenInNewIcon />,
    children: "Ver detalles",
    title: event.sourceTitle || "Ver detalles del evento",
    sx: { borderRadius: '16px', textTransform: 'none' }
  };

  if(linkStatus === 'loading') {
    buttonProps.startIcon = <CircularProgress size={16} color="inherit" />;
    buttonProps.children = "Verificando...";
    buttonProps.disabled = true;
    buttonProps.color = "inherit";
  } else if (linkStatus === 'notFound') {
    buttonProps.startIcon = <ReportProblemIcon />;
    buttonProps.children = "Fuente no encontrada";
    buttonProps.color = "error";
    buttonProps.disabled = true;
    buttonProps.title = "La fuente original no se pudo encontrar (404).";
  } else if (linkStatus === 'serverError' || linkStatus === 'networkOrCorsError') {
    buttonProps.startIcon = <ReportProblemIcon />;
    buttonProps.children = "Revisar fuente";
    buttonProps.color = "warning";
    buttonProps.title = linkStatus === 'serverError' ? "Problema con la fuente (error del servidor)." : "No se pudo verificar el enlace. Puedes intentar abrirlo.";
  }


  return (
    <Card variant="outlined" sx={{ 
      boxShadow: 0, 
      borderRadius: 3, 
      p: 0, 
      minWidth: 0, 
      width: '100%', 
      bgcolor: 'background.paper', 
      borderColor: 'divider', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 0,
      overflow: 'hidden', // Prevenir overflow
    }}>
      <CardContent sx={{ 
        p: { xs: 1, sm: 2 }, 
        pb: { xs: 0.75, sm: 1.5 }, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        minWidth: 0, // Prevenir overflow
      }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5, minWidth: 0 }}>
          <EventIcon color="primary" sx={{ fontSize: { xs: 20, sm: 22 }, opacity: 0.7, flexShrink: 0 }} />
          <Typography 
            variant="subtitle1" 
            fontWeight={500} 
            noWrap 
            title={event.title} 
            sx={{ 
              flexGrow: 1, 
              minWidth: 0, 
              color: 'text.primary',
              fontSize: { xs: '0.9rem', sm: '1rem' },
            }}
          >
            {event.title}
          </Typography>
        </Stack>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 0.5, sm: 2 }} 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          sx={{ 
            color: 'text.secondary', 
            fontSize: { xs: 13, sm: 14 }, 
            mb: 0.5,
            minWidth: 0,
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
            <AccessTimeIcon sx={{ fontSize: { xs: 16, sm: 18 }, opacity: 0.6, flexShrink: 0 }} />
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: 13, sm: 14 },
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {event.time ? formatTime(event.time) : renderDateDisplay()}
            </Typography>
          </Stack>
          {event.location && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
              <LocationOnIcon sx={{ fontSize: { xs: 16, sm: 18 }, opacity: 0.6, flexShrink: 0 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: 13, sm: 14 }, 
                  textOverflow: 'ellipsis', 
                  overflow: 'hidden', 
                  whiteSpace: 'nowrap', 
                  maxWidth: { xs: '100%', sm: 120 },
                  minWidth: 0,
                }}
              >
                {event.location}
              </Typography>
            </Stack>
          )}
        </Stack>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary', 
            fontSize: { xs: 12, sm: 13 }, 
            mb: 0.5,
            minWidth: 0,
          }}
        >
          {renderDateDisplay()}
        </Typography>
      </CardContent>
      {event.sourceUrl && linkStatus !== 'idle' && (
        <CardActions sx={{ 
          px: { xs: 1, sm: 2 }, 
          pb: { xs: 0.75, sm: 1.5 }, 
          pt: 0, 
          justifyContent: 'flex-end',
          minWidth: 0,
        }}>
          <Tooltip title={buttonProps.title} placement="top">
            <span>
              <IconButton
                component={Link}
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                color={buttonProps.color}
                disabled={buttonProps.disabled}
                sx={{ borderRadius: 2, p: 0.75 }}
              >
                {buttonProps.startIcon}
              </IconButton>
            </span>
          </Tooltip>
        </CardActions>
      )}
    </Card>
  );
};

export default EventCard;