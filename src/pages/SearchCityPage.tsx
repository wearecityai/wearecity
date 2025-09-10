import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CitySelector } from '@/components/CitySelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const SearchCityPage = () => {
  const navigate = useNavigate();

  const handleCitySelect = (city: any) => {
    navigate(`/chat/${city.slug}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Explorar Ciudades</h1>
              <p className="text-muted-foreground">Descubre y selecciona la ciudad que quieres explorar</p>
            </div>
          </div>
        </div>
      </div>

      {/* City Selector - Exactamente igual que la vista de explorar ciudades */}
      <div className="container mx-auto px-4 py-8">
        <CitySelector onCitySelect={handleCitySelect} />
      </div>
    </div>
  );
};

export default SearchCityPage;
