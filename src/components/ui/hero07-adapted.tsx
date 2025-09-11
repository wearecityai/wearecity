import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight, CirclePlay } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Hero07AdaptedProps {
  badge?: string;
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

const Hero07Adapted = ({
  badge = "WeAreCity",
  title = "Transforma Tu Experiencia Ciudadana",
  description = "Conecta con tu ciudad de manera inteligente. Accede a servicios municipales, información local y asistencia personalizada con tecnología de vanguardia.",
  primaryButtonText = "Comenzar Ahora",
  secondaryButtonText = "Ver Demo",
  onPrimaryClick,
  onSecondaryClick,
}: Hero07AdaptedProps) => {
  const navigate = useNavigate();

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
    <div 
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(255, 182, 193, 0.3) 0%, rgba(221, 160, 221, 0.4) 50%, rgba(138, 43, 226, 0.3) 100%),
          url('/lovable-uploads/Generated Image September 10, 2025 - 11_19PM.png')
        `,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat'
      }}
    >
      {/* Overlay para mejorar la legibilidad del texto */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
      
      <div className="relative z-10 text-center max-w-3xl">
        <Badge
          variant="secondary"
          className="rounded-full py-1 border-border"
        >
          {badge} <ArrowUpRight className="ml-1 size-4" />
        </Badge>
        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl md:leading-[1.2] font-semibold tracking-tighter text-white drop-shadow-lg">
          {title}
        </h1>
        <p className="mt-6 md:text-lg text-white/90 drop-shadow-md">
          {description}
        </p>
        <div className="mt-12 flex items-center justify-center gap-4">
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
            <CirclePlay className="h-5 w-5 mr-1" /> {secondaryButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero07Adapted;
