// Lista de ciudades españolas válidas para validación de PlaceCard
export const VALID_SPANISH_CITIES = [
  // Ciudades principales
  'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 'málaga', 'malaga',
  'murcia', 'palma', 'las palmas', 'bilbao', 'alicante', 'córdoba', 'cordoba',
  'valladolid', 'vigo', 'gijón', 'gijon', 'hospitalet', 'a coruña', 'la coruña',
  'vitoria', 'granada', 'elche', 'tarrasa', 'badalona', 'cartagena', 'jerez',
  'sabadell', 'alcalá', 'alcala', 'móstoles', 'mostoles', 'almería', 'almeria',
  'fuenlabrada', 'san sebastián', 'san sebastian', 'donostia', 'santander',
  'castellón', 'castellon', 'burgos', 'albacete', 'alcorcón', 'alcorcon',
  'huelva', 'logroño', 'logroño', 'salamanca', 'pamplona', 'bilbao',
  'tarragona', 'lérida', 'lerida', 'lugo', 'orense', 'pontevedra',
  
  // Ciudades de la Comunidad Valenciana
  'villajoyosa', 'la vila joiosa', 'benidorm', 'torrevieja', 'orihuela', 
  'denia', 'calpe', 'altea', 'teulada', 'moraira', 'javea', 'xabia',
  'gandia', 'oliva', 'cullera', 'sagunto', 'burriana', 'moncofa',
  'nules', 'oropesa', 'peñíscola', 'peniscola', 'vinaròs', 'vinaros',
  'castellón de la plana', 'castellon de la plana', 'el puig', 'puig',
  'sagunto', 'burriana', 'moncofa', 'nules', 'oropesa', 'peñíscola',
  
  // Otras ciudades importantes
  'tenerife', 'gran canaria', 'fuerteventura', 'lanzarote', 'la palma',
  'la gomera', 'el hierro', 'menorca', 'ibiza', 'formentera',
  'ceuta', 'melilla', 'canarias', 'baleares', 'andalucía', 'andalucia',
  'cataluña', 'catalunya', 'galicia', 'asturias', 'cantabria',
  'navarra', 'la rioja', 'aragón', 'aragon', 'extremadura',
  'castilla la mancha', 'castilla y león', 'castilla y leon',
  'comunidad valenciana', 'comunitat valenciana', 'región de murcia', 'region de murcia'
];

// Función para validar si un searchQuery contiene una ciudad válida
export const validateCityInSearchQuery = (searchQuery: string): boolean => {
  if (!searchQuery) return false;
  
  const searchQueryLower = searchQuery.toLowerCase();
  
  // Verificar que el searchQuery contenga al menos una ciudad española válida
  return VALID_SPANISH_CITIES.some(city => searchQueryLower.includes(city));
};

// Función para obtener la ciudad principal de un searchQuery
export const extractCityFromSearchQuery = (searchQuery: string): string | null => {
  if (!searchQuery) return null;
  
  const searchQueryLower = searchQuery.toLowerCase();
  
  // Buscar la primera ciudad válida que aparezca
  for (const city of VALID_SPANISH_CITIES) {
    if (searchQueryLower.includes(city)) {
      return city;
    }
  }
  
  return null;
};
