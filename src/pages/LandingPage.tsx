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
      <header className="flex h-16 shrink-0 items-center gap-2 bg-black sticky top-0 z-50 layout-transition w-full overflow-hidden pt-2">
        <div className="flex flex-1 items-center gap-2 px-8 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage 
                      className="line-clamp-1 truncate font-bold text-2xl text-white tiktok-sans-title cursor-pointer sm:hover:text-gray-300 transition-colors"
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
