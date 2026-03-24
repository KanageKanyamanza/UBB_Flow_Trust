import React from 'react'
import { TrendingUp, ShieldCheck, LogOut, LayoutDashboard, FileText, PieChart, Info } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { useAuth } from '../../application/context/AuthContext'

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      {/* Top Navbar */}
      <nav className="border-b border-white/10 glass px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-flow w-6 h-6" />
          <span className="text-xl font-bold italic tracking-tighter">UBB <span className="text-trust">Flow&Trust</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-muted-foreground">Bienvenue ! Voici un aperçu global de votre entreprise.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass glow-flow relative overflow-hidden">
            <div className="absolute right-[-10px] top-[-10px] opacity-10">
              <PieChart size={80} className="text-flow" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trésorerie Actuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2M CFA</div>
              <p className="text-xs text-flow flex items-center gap-1 mt-1">
                +12.5% depuis le mois dernier
              </p>
            </CardContent>
          </Card>

          <Card className="glass glow-trust relative overflow-hidden">
            <div className="absolute right-[-10px] top-[-10px] opacity-10">
              <FileText size={80} className="text-trust" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Documents de Conformité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85% Complet</div>
              <p className="text-xs text-trust flex items-center gap-1 mt-1">
                3 documents expirent bientôt
              </p>
            </CardContent>
          </Card>

          <Card className="glass relative overflow-hidden">
            <div className="absolute right-[-10px] top-[-10px] opacity-10">
              <Info size={80} className="text-gold" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Score de Crédibilité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">B+</div>
              <p className="text-xs text-muted-foreground mt-1">
                Prochain audit dans 5 jours
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted/30 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4">
          <LayoutDashboard className="w-12 h-12 text-muted-foreground/30" />
          <div className="space-y-1">
            <h3 className="text-xl font-medium">Les modules arrivent bientôt</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Nous finalisons les outils de prévision de flux et le coffre-fort documentaire. Restez à l'écoute !
            </p>
          </div>
          <Button variant="secondary" className="mt-4">
            Explorer les tutoriels
          </Button>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
