import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GalleryVerticalEnd } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useAutoLanguage } from '@/hooks/useAutoLanguage'

const AuthPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  useAutoLanguage() // Inicializar detección automática de idioma

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-start">
          <a href="#" className="flex items-center gap-2 font-medium" onClick={() => navigate('/')}> 
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            {t('chat.title')}
          </a>
          <LanguageSelector variant="button" size="sm" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              <TabsContent value="signup">
                <SignupForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/lovable-uploads/valencia.png"
          alt={t('chat.title')}
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}

export default AuthPage