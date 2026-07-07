import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './application/context/AuthContext'
import { AnimatePresence } from 'framer-motion'
import { TrendingUp, ShieldCheck, Zap, Mail, ArrowRight, Check, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'

// Lazy load pages for better performance
import LoginPage from './presentation/pages/LoginPage'
import RegisterPage from './presentation/pages/RegisterPage'
import DashboardPage from './presentation/pages/DashboardPage'
import AccountsPage from './presentation/pages/AccountsPage'
import TransactionsPage from './presentation/pages/TransactionsPage'
import BudgetPage from './presentation/pages/BudgetPage'
import NewTransactionPage from './presentation/pages/NewTransactionPage'
import RecurringRulesPage from './presentation/pages/RecurringRulesPage'
import ProfilePage from './presentation/pages/ProfilePage'
import CompliancePage from './presentation/pages/CompliancePage'
import DocumentsPage from './presentation/pages/DocumentsPage'
import PartnerPortalPage from './presentation/pages/PartnerPortalPage'
import TeamPage from './presentation/pages/TeamPage'
import VerifiedSmePage from './presentation/pages/VerifiedSmePage'
import { Seo } from './presentation/components/seo/Seo'
import { ProtectedRoute, PublicRoute } from './presentation/components/auth/AuthRoutes'
import { ErrorBoundary } from './presentation/components/ErrorBoundary'
import MainLayout from './presentation/components/layout/MainLayout'
import { PageTransition } from './presentation/components/layout/PageTransition'

function LandingPage() {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = React.useState('')

  return (
    <div className="flex flex-col items-center justify-center min-h-[95vh] px-4 py-16 text-center relative overflow-hidden bg-background">
      <button
        onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
        title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en Français'}
      >
        <Globe size={14} />
        {i18n.language === 'fr' ? 'EN' : 'FR'}
      </button>
      <Seo
        title={`${t('brand.name')} — ${t('brand.tagline')}`}
        description={t('brand.description')}
        canonical="https://trustlane.app/"
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: t('brand.name'),
          alternateName: 'Trust Lane — Flow & Trust',
          description: t('brand.description'),
          url: 'https://trustlane.app/',
        }}
      />
      <div className="animate-fade-in w-full max-w-5xl relative z-10 space-y-8">
        {/* Hero Title */}
        <div className="space-y-4">
          <div className="flex justify-center mb-2">
            <img src="/logo.png" alt="TrustLane" className="h-20 w-auto rounded-2xl" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
            Trust <span className="text-trust bg-clip-text text-transparent bg-gradient-to-r from-flow via-white to-trust">Lane</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            {t('brand.description')}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Flow Card */}
          <Card className="glass text-left border border-white/10 relative overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center gap-4">
              <div className="bg-flow/10 border border-flow/20 p-3.5 rounded-2xl shrink-0">
                <TrendingUp className="text-flow w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  {t('landing.flow.title')}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{t('landing.flow.subtitle')}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('landing.flow.description')}
              </p>
              <ul className="space-y-2.5 pt-2 border-t border-white/5">
                {(['feature1', 'feature2', 'feature3'] as const).map((key) => (
                  <li key={key} className="flex items-center gap-2.5 text-xs text-white/80">
                    <Check size={14} className="text-flow shrink-0" />
                    <span>{t(`landing.flow.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Trust Card */}
          <Card className="glass text-left border border-white/10 relative overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center gap-4">
              <div className="bg-trust/10 border border-trust/20 p-3.5 rounded-2xl shrink-0">
                <ShieldCheck className="text-trust w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  {t('landing.trust.title')}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{t('landing.trust.subtitle')}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('landing.trust.description')}
              </p>
              <ul className="space-y-2.5 pt-2 border-t border-white/5">
                {(['feature1', 'feature2', 'feature3'] as const).map((key) => (
                  <li key={key} className="flex items-center gap-2.5 text-xs text-white/80">
                    <Check size={14} className="text-trust shrink-0" />
                    <span>{t(`landing.trust.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Lead Capture form card */}
        <div className="max-w-md mx-auto relative">
          <div className="p-8 rounded-[2.25rem] relative bg-background/40 border border-white/10 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">{t('landing.cta.title')}</h3>
              <p className="text-xs text-muted-foreground">{t('landing.cta.subtitle')}</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('landing.cta.emailPlaceholder')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 h-12 rounded-xl focus:border-trust transition-all text-sm font-medium"
                />
              </div>

              <Button
                variant="trust"
                className="w-full h-12 rounded-xl text-sm font-bold gap-2 shadow-none hover:scale-[1.01] active:scale-[0.99] transition-all"
                asChild
              >
                <a href={`/register?email=${encodeURIComponent(email)}`}>
                  {t('landing.cta.startTrial')}
                  <ArrowRight size={16} />
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('landing.cta.alreadyMember')}{' '}
              <a href="/login" className="text-trust hover:underline font-bold">{t('landing.cta.login')}</a>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 text-center text-xs text-muted-foreground flex flex-wrap justify-center items-center gap-6 opacity-60">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-trust" /> {t('landing.badges.encrypted')}
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <Zap size={14} className="text-flow" /> {t('landing.badges.dsp2')}
          </span>
        </div>
      </div>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Partner Portal (Public access route with custom token verification) */}
        <Route path="/partner/portal" element={<PartnerPortalPage />} />

        {/* Public Verified SME profile page */}
        <Route path="/p/:slug" element={<VerifiedSmePage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
            <Route path="/accounts" element={<PageTransition><AccountsPage /></PageTransition>} />
            <Route path="/transactions" element={<PageTransition><TransactionsPage /></PageTransition>} />
            <Route path="/budget" element={<PageTransition><BudgetPage /></PageTransition>} />
            <Route path="/recurring-rules" element={<PageTransition><RecurringRulesPage /></PageTransition>} />
            <Route path="/transactions/new" element={<PageTransition><NewTransactionPage /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
            <Route path="/compliance" element={<PageTransition><CompliancePage /></PageTransition>} />
            <Route path="/documents" element={<PageTransition><DocumentsPage /></PageTransition>} />
            <Route path="/team" element={<PageTransition><TeamPage /></PageTransition>} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
