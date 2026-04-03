import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TrendingUp, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'

// Lazy load pages for better performance
import LoginPage from './presentation/pages/LoginPage'
import RegisterPage from './presentation/pages/RegisterPage'
import DashboardPage from './presentation/pages/DashboardPage'
import AccountsPage from './presentation/pages/AccountsPage'
import TransactionsPage from './presentation/pages/TransactionsPage'
import UploadDemoPage from './presentation/pages/UploadDemoPage'
import { ProtectedRoute, PublicRoute } from './presentation/components/auth/AuthRoutes'

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] p-4 text-center">
      <div className="animate-fade-in w-full max-w-4xl">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          UBB <span className="text-trust">Flow & Trust</span>
        </h1>
        <p className="text-muted-foreground text-xl max-w-2xl mb-12 mx-auto">
          Transformez votre PME informelle en une entité crédible et finançable grâce à nos modules
          de gestion de flux et de confiance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* UBB Flow Card */}
          <Card className="glass text-left hover:scale-[1.02] glow-flow transition-all duration-300">
            <CardHeader>
              <div className="bg-flow/20 p-3 rounded-lg w-fit mb-2">
                <TrendingUp className="text-flow w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">UBB Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Intelligence de trésorerie, prévisions à 90 jours et score de préparation
                financière.
              </p>
            </CardContent>
          </Card>

          {/* UBB Trust Card */}
          <Card className="glass text-left hover:scale-[1.02] glow-trust transition-all duration-300">
            <CardHeader>
              <div className="bg-trust/20 p-3 rounded-lg w-fit mb-2">
                <ShieldCheck className="text-trust w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">UBB Trust</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Coffre-fort documentaire, checklists de conformité et score de crédibilité.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <Input placeholder="Votre email professionnel" type="email" />
          <div className="grid grid-cols-2 gap-4">
            <Button variant="trust" className="w-full gap-2" asChild>
              <a href="/login">Connexion</a>
            </Button>
            <Button variant="flow" className="w-full gap-2" asChild>
              <a href="/register">Essai gratuit</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/upload-demo" element={<UploadDemoPage />} />
          {/* Add more protected routes here */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
