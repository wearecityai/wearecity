import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CirclePlay } from "lucide-react";
import { BackgroundPatternAdapted } from "./background-pattern-adapted";
import { useNavigate } from "react-router-dom";

interface Hero06AdaptedProps {
  badge?: string;
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

const Hero06Adapted = ({
  badge = "WeAreCity",
  title = "Transforma Tu Experiencia Ciudadana",
  description = "Conecta con tu ciudad de manera inteligente. Accede a servicios municipales, información local y asistencia personalizada con tecnología de vanguardia.",
  primaryButtonText = "Comenzar Ahora",
  secondaryButtonText = "Ver Demo",
  onPrimaryClick,
  onSecondaryClick,
}: Hero06AdaptedProps) => {
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
    <div className="min-h-screen flex items-center justify-center px-6">
      <BackgroundPatternAdapted />

      <div className="relative z-10 text-center max-w-3xl">
        <Badge
          variant="secondary"
          className="rounded-full py-1 border-border"
        >
          {badge} <ArrowUpRight className="ml-1 size-4" />
        </Badge>
        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl md:leading-[1.2] font-semibold tracking-tighter">
          {title}
        </h1>
        <p className="mt-6 md:text-lg text-muted-foreground">
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

export default Hero06Adapted;
