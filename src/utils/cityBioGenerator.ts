// Generador de biografías automáticas para ciudades
export const generateCityBio = (cityName: string): string => {
  const cityBios: { [key: string]: string } = {
    'La Vila Joiosa': 'Pueblo costero con encanto mediterráneo, famoso por su industria chocolatera centenaria y playas de aguas cristalinas. Su casco histórico conserva la esencia tradicional valenciana.',
    'Benidorm': 'Destino turístico de referencia con rascacielos icónicos y playas doradas interminables. Capital del turismo de sol y playa en la Costa Blanca, perfecta para familias y jóvenes.',
    'Alicante': 'Ciudad portuaria vibrante con un rico patrimonio histórico y cultural único. Su imponente castillo de Santa Bárbara domina la ciudad mientras el mar Mediterráneo baña sus costas.',
    'Elche': 'Cuna del Palmeral más grande de Europa, declarado Patrimonio de la Humanidad por la UNESCO. Ciudad de contrastes entre tradición milenaria y modernidad, famosa por su industria del calzado.',
    'Torrevieja': 'Ciudad costera con salinas centenarias y un microclima único en la región. Destino perfecto para el turismo de salud y bienestar, con playas de arena fina y aguas tranquilas.',
    'Orihuela': 'Ciudad histórica con un impresionante patrimonio monumental y cultural de gran valor. Cuna del poeta Miguel Hernández, combina tradición literaria con modernidad en un entorno privilegiado.',
    'Elda': 'Capital del calzado español con una rica tradición industrial y artesanal que perdura. Ciudad emprendedora que ha sabido adaptarse a los tiempos modernos manteniendo su esencia tradicional.',
    'Alcoy': 'Ciudad industrial con un casco histórico medieval de gran belleza y tradiciones centenarias. Conocida mundialmente por sus espectaculares fiestas de Moros y Cristianos, patrimonio cultural único.',
    'San Vicente del Raspeig': 'Ciudad universitaria moderna con un ambiente joven y dinámico que la caracteriza. Centro de innovación y conocimiento, perfecta para estudiantes y profesionales del futuro.',
    'Petrel': 'Pueblo con encanto rural y tradiciones arraigadas que se mantienen vivas. Perfecto equilibrio entre tranquilidad y proximidad a servicios, ideal para vivir en armonía con la naturaleza.',
    'Villena': 'Ciudad histórica con un impresionante castillo medieval que domina el paisaje. Cruce de caminos entre Valencia y Murcia, rica en patrimonio cultural y tradiciones centenarias.',
    'Denia': 'Puerta de entrada a las Islas Baleares con un puerto histórico de gran importancia. Ciudad mediterránea perfecta para el turismo familiar y de aventura en un entorno privilegiado.',
    'Calpe': 'Destino costero con el majestuoso Peñón de Ifach como emblema natural único. Perfecta combinación de playa, montaña y tradición pesquera en un entorno de excepcional belleza.',
    'Xàbia': 'Pueblo costero con calas vírgenes de aguas cristalinas y un casco histórico encantador. Destino perfecto para quienes buscan tranquilidad y belleza natural mediterránea auténtica.',
    'Pilar de la Horadada': 'Ciudad costera con playas extensas de arena dorada y un ambiente familiar acogedor. Perfecta para el turismo residencial y de larga estancia en un entorno privilegiado.',
    'Santa Pola': 'Puerto pesquero tradicional con playas naturales y un rico patrimonio marítimo centenario. Destino perfecto para conocer la auténtica cultura mediterránea y sus tradiciones pesqueras.',
    'Crevillente': 'Ciudad con tradición alfarera milenaria y un entorno natural privilegiado único. Perfecta para quienes buscan autenticidad y conexión con la artesanía local tradicional.',
    'Ibi': 'Cuna de la industria juguetera española con un casco histórico encantador y singular. Ciudad innovadora que ha sabido mantener su tradición artesanal adaptándose a los tiempos modernos.',
    'Altea': 'Pueblo blanco con calles empedradas y vistas al mar espectaculares que enamoran. Destino perfecto para artistas y amantes de la belleza mediterránea auténtica en un entorno único.',
    'Finestrat': 'Pueblo de montaña con vistas panorámicas excepcionales y tradiciones centenarias arraigadas. Perfecto para el turismo rural y de naturaleza en un entorno natural privilegiado.',
    'Callosa de Segura': 'Ciudad con tradición agrícola milenaria y un rico patrimonio histórico de gran valor. Perfecta para conocer la auténtica vida rural valenciana y sus tradiciones centenarias.',
    'Rojales': 'Pueblo con cuevas tradicionales únicas y un entorno natural de excepcional belleza. Destino perfecto para el turismo alternativo y de experiencias auténticas en un ambiente singular.',
    'Guardamar del Segura': 'Ciudad costera con dunas naturales espectaculares y un rico ecosistema protegido. Perfecta para el turismo de naturaleza y playas vírgenes en un entorno único.',
    'Pego': 'Pueblo de interior con tradición arrocera centenaria y un casco histórico encantador. Destino perfecto para el turismo rural y gastronómico en un ambiente tradicional auténtico.',
    'Teulada': 'Pueblo costero con calas vírgenes de aguas cristalinas y un ambiente tranquilo único. Perfecto para el turismo de relax y contacto con la naturaleza mediterránea auténtica.',
    'Benissa': 'Pueblo blanco con tradición vinícola centenaria y un casco histórico medieval de gran belleza. Destino perfecto para el turismo cultural y gastronómico en un ambiente auténtico.',
    'L\'Alfàs del Pi': 'Ciudad multicultural con una gran comunidad internacional que la caracteriza. Perfecta para el turismo residencial y de larga estancia en un ambiente cosmopolita único.',
    'Polop': 'Pueblo de montaña con un castillo medieval imponente y vistas espectaculares que cautivan. Destino perfecto para el turismo rural y de senderismo en un entorno natural privilegiado.',
    'La Nucía': 'Ciudad moderna con instalaciones deportivas de primer nivel y tecnología avanzada. Perfecta para el turismo deportivo y de bienestar en un entorno natural privilegiado.',
    'Orba': 'Pueblo rural con tradiciones centenarias arraigadas y un entorno natural privilegiado único. Destino perfecto para el turismo de naturaleza y tranquilidad en un ambiente auténtico.',
    'Tàrbena': 'Pueblo de montaña con tradición morisca única y un casco histórico de gran singularidad. Perfecto para el turismo cultural y de senderismo en un entorno natural auténtico.',
    'Bolulla': 'Pueblo pequeño con encanto rural excepcional y tradiciones arraigadas que perduran. Destino perfecto para el turismo de tranquilidad y contacto directo con la naturaleza.',
    'Callosa d\'En Sarrià': 'Pueblo con tradición agrícola milenaria y un entorno natural privilegiado de gran belleza. Perfecto para el turismo rural y gastronómico en un ambiente tradicional auténtico.',
    'Tormos': 'Pueblo tranquilo con tradiciones centenarias vivas y un ambiente rural auténtico único. Destino perfecto para el turismo de relax y naturaleza en un entorno de paz excepcional.',
    'Famorca': 'Pueblo de montaña con vistas panorámicas excepcionales y tradiciones únicas que perduran. Perfecto para el turismo rural y de senderismo en un entorno natural privilegiado.',
    'Castell de Castells': 'Pueblo con un castillo histórico imponente y un entorno natural espectacular de gran belleza. Destino perfecto para el turismo cultural y de aventura en un ambiente único.',
    'Benigembla': 'Pueblo de montaña con tradición morisca única y un casco histórico encantador de gran belleza. Perfecto para el turismo cultural y de naturaleza en un entorno auténtico.',
    'Murla': 'Pueblo pequeño con encanto rural excepcional y tradiciones centenarias que se mantienen vivas. Destino perfecto para el turismo de tranquilidad y autenticidad en un ambiente único.',
    'Parcent': 'Pueblo de montaña con vistas espectaculares que cautivan y un ambiente tranquilo excepcional. Perfecto para el turismo rural y de relax en un entorno natural privilegiado.',
    'Alcalalí': 'Pueblo con tradición vinícola centenaria y un casco histórico medieval de gran belleza. Destino perfecto para el turismo gastronómico y cultural en un ambiente tradicional auténtico.',
    'Xaló': 'Pueblo de montaña con tradición agrícola milenaria y un entorno natural único de gran belleza. Perfecto para el turismo rural y de naturaleza en un ambiente tradicional auténtico.',
    'Lliber': 'Pueblo pequeño con encanto rural excepcional y tradiciones arraigadas que se mantienen vivas. Destino perfecto para el turismo de tranquilidad y contacto directo con la naturaleza.',
    'Senija': 'Pueblo costero con calas vírgenes de aguas cristalinas y un ambiente tranquilo excepcional. Perfecto para el turismo de relax y playas naturales en un entorno mediterráneo único.',
    'Calp': 'Ciudad costera con el majestuoso Peñón de Ifach como emblema natural de excepcional belleza. Perfecta combinación de playa, montaña y tradición pesquera en un entorno único.'
  };
  
  // Si existe una biografía específica, la devolvemos
  if (cityBios[cityName]) {
    return cityBios[cityName];
  }
  
  // Si no existe, generamos una biografía genérica basada en el nombre
  const genericBio = `${cityName} es una ciudad con encanto mediterráneo excepcional, rica en tradiciones centenarias y cultura local auténtica. Destino perfecto para descubrir la autenticidad de la región.`;
  
  return genericBio;
};
