import { useLocation, useParams } from 'react-router-dom';
import { useMemo } from 'react';

export interface CurrentViewInfo {
  isMetrics: boolean;
  isFinetuning: boolean;
  isChat: boolean;
  isCitySearch: boolean;
  isAdmin: boolean;
  isPublicChat: boolean;
  currentPath: string;
  citySlug?: string;
}

export const useCurrentView = (currentView?: 'chat' | 'finetuning' | 'metrics'): CurrentViewInfo => {
  const location = useLocation();
  const params = useParams();

  return useMemo(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const isDiscoverPage = searchParams.get('focus') === 'search';
    
    // Extraer citySlug de la URL
    const getCitySlug = () => {
      if (path.startsWith('/chat/') || path.startsWith('/city/') || path.startsWith('/admin/')) {
        const pathParts = path.split('/');
        const slug = pathParts[2];
        return slug || params.chatSlug || params.citySlug;
      }
      return undefined;
    };

    const citySlug = getCitySlug();

    return {
      isMetrics: currentView === 'metrics' || path.includes('/metrics') || (path.includes('/admin') && path.includes('metrics')),
      isFinetuning: currentView === 'finetuning' || path.includes('/finetuning') || path.includes('/configure') || (path.includes('/admin') && path.includes('configure')),
      isChat: currentView === 'chat' || path.startsWith('/chat/') || path.startsWith('/city/') || (path.startsWith('/admin/') && citySlug),
      isCitySearch: isDiscoverPage || path === '/' || path === '/admin',
      isAdmin: path.startsWith('/admin/'),
      isPublicChat: path.startsWith('/chat/') || path.startsWith('/city/'),
      currentPath: path,
      citySlug
    };
  }, [location.pathname, location.search, params, currentView]);
};
