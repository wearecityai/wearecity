import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, MapPin, Users } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/searchcity');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            WeAreCity
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Conecta con tu ciudad, resuelve tus trámites y obtén respuestas instantáneas
          </p>

          {/* Description */}
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Nuestra inteligencia artificial te ayuda con información municipal, trámites y servicios de tu ciudad. 
            Sin registro, sin complicaciones, solo respuestas rápidas y precisas.
          </p>

          {/* CTA Button */}
          <Button 
            onClick={handleStart}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Empezar
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          {/* Features */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Información Local
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Accede a información actualizada sobre tu ciudad, servicios municipales y eventos locales.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Chat Inteligente
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Pregunta lo que necesites y obtén respuestas precisas basadas en información oficial.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Sin Registro
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comienza a usar la aplicación inmediatamente, sin necesidad de crear una cuenta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
