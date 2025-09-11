import React from 'react';
import { useNavigate } from 'react-router-dom';
import Hero02Adapted from '@/components/ui/hero02-adapted';
import { NavActions } from '@/components/nav-actions';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 layout-transition w-full overflow-hidden">
        <div className="flex flex-1 items-center gap-2 px-3 min-w-0">
          <div className="flex-1 min-w-0">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-foreground tiktok-sans-title">
                      WeAreCity
                    </span>
                    <Badge variant="outline" className="text-xs">Beta</Badge>
                  </div>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        <div className="ml-auto px-3 flex-shrink-0">
          <NavActions />
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1">
        <Hero02Adapted
          badge="WeAreCity"
          title="Transforma Tu Experiencia Ciudadana"
          description="Conecta con tu ciudad de manera inteligente. Accede a servicios municipales."
          primaryButtonText="Buscar ciudad"
          secondaryButtonText="Iniciar sesión"
          onPrimaryClick={() => navigate('/searchcity')}
          onSecondaryClick={() => navigate('/auth')}
        />
      </div>
    </div>
  );
};

export default LandingPage;
