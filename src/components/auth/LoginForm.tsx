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
              navigate('/')
            }
          } else {
            navigate('/')
          }
        } catch (profileError) {
          navigate('/')
        }
      }
    } catch (err) {
      setError(t('auth.unexpectedLoginError'))
    } finally {
      setIsLoading(false)
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
          
          <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('auth.login')}
          </Button>
        </div>
      </form>
    </div>
  )
}