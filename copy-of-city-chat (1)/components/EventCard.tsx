

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Chip, Link, CircularProgress, useTheme, Tooltip, Stack } from '@mui/material';
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
    <Card variant="outlined" sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, width: '100%', maxWidth: 450, borderRadius: 2 }}>
      <Box sx={{
          width: {xs: '100%', sm: 80 }, 
          minHeight: {xs: 60, sm: 'auto'},
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText', 
          p: 1,
          textAlign: 'center',
          borderTopLeftRadius: {xs: (theme.shape.borderRadius as number) * 2, sm: (theme.shape.borderRadius as number) * 2},
          borderBottomLeftRadius: {xs: 0, sm: (theme.shape.borderRadius as number) * 2},
          borderTopRightRadius: {xs: (theme.shape.borderRadius as number) * 2, sm: 0},
        }}>
        <Typography variant="h5" component="div" fontWeight="bold" lineHeight={1.1}>{dateParts.day}</Typography>
        <Typography variant="caption" component="div" lineHeight={1}>{dateParts.monthAbbr.toUpperCase()}</Typography>
        {dateParts.endDay && (
            <>
            <Typography variant="body2" component="div" sx={{my:0.2}}>-</Typography>
            <Typography variant="h6" component="div" fontWeight="bold" lineHeight={1.1}>{dateParts.endDay}</Typography>
            <Typography variant="caption" component="div" lineHeight={1}>{dateParts.endMonthAbbr.toUpperCase()}</Typography>
            </>
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle1" component="h3" fontWeight="medium" gutterBottom noWrap title={event.title}>
          {event.title}
        </Typography>
        <Stack spacing={0.5}>
            <Chip 
              icon={<EventIcon fontSize="small"/>} 
              label={renderDateDisplay()} 
              size="small" 
              variant="outlined" 
              sx={{ justifyContent: 'flex-start', p:0, height: 'auto', '& .MuiChip-label': {p:'4px 8px'} }}
            />
          {event.time && (
            <Chip 
              icon={<AccessTimeIcon fontSize="small"/>} 
              label={formatTime(event.time)} 
              size="small" 
              variant="outlined" 
              sx={{ justifyContent: 'flex-start', p:0, height: 'auto', '& .MuiChip-label': {p:'4px 8px'} }}
            />
          )}
          {event.location && (
            <Chip 
              icon={<LocationOnIcon fontSize="small"/>} 
              label={event.location} 
              size="small" 
              variant="outlined" 
              title={event.location}
              sx={{ justifyContent: 'flex-start', p:0, height: 'auto', '& .MuiChip-label': {p:'4px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'} }}
            />
          )}
        </Stack>
        {event.sourceUrl && linkStatus !== 'idle' && (
          <CardActions sx={{ pt: 1.5, px:0, pb:0 }}>
             <Tooltip title={buttonProps.title} placement="top">
                <span> {/* Span needed for Tooltip on disabled button */}
                <Button
                    component={Link}
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...buttonProps}
                >
                    {buttonProps.children}
                </Button>
                </span>
            </Tooltip>
          </CardActions>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;