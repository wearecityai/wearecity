import { useTranslation } from 'react-i18next';

export const useLoadingPattern = () => {
  const { t } = useTranslation();

  const detectLoadingPattern = (userQuery: string): string => {
    if (!userQuery) return t('loading.wait', { defaultValue: 'Cargando respuesta...' });
    
    const query = userQuery.toLowerCase();
    
    // Patrones para eventos
    if (query.includes('evento') || query.includes('eventos') || query.includes('actividad') || 
        query.includes('actividades') || query.includes('festival') || query.includes('concierto') ||
        query.includes('teatro') || query.includes('exposición') || query.includes('feria') ||
        query.includes('celebracion') || query.includes('celebraciones') || query.includes('agenda') ||
        query.includes('show') || query.includes('espectaculo') || query.includes('espectáculo')) {
      return t('loading.events', { defaultValue: 'Buscando eventos...' });
    }
    
    // Patrones para lugares/sitios
    if (query.includes('lugar') || query.includes('lugares') || query.includes('sitio') || 
        query.includes('sitios') || query.includes('donde') || query.includes('dónde') ||
        query.includes('visitar') || query.includes('ver') || query.includes('conocer') ||
        query.includes('monumento') || query.includes('museo') || query.includes('parque') ||
        query.includes('plaza') || query.includes('iglesia') || query.includes('castillo') ||
        query.includes('atraccion') || query.includes('atracción') || query.includes('punto de interes') ||
        query.includes('punto de interés') || query.includes('landmark')) {
      return t('loading.places', { defaultValue: 'Buscando sitios...' });
    }
    
    // Patrones para restaurantes
    if (query.includes('restaurante') || query.includes('restaurantes') || query.includes('comer') ||
        query.includes('cenar') || query.includes('almorzar') || query.includes('desayunar') ||
        query.includes('bar') || query.includes('café') || query.includes('cafeteria') ||
        query.includes('tapas') || query.includes('comida') || query.includes('gastronomia') ||
        query.includes('gastronomía') || query.includes('cocina') || query.includes('menu') ||
        query.includes('menú') || query.includes('carta')) {
      return t('loading.restaurants', { defaultValue: 'Buscando restaurantes...' });
    }
    
    // Patrones para itinerarios/rutas
    if (query.includes('itinerario') || query.includes('ruta') || query.includes('recorrido') ||
        query.includes('plan') || query.includes('planificar') || query.includes('organizar') ||
        query.includes('visita') || query.includes('tour') || query.includes('paseo') ||
        query.includes('día') || query.includes('dias') || query.includes('horario') ||
        query.includes('programa') || query.includes('agenda') || query.includes('planning') ||
        query.includes('route') || query.includes('itinerary')) {
      return t('loading.itinerary', { defaultValue: 'Preparando itinerario...' });
    }
    
    // Patrones para horarios
    if (query.includes('hora') || query.includes('horario') || query.includes('horarios') ||
        query.includes('abierto') || query.includes('cerrado') || query.includes('funcionamiento') ||
        query.includes('atencion') || query.includes('atención') || query.includes('servicio') ||
        query.includes('cuando') || query.includes('cuándo') || query.includes('disponible') ||
        query.includes('schedule') || query.includes('opening') || query.includes('hours') ||
        query.includes('tiempo') || query.includes('duracion') || query.includes('duración')) {
      return t('loading.schedule', { defaultValue: 'Buscando horarios...' });
    }
    
    // Patrones para transporte
    if (query.includes('transporte') || query.includes('bus') || query.includes('autobús') ||
        query.includes('metro') || query.includes('tren') || query.includes('taxi') ||
        query.includes('coche') || query.includes('parking') || query.includes('aparcamiento') ||
        query.includes('llegar') || query.includes('ir') || query.includes('moverse') ||
        query.includes('transport') || query.includes('public transport') || query.includes('getting around') ||
        query.includes('como llegar') || query.includes('cómo llegar') || query.includes('direcciones')) {
      return t('loading.transport', { defaultValue: 'Buscando opciones de transporte...' });
    }
    
    // Patrones para información general
    if (query.includes('informacion') || query.includes('información') || query.includes('que') ||
        query.includes('qué') || query.includes('como') || query.includes('cómo') ||
        query.includes('que hacer') || query.includes('qué hacer') || query.includes('recomendacion') ||
        query.includes('recomendación') || query.includes('sugerencia') || query.includes('consejo') ||
        query.includes('what to do') || query.includes('recommendation') || query.includes('suggestion') ||
        query.includes('tip') || query.includes('consejos') || query.includes('tips')) {
      return t('loading.information', { defaultValue: 'Buscando información...' });
    }
    
    // Patrones para trámites/procedimientos
    if (query.includes('tramite') || query.includes('trámite') || query.includes('tramites') ||
        query.includes('trámites') || query.includes('procedimiento') || query.includes('procedimientos') ||
        query.includes('documento') || query.includes('documentos') || query.includes('papeles') ||
        query.includes('solicitud') || query.includes('solicitudes') || query.includes('ayuntamiento') ||
        query.includes('administracion') || query.includes('administración') || query.includes('burocracia') ||
        query.includes('burocracia') || query.includes('permiso') || query.includes('permisos') ||
        query.includes('licencia') || query.includes('licencias')) {
      return t('loading.procedures', { defaultValue: 'Buscando procedimientos...' });
    }
    
    // Patrones para alojamiento
    if (query.includes('hotel') || query.includes('hoteles') || query.includes('alojamiento') ||
        query.includes('hospedaje') || query.includes('dormir') || query.includes('pernoctar') ||
        query.includes('reserva') || query.includes('reservar') || query.includes('habitacion') ||
        query.includes('habitación') || query.includes('accommodation') || query.includes('stay') ||
        query.includes('lodging') || query.includes('hostel') || query.includes('apartamento') ||
        query.includes('apartment') || query.includes('airbnb')) {
      return t('loading.accommodation', { defaultValue: 'Buscando alojamiento...' });
    }
    
    // Patrones para compras
    if (query.includes('comprar') || query.includes('tienda') || query.includes('tiendas') ||
        query.includes('comercio') || query.includes('comercios') || query.includes('centro comercial') ||
        query.includes('mercado') || query.includes('souvenir') || query.includes('regalo') ||
        query.includes('regalos') || query.includes('shopping') || query.includes('buy') ||
        query.includes('purchase') || query.includes('mall') || query.includes('store') ||
        query.includes('shop') || query.includes('gift') || query.includes('souvenirs')) {
      return t('loading.shopping', { defaultValue: 'Buscando opciones de compras...' });
    }
    
    // Patrones para emergencias/servicios
    if (query.includes('emergencia') || query.includes('emergencias') || query.includes('urgencia') ||
        query.includes('urgencias') || query.includes('hospital') || query.includes('farmacia') ||
        query.includes('policia') || query.includes('policía') || query.includes('bomberos') ||
        query.includes('ayuda') || query.includes('servicio') || query.includes('servicios') ||
        query.includes('emergency') || query.includes('urgent') || query.includes('help') ||
        query.includes('police') || query.includes('fire') || query.includes('ambulance') ||
        query.includes('pharmacy') || query.includes('hospital') || query.includes('clinic')) {
      return t('loading.emergency', { defaultValue: 'Buscando servicios de emergencia...' });
    }
    
    // Patrones para clima/tiempo
    if (query.includes('clima') || query.includes('tiempo') || query.includes('temperatura') ||
        query.includes('lluvia') || query.includes('sol') || query.includes('nublado') ||
        query.includes('weather') || query.includes('temperature') || query.includes('rain') ||
        query.includes('sunny') || query.includes('cloudy') || query.includes('forecast')) {
      return t('loading.weather', { defaultValue: 'Consultando el clima...' });
    }
    
    // Patrones para historia/cultura
    if (query.includes('historia') || query.includes('histórica') || query.includes('cultura') ||
        query.includes('tradicion') || query.includes('tradición') || query.includes('patrimonio') ||
        query.includes('history') || query.includes('cultural') || query.includes('heritage') ||
        query.includes('tradition') || query.includes('ancient') || query.includes('historical')) {
      return t('loading.history', { defaultValue: 'Buscando información histórica...' });
    }
    
    // Patrones para actividades al aire libre
    if (query.includes('playa') || query.includes('montaña') || query.includes('senderismo') ||
        query.includes('ciclismo') || query.includes('deporte') || query.includes('actividad fisica') ||
        query.includes('actividad física') || query.includes('outdoor') || query.includes('beach') ||
        query.includes('mountain') || query.includes('hiking') || query.includes('cycling') ||
        query.includes('sport') || query.includes('exercise') || query.includes('nature')) {
      return t('loading.outdoor', { defaultValue: 'Buscando actividades al aire libre...' });
    }
    
    // Patrón por defecto
    return t('loading.wait', { defaultValue: 'Cargando respuesta...' });
  };

  return { detectLoadingPattern };
};
