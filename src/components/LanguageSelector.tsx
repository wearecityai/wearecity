import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ca', name: 'Català', flag: '🏴' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

interface LanguageSelectorProps {
  variant?: 'button' | 'select';
  size?: 'sm' | 'default';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'button',
  size = 'default' 
}) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('i18nextLng', languageCode);
  };

  if (variant === 'select') {
    return (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Select value={i18n.language} onValueChange={handleLanguageChange}>
          <SelectTrigger className={size === 'sm' ? 'w-32 h-8' : 'w-40'}>
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{currentLanguage.flag}</span>
                <span className="text-sm">{currentLanguage.name}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {languages.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <div className="flex items-center gap-2">
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'sm' : 'default'}
          className="gap-2 rounded-full"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.flag}</span>
          <span className="hidden md:inline">{currentLanguage.name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">{t('language.title')}</h4>
          <div className="space-y-1">
            {languages.map((language) => (
              <Button
                key={language.code}
                variant={i18n.language === language.code ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start gap-2 rounded-full"
                onClick={() => handleLanguageChange(language.code)}
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};