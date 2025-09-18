import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus, 
  Link, 
  ExternalLink,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface URLManagerProps {
  title: string;
  icon: React.ReactNode;
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  placeholder?: string;
  description?: string;
}

const URLManager: React.FC<URLManagerProps> = ({
  title,
  icon,
  urls,
  onUrlsChange,
  placeholder = "https://...",
  description
}) => {
  // Agregar nueva URL
  const addUrl = () => {
    onUrlsChange([...urls, '']);
  };

  // Eliminar URL
  const removeUrl = (index: number) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    onUrlsChange(newUrls);
  };

  // Actualizar URL
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    onUrlsChange(newUrls);
  };

  // Validar URL
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Obtener estadísticas
  const validUrls = urls.filter(url => isValidUrl(url)).length;
  const totalUrls = urls.filter(url => url.trim()).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
            {totalUrls > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalUrls}
              </Badge>
            )}
          </div>
          <Button
            onClick={addUrl}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {urls.map((url, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder={placeholder}
                  className={`pr-10 ${
                    url.trim() && !isValidUrl(url) 
                      ? 'border-red-500 focus:border-red-500' 
                      : url.trim() && isValidUrl(url)
                      ? 'border-green-500 focus:border-green-500'
                      : ''
                  }`}
                />
                {url.trim() && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {isValidUrl(url) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                {isValidUrl(url) && (
                  <Button
                    onClick={() => window.open(url, '_blank')}
                    size="sm"
                    variant="ghost"
                    title="Abrir en nueva pestaña"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  onClick={() => removeUrl(index)}
                  size="sm"
                  variant="outline"
                  title="Eliminar URL"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {urls.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay URLs configuradas</p>
              <p className="text-xs">Haz clic en + para agregar una URL</p>
            </div>
          )}
          
          {urls.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                {validUrls} de {totalUrls} URLs válidas
              </div>
              {validUrls !== totalUrls && totalUrls > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {totalUrls - validUrls} inválidas
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default URLManager;
