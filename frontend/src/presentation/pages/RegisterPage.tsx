import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Building2, User, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useRegisterMutation } from '../../infrastructure/api/authApi'

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)
  
  const [registerMutation] = useRegisterMutation()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorStatus(null)
    
    if (formData.password !== formData.confirmPassword) {
      setErrorStatus('Les mots de passe ne correspondent pas.')
      return
    }

    setIsSubmitting(true)

    try {
      await registerMutation({
        email: formData.email,
        password: formData.password,
        firstName: formData.name,
        organizationName: formData.company
      }).unwrap()
      
      // Auto-redirect to login after successful registration
      navigate('/login', { state: { message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' } })
    } catch (err: any) {
      console.error('Registration error:', err)
      setErrorStatus(err.data?.error || 'Échec de l\'inscription. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] p-4 animate-fade-in py-12">
      <Card className="glass w-full max-w-lg border-white/10 glow-flow">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Créer un compte</CardTitle>
          <CardDescription className="text-center">
            Rejoignez UBB pour propulser la croissance de votre PME
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorStatus && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4" />
                {errorStatus}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="name">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name"
                    placeholder="Jean Dupont" 
                    className="pl-10"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="company">
                  Entreprise
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="company"
                    placeholder="Ma PME Sarl" 
                    className="pl-10"
                    value={formData.company}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">
                Email professionnel
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email"
                  type="email" 
                  placeholder="nom@entreprise.com" 
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                  Confirmer
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirmPassword"
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="flow" 
              className="w-full flex items-center justify-center gap-2 mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création du compte...
                </>
              ) : (
                'Démarrer mon essai gratuit'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Déjà inscrit ?{' '}
              <Link to="/login" className="text-flow hover:underline font-medium">
                Se connecter
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl px-4 text-xs opacity-60">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-flow" />
          <span>Accès gratuit 14 jours</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-flow" />
          <span>Aucune carte requise</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-flow" />
          <span>Annulation à tout moment</span>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
