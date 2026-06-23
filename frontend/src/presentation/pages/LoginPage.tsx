import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { TrendingUp, ShieldCheck, Mail, Lock, Loader2, AlertCircle, CheckCircle2, Key } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../../application/context/AuthContext'
import { Seo } from '../components/seo/Seo'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)
  
  // New Partner States
  const [loginType, setLoginType] = useState<'owner' | 'partner'>('owner')
  const [partnerTokenInput, setPartnerTokenInput] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorStatus(null)
    setIsSubmitting(true)

    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setErrorStatus(err.data?.error || 'Échec de la connexion. Vérifiez vos identifiants.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorStatus(null)
    
    const token = partnerTokenInput.trim()
    if (!token) {
      setErrorStatus("Le code de partage est requis")
      return
    }

    try {
      localStorage.setItem('partnerToken', token)
      navigate(`/partner/portal`)
    } catch (err) {
      setErrorStatus("Une erreur est survenue lors de l'enregistrement du code")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <Seo
        title="Connexion — Trust Lane"
        description="Connectez-vous à votre espace Trust Lane pour gérer votre trésorerie et votre score de confiance."
        noindex
      />
      <div className="mb-8 flex items-center gap-2">
        <TrendingUp className="text-flow w-8 h-8" />
        <span className="text-2xl font-bold">Trust <span className="text-trust">Lane</span></span>
      </div>

      <Card className="glass w-full max-w-md border-white/10 glow-trust">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Connexion</CardTitle>
          <CardDescription className="text-center">
            {loginType === 'owner' 
              ? 'Accédez à votre espace entreprise Trust Lane'
              : 'Consultez la Data Room d\'une entreprise partenaire'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Commutateur d'onglets */}
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => {
                setLoginType('owner')
                setErrorStatus(null)
              }}
              className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
                loginType === 'owner' ? 'text-trust' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Espace Client
              {loginType === 'owner' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-trust rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                setLoginType('partner')
                setErrorStatus(null)
              }}
              className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
                loginType === 'partner' ? 'text-trust' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Portail Partenaire
              {loginType === 'partner' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-trust rounded-full" />
              )}
            </button>
          </div>

          {errorStatus && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2 animate-fade-in mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorStatus}
            </div>
          )}

          {loginType === 'owner' ? (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              {successMessage && !errorStatus && (
                <div className="bg-flow/10 border border-flow/20 text-flow text-sm p-3 rounded-lg flex items-center gap-2 animate-fade-in mb-4">
                  <CheckCircle2 className="w-4 h-4" />
                  {successMessage}
                </div>
              )}
              
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none" htmlFor="password">
                    Mot de passe
                  </label>
                  <a href="#" className="text-xs text-trust hover:underline">Mot de passe oublié ?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="trust" 
                className="w-full flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-4">
                Pas encore de compte ?{' '}
                <Link to="/register" className="text-trust hover:underline font-medium">
                  S'enregistrer
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePartnerSubmit} className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="partnerToken">
                  Code de partage (Token JWT)
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea 
                    id="partnerToken"
                    placeholder="Collez le code de partage ou token reçu..." 
                    className="w-full h-24 pl-10 pr-3 py-2 text-xs font-mono bg-background/50 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-trust resize-none"
                    value={partnerTokenInput}
                    onChange={(e) => setPartnerTokenInput(e.target.value)}
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Le code de partage commence généralement par <code>ey...</code> et vous a été transmis par le propriétaire de l'entreprise.
                </p>
              </div>

              <Button 
                type="submit" 
                variant="trust" 
                className="w-full flex items-center justify-center gap-2 shadow-lg shadow-trust/20"
              >
                Accéder au Portail Partenaire
              </Button>

              <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                <p className="text-[11px] text-muted-foreground leading-normal">
                  L'accès partenaire est temporaire et s'autodétruit selon la durée définie par l'émetteur.
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-xs text-muted-foreground flex gap-4 opacity-70">
        <span className="flex items-center gap-1"><ShieldCheck className="w-3" /> Sécurité chiffrée SSL</span>
        <span className="flex items-center gap-1">Données hébergées en UE</span>
      </div>
    </div>
  )
}

export default LoginPage
