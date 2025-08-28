import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { PasswordInput } from "./PasswordInput"
import { firebase } from "@/integrations/firebase/client"

export function SignupForm() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState<'ciudadano' | 'administrativo'>('ciudadano')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const redirectUrl = `${window.location.origin}/`
      
      const { data, error } = await firebase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role
          }
        }
      })

      if (error) {
        if (error.message.includes('email-already-in-use')) {
          setError('Este email ya está registrado. Intenta iniciar sesión.')
        } else {
          setError(`Error de registro: ${error.message}`)
        }
      } else {
        if (data.user && !data.session) {
          setSuccess('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.')
        } else {
          setSuccess('¡Registro exitoso! Ya puedes usar la aplicación.')
          setTimeout(() => navigate('/'), 1000)
        }
        // Clear form
        setEmail("")
        setPassword("")
        setFirstName("")
        setLastName("")
        setRole('ciudadano')
      }
    } catch (err) {
      setError('Error inesperado al registrarse.')
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

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">Nombre</Label>
              <Input
                id="first-name"
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Apellido</Label>
              <Input
                id="last-name"
                placeholder="Pérez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
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
            label="Contraseña"
            value={password}
            onChange={setPassword}
            required
            disabled={isLoading}
          />

          <div className="grid gap-2">
            <Label htmlFor="role">Tipo de usuario</Label>
            <Select value={role} onValueChange={(value: 'ciudadano' | 'administrativo') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ciudadano">Ciudadano</SelectItem>
                <SelectItem value="administrativo">Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear cuenta
          </Button>
        </div>
      </form>
    </div>
  )
}