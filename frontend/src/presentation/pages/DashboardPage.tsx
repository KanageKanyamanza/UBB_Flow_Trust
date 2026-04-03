import React from 'react'
import { TrendingUp, ShieldCheck, LogOut, LayoutDashboard, FileText, PieChart, Info, Upload } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Link } from 'react-router-dom'
import { useAuth } from '../../application/context/AuthContext'
import { useGetAccountsQuery } from '../../infrastructure/api/accountApi'
import { AccountCard } from '../components/accounts/AccountCard'
import { Plus, ChevronRight } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()
  const { data: accounts, isLoading } = useGetAccountsQuery()

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0
  const recentAccounts = accounts?.slice(0, 3) || []

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
          <Link to="/transactions" className="block md:col-start-1 md:col-end-2">
            <Card className="glass glow-flow relative overflow-hidden h-full hover:scale-[1.02] transition-all duration-300 border-flow/20">
              <div className="absolute right-[-10px] top-[-10px] opacity-10">
                <PieChart size={80} className="text-flow" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trésorerie Totale</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
                ) : (
                  <div className="text-2xl font-bold">{new Intl.NumberFormat('fr-FR').format(totalBalance)} CFA</div>
                )}
                <p className="text-xs text-flow flex items-center gap-1 mt-1 font-medium">
                  {accounts?.length || 0} comptes actifs
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/transactions" className="block">
            <Card className="glass relative overflow-hidden h-full hover:scale-[1.02] transition-all duration-300 border-white/5">
              <div className="absolute right-[-10px] top-[-10px] opacity-10">
                <TrendingUp size={80} className="text-muted-foreground" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Flux de Trésorerie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Historique</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                  Voir toutes les transactions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="glass glow-trust relative overflow-hidden h-full">
            <div className="absolute right-[-10px] top-[-10px] opacity-10">
              <FileText size={80} className="text-trust" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Conformité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85% Complet</div>
              <p className="text-xs text-trust flex items-center gap-1 mt-1 font-medium">
                UBB Trust module actif
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight px-2">Comptes Récents</h2>
            <Link to="/accounts" className="text-sm text-trust hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
              ))}
            </div>
          ) : accounts?.length === 0 ? (
            <div className="bg-muted/30 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4">
              <Plus className="w-12 h-12 text-muted-foreground/30" />
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Aucun compte relié</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Commencez à suivre vos flux en ajoutant un compte bancaire ou mobile money.
                </p>
              </div>
              <Button variant="secondary" className="mt-2" asChild>
                <Link to="/accounts">Ajouter un compte</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAccounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </section>

        <div className="bg-muted/30 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-flow/20 border border-flow animate-pulse flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-flow" />
            </div>
            <div className="w-8 h-8 rounded-full bg-trust/20 border border-trust animate-pulse flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-trust" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-medium">Nouveaux modules en cours</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Nous activons progressivement les outils d'IA pour vos prévisions de trésorerie et la gestion documentaire.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/upload-demo" className="gap-2">
                  <Upload size={14} />
                  Tester Drag & Drop
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
