import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { BackgroundPattern } from "@/components/ui/background-pattern";

interface Hero02AdaptedProps {
  badge?: string;
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

const Hero02Adapted: React.FC<Hero02AdaptedProps> = ({
  badge = "WeAreCity",
  title = "Transforma Tu Experiencia Ciudadana",
  description = "Conecta con tu ciudad de manera inteligente. Accede a servicios municipales, información local y asistencia personalizada con tecnología de vanguardia.",
  primaryButtonText = "Buscar ciudad",
  secondaryButtonText = "Iniciar sesión",
  onPrimaryClick,
  onSecondaryClick,
}) => {
  const navigate = useNavigate();
  
  // Array de imágenes para la animación
  const images = [
    { 
      src: "/lovable-uploads/cityplace1.png", 
      alt: "Ciudad inteligente",
      messages: [
        "¿A qué hora sale el próximo bus?",
        "Eventos musicales esta semana",
        "Mejor restaurante italiano",
        "¿Dónde está la farmacia más cercana?"
      ],
      positions: [
        "top-2 left-2",
        "top-12 right-2", 
        "bottom-16 left-4",
        "bottom-4 right-6"
      ]
    },
    { 
      src: "/lovable-uploads/MUSEO.png", 
      alt: "Museo",
      messages: [
        "¿Cuáles son las exposiciones actuales?",
        "Horarios de apertura del museo",
        "Precios de entrada y descuentos",
        "¿Hay visitas guiadas disponibles?"
      ],
      positions: [
        "top-2 left-2",
        "top-12 right-2",
        "bottom-16 left-4", 
        "bottom-4 right-6"
      ]
    },
    { 
      src: "/lovable-uploads/Restaurante.png", 
      alt: "Restaurante",
      messages: [
        "¿Tienen mesa libre para esta noche?",
        "Carta de vinos recomendados",
        "¿Aceptan reservas online?",
        "Especialidades del chef"
      ],
      positions: [
        "top-2 left-2",
        "top-12 right-2",
        "bottom-16 left-4",
        "bottom-4 right-6"
      ]
    },
    { 
      src: "/lovable-uploads/Chiringuito.png", 
      alt: "Chiringuito",
      messages: [
        "¿Está abierto en invierno?",
        "Menú de pescado fresco",
        "¿Hay parking cerca?",
        "Horarios de verano"
      ],
      positions: [
        "top-2 right-2",
        "top-12 left-2",
        "bottom-16 right-4",
        "bottom-4 left-6"
      ]
    }
  ];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Resetear mensajes visibles
      setVisibleMessages([]);
      
      // Cambiar imagen inmediatamente
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      
      // Mostrar mensajes uno por uno desde abajo
      const messageDelays = [600, 1100, 1600, 2100]; // Delays ajustados
      
      messageDelays.forEach((delay, index) => {
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, index]);
        }, delay);
      });
    }, 6000); // Cambio cada 6 segundos
    
    // Mostrar mensajes iniciales
    const initialDelays = [500, 1000, 1500, 2000];
    initialDelays.forEach((delay, index) => {
      setTimeout(() => {
        setVisibleMessages(prev => [...prev, index]);
      }, delay);
    });
    
    return () => clearInterval(interval);
  }, []);

  const handlePrimaryClick = () => {
    if (onPrimaryClick) {
      onPrimaryClick();
    } else {
      navigate('/searchcity');
    }
  };

  const handleSecondaryClick = () => {
    if (onSecondaryClick) {
      onSecondaryClick();
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-black relative">
      <BackgroundPattern />
      <div className="max-w-7xl w-full mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12 px-4 sm:px-6 py-4 sm:py-8 lg:py-12 relative z-10">
        {/* Imagen - aparece primero en mobile */}
        <div className="w-full aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden group cursor-pointer relative -mt-4 sm:mt-0 lg:-mt-8 order-1 lg:order-2">
          <div className="relative w-full h-full overflow-hidden">
            {images.map((image, index) => {
              const isCurrent = index === currentImageIndex;
              const isPrevious = index === (currentImageIndex - 1 + images.length) % images.length;
              
              return (
                <img 
                  key={index}
                  src={image.src}
                  alt={image.alt}
                  className={`absolute inset-0 w-full h-full object-contain transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 hover:lg:scale-105 ${
                    isCurrent
                      ? 'opacity-100 translate-y-0 z-10'
                      : isPrevious
                      ? 'opacity-0 translate-y-0 z-0'
                      : 'opacity-0 translate-y-12 z-0'
                  }`}
                />
              );
            })}
          </div>
          
          {/* Burbujas de consultas dinámicas con posiciones adaptadas */}
          {images[currentImageIndex].messages.map((message, index) => (
            <div 
              key={index}
              className={`absolute ${images[currentImageIndex].positions[index]} bg-background/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1.5 sm:p-3 shadow-lg max-w-[120px] sm:max-w-[200px] transition-all duration-500 ease-out z-30 border border-border ${
                visibleMessages.includes(index) 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <p className="text-xs sm:text-sm font-medium text-foreground leading-tight">{message}</p>
            </div>
          ))}
        </div>
        
        {/* Contenido de texto - aparece segundo en mobile */}
        <div className="flex flex-col justify-center pt-1 sm:pt-4 order-2 lg:order-1">
          <h1 className="max-w-[17ch] text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] font-semibold leading-[1.1] sm:leading-[1.2] tracking-tighter tiktok-sans-title">
            <span className="block">Transformando tu</span>
            <span className="block">experiencia ciudadana</span>
          </h1>
          <p className="mt-4 sm:mt-6 max-w-[60ch] text-sm sm:text-base lg:text-lg text-muted-foreground">
            {description}
          </p>
          <div className="mt-6 sm:mt-12 flex flex-row items-center gap-3 sm:gap-4">
            <Button 
              size="lg" 
              className="rounded-full text-sm sm:text-base flex-1 sm:flex-none"
              onClick={handlePrimaryClick}
            >
              {primaryButtonText} <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full text-sm sm:text-base shadow-none flex-1 sm:flex-none"
              onClick={handleSecondaryClick}
            >
              <User className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> {secondaryButtonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero02Adapted;
