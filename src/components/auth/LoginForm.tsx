import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { PasswordInput } from "./PasswordInput"
import { firebase } from "@/integrations/firebase/client"
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

export function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await firebase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('invalid-credential') || error.message.includes('wrong-password')) {
          setError(t('auth.invalidCredentials'))
        } else {
          setError(error.message)
        }
      } else if (data.user) {
        // Check user role to determine redirect
        try {
          const docRef = doc(db, 'profiles', data.user.id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const profile = docSnap.data();
            if (profile && profile.role === 'administrativo') {
              navigate('/admin')
            } else {
              navigate('/home')
            }
          } else {
            navigate('/home')
          }
        } catch (profileError) {
          navigate('/home')
        }
      }
    } catch (err) {
      setError(t('auth.unexpectedLoginError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      const { data, error } = await firebase.auth.signInWithOAuth({
        provider: 'google',
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        // Check user role to determine redirect
        try {
          const docRef = doc(db, 'profiles', data.user.id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const profile = docSnap.data();
            if (profile && profile.role === 'administrativo') {
              navigate('/admin')
            } else {
              navigate('/home')
            }
          } else {
            navigate('/home')
          }
        } catch (profileError) {
          navigate('/home')
        }
      }
    } catch (err) {
      setError(t('auth.unexpectedLoginError'))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <PasswordInput
            id="password"
            label={t('auth.password')}
            value={password}
            onChange={setPassword}
            required
            disabled={isLoading}
          />
          
          <div className="flex items-center justify-end">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implementar recuperación de contraseña
                alert('Funcionalidad de recuperación de contraseña próximamente');
              }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          
        </div>
      </form>
      
      <div className="mt-6 space-y-3">
        <Button type="submit" className="w-full rounded-full" disabled={isLoading || isGoogleLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('auth.login')}
        </Button>
        
        <Button 
        type="button" 
        variant="outline" 
        className="w-full rounded-full" 
        onClick={handleGoogleLogin}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Iniciar sesión con Google
        </Button>
      </div>
    </div>
  )
}