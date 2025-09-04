import React from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Star, 
  Calendar, 
  Users,
  ExternalLink
} from 'lucide-react';

interface InfoCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted' | 'outlined';
}

export const InfoCard: React.FC<InfoCardProps> = ({ 
  title, 
  icon, 
  children, 
  className = "",
  variant = 'default'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'highlighted':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700';
      case 'outlined':
        return 'border-2 border-gray-200 dark:border-gray-700 bg-transparent';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm';
    }
  };

  return (
    <div className={`rounded-lg border p-6 ${getVariantStyles()} ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </div>
  );
};

// Componente específico para lugares
export const PlaceCard: React.FC<{
  name: string;
  address?: string;
  hours?: string;
  phone?: string;
  website?: string;
  rating?: number;
  distance?: string;
}> = ({ name, address, hours, phone, website, rating, distance }) => {
  return (
    <InfoCard
      title={name}
      icon={<MapPin className="w-6 h-6 text-blue-500" />}
      variant="highlighted"
    >
      <div className="space-y-3">
        {address && (
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{address}</span>
          </div>
        )}
        
        {hours && (
          <div className="flex items-start space-x-2">
            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{hours}</span>
          </div>
        )}
        
        {phone && (
          <div className="flex items-start space-x-2">
            <Phone className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{phone}</span>
          </div>
        )}
        
        {website && (
          <div className="flex items-start space-x-2">
            <Globe className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <a 
              href={website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>Visitar web</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        
        <div className="flex items-center space-x-4 pt-2">
          {rating && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{rating}</span>
            </div>
          )}
          
          {distance && (
            <span className="text-sm text-gray-500">{distance}</span>
          )}
        </div>
      </div>
    </InfoCard>
  );
};

// Componente específico para eventos
export const EventCard: React.FC<{
  title: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  sourceUrl?: string;
}> = ({ title, date, time, location, description, sourceUrl }) => {
  return (
    <InfoCard
      title={title}
      icon={<Calendar className="w-6 h-6 text-green-500" />}
      variant="outlined"
    >
      <div className="space-y-3">
        {(date || time) && (
          <div className="flex items-start space-x-2">
            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">
              {date && time ? `${date} a las ${time}` : date || time}
            </span>
          </div>
        )}
        
        {location && (
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{location}</span>
          </div>
        )}
        
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        
        {sourceUrl && (
          <div className="pt-2">
            <a 
              href={sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>Más información</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </InfoCard>
  );
};

export default InfoCard;
