import { useNavigate } from 'react-router-dom'
import { useAutoLanguage } from '@/hooks/useAutoLanguage'
import { BackgroundPattern } from '@/components/ui/background-pattern'
import { NavActions } from '@/components/nav-actions'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { LoginForm } from '@/components/login-form'
import React, { useState, useEffect } from 'react'

const AuthPage = () => {
  const navigate = useNavigate()
  useAutoLanguage() // Inicializar detección automática de idioma

  // Array de imágenes para la animación (igual que en hero02-adapted)
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

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header - Mismo que landing page */}
      <header className="flex h-16 shrink-0 items-center gap-2 bg-black sticky top-0 z-50 layout-transition w-full overflow-hidden pt-2">
        <div className="flex flex-1 items-center gap-2 px-8 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage 
                      className="line-clamp-1 truncate font-bold text-2xl text-white tiktok-sans-title cursor-pointer hover:text-gray-300 transition-colors"
                      onClick={() => navigate('/')}
                    >
                      WeAreCity
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Badge variant="outline" className="text-xs text-white border-white/20 mb-1">
                Beta
              </Badge>
            </div>
          </div>
        </div>
        <div className="ml-auto px-8 flex-shrink-0">
          <NavActions />
        </div>
      </header>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        <BackgroundPattern />
        {/* Degradado para ocultar el patrón debajo del formulario */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-5"></div>
        <div className="max-w-7xl w-full mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 px-4 sm:px-6 py-8 sm:py-12 relative z-10">
          {/* Imagen - solo visible en desktop */}
          <div className="hidden lg:block w-full aspect-square rounded-xl overflow-hidden group cursor-pointer relative lg:-mt-8 order-1 lg:order-2">
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
        
        {/* Formulario - ocupa todo el ancho en mobile */}
        <div className="flex flex-col justify-center items-center pt-2 sm:pt-4 order-2 lg:order-1 w-full lg:w-auto">
          <LoginForm />
        </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage