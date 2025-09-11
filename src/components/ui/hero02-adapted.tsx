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
  primaryButtonText = "Buscar mi ciudad",
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
        "top-4 left-4",
        "top-16 right-6", 
        "bottom-20 left-8",
        "bottom-8 right-12"
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
        "top-8 left-6",
        "top-20 right-4",
        "bottom-16 left-4", 
        "bottom-4 right-8"
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
        "top-6 left-8",
        "top-20 right-8",
        "bottom-20 left-6",
        "bottom-6 right-6"
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
        "top-4 right-4",
        "top-16 left-4",
        "bottom-20 right-6",
        "bottom-8 left-6"
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
    <div className="min-h-screen flex items-center justify-center bg-black relative">
      <BackgroundPattern />
      <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-12 px-6 py-12 relative z-10">
        <div className="flex flex-col justify-center pt-4">
          <h1 className="max-w-[17ch] text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] font-semibold leading-[1.2] tracking-tighter tiktok-sans-title">
            {title}
          </h1>
          <p className="mt-6 max-w-[60ch] sm:text-lg text-muted-foreground">
            {description}
          </p>
          <div className="mt-12 flex items-center gap-4">
            <Button 
              size="lg" 
              className="rounded-full text-base"
              onClick={handlePrimaryClick}
            >
              {primaryButtonText} <ArrowUpRight className="h-5 w-5 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full text-base shadow-none"
              onClick={handleSecondaryClick}
            >
              <User className="h-5 w-5 mr-1" /> {secondaryButtonText}
            </Button>
          </div>
        </div>
        <div className="w-full aspect-square rounded-xl overflow-hidden group cursor-pointer relative -mt-8">
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
              className={`absolute ${images[currentImageIndex].positions[index]} bg-background/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg max-w-[200px] transition-all duration-500 ease-out z-30 border border-border ${
                visibleMessages.includes(index) 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <p className="text-sm font-medium text-foreground">{message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero02Adapted;
