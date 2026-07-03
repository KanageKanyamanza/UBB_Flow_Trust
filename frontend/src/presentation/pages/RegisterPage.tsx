import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, User, Mail, Lock, Loader2, AlertCircle, CheckCircle2, Globe, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useRegisterMutation } from '../../infrastructure/api/authApi'
import { Seo } from '../components/seo/Seo'

const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    name: '',
    email: searchParams.get('email') ?? '',
    password: '',
    confirmPassword: '',
    company: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [registerMutation] = useRegisterMutation()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorStatus(null)

    if (formData.password !== formData.confirmPassword) {
      setErrorStatus(t('auth.register.passwordMismatch'))
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
      navigate('/login', { state: { message: t('auth.register.successMessage') } })
    } catch (err: any) {
      console.error('Registration error:', err)
      setErrorStatus(err.data?.error || t('auth.register.errors.default'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in py-12">
      <button
        onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
        className="fixed top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
        title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en Français'}
      >
        <Globe size={14} />
        {i18n.language === 'fr' ? 'EN' : 'FR'}
      </button>
      <Seo
        title={`${t('auth.register.title')} — ${t('brand.name')}`}
        description={t('auth.register.subtitle')}
        noindex
      />
      <div className="mb-8">
        <img src="/logo.png" alt="TrustLane" className="h-14 w-auto rounded-2xl" />
      </div>

      <Card className="glass w-full max-w-lg border-white/10 glow-flow">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t('auth.register.title')}</CardTitle>
          <CardDescription className="text-center">{t('auth.register.subtitle')}</CardDescription>
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
                  {t('auth.register.name')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder={t('auth.register.namePlaceholder')}
                    className="pl-10"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="company">
                  {t('auth.register.company')}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    placeholder={t('auth.register.companyPlaceholder')}
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
                {t('auth.register.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.register.emailPlaceholder')}
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
                  {t('auth.register.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3 text-muted-foreground hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                  {t('auth.register.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-3 text-muted-foreground hover:text-white transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                <><Loader2 className="h-4 w-4 animate-spin" />{t('auth.register.submitting')}</>
              ) : t('auth.register.submit')}
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4">
              {t('auth.register.alreadyMember')}{' '}
              <Link to="/login" className="text-flow hover:underline font-medium">
                {t('auth.register.login')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl px-4 text-xs opacity-60">
        {(['badge1', 'badge2', 'badge3'] as const).map((key) => (
          <div key={key} className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-flow" />
            <span>{t(`auth.register.${key}`)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RegisterPage
