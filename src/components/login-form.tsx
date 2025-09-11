import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from 'react-i18next'
import { LoginForm as AuthLoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { t } = useTranslation()
  
  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-sm sm:max-w-md", className)} {...props}>
      <Card className="bg-transparent border-0 shadow-none">
        <CardHeader className="px-0 sm:px-6 hidden sm:block">
          <CardTitle className="text-xl sm:text-2xl text-foreground">Conecta con tu ciudad inteligente</CardTitle>
          <CardDescription className="text-muted-foreground text-sm sm:text-base">
            Accede a servicios municipales, información local y asistencia personalizada
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-background/80 border border-border h-auto p-1">
              <TabsTrigger value="login" className="rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1.5">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1.5">{t('auth.signup')}</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <AuthLoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
