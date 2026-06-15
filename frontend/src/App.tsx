import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { TrendingUp, ShieldCheck, Zap, Mail, ArrowRight, Check, Sparkles } from 'lucide-react'
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
import { ProtectedRoute, PublicRoute } from './presentation/components/auth/AuthRoutes'
import MainLayout from './presentation/components/layout/MainLayout'
import { PageTransition } from './presentation/components/layout/PageTransition'

function LandingPage() {
  const [email, setEmail] = React.useState('')

  return (
    <div className="flex flex-col items-center justify-center min-h-[95vh] px-4 py-16 text-center relative overflow-hidden bg-background">
      <div className="animate-fade-in w-full max-w-5xl relative z-10 space-y-8">
        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
            UBB <span className="text-trust bg-clip-text text-transparent bg-gradient-to-r from-flow via-white to-trust">Flow & Trust</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            Transformez votre PME informelle en une entité crédible et finançable. Centralisez votre trésorerie, anticipez vos flux et partagez des données certifiées avec vos partenaires financiers.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* UBB Flow Card */}
          <Card className="glass text-left border border-white/10 relative overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center gap-4">
              <div className="bg-flow/10 border border-flow/20 p-3.5 rounded-2xl shrink-0">
                <TrendingUp className="text-flow w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  UBB Flow
                </CardTitle>
                <p className="text-xs text-muted-foreground">Intelligence de trésorerie & prévisions de flux</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Gardez un contrôle total sur vos finances grâce à la synchronisation de vos comptes et l'analyse prédictive de vos liquidités.
              </p>
              <ul className="space-y-2.5 pt-2 border-t border-white/5">
                {[
                  "Prévision de trésorerie dynamique à 90 jours",
                  "Calcul automatique du cash burn mensuel",
                  "Alertes intelligentes de risques de découvert",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-xs text-white/80">
                    <Check size={14} className="text-flow shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* UBB Trust Card */}
          <Card className="glass text-left border border-white/10 relative overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center gap-4">
              <div className="bg-trust/10 border border-trust/20 p-3.5 rounded-2xl shrink-0">
                <ShieldCheck className="text-trust w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  UBB Trust
                </CardTitle>
                <p className="text-xs text-muted-foreground">Conformité, score & coffre-fort documentaire</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Rassurez vos investisseurs et banquiers en constituant un dossier de crédit certifié et en partageant des accès contrôlés.
              </p>
              <ul className="space-y-2.5 pt-2 border-t border-white/5">
                {[
                  "Coffre-fort documentaire sécurisé (Data Room)",
                  "Partages sécurisés temporaires pour tiers (BOLA)",
                  "Calcul automatique du score de confiance",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-xs text-white/80">
                    <Check size={14} className="text-trust shrink-0" />
                    <span>{item}</span>
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
              <h3 className="text-lg font-bold text-white">Prêt à propulser votre entreprise ?</h3>
              <p className="text-xs text-muted-foreground">Créez votre compte en quelques instants et connectez vos flux.</p>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Votre adresse email professionnelle" 
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
                  Démarrer l'essai gratuit
                  <ArrowRight size={16} />
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Déjà inscrit ? <a href="/login" className="text-trust hover:underline font-bold">Se connecter</a>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 text-center text-xs text-muted-foreground flex flex-wrap justify-center items-center gap-6 opacity-60">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-trust" /> Données cryptées de bout en bout
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <Zap size={14} className="text-flow" /> Conformité DSP2 & Open Banking
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
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App
