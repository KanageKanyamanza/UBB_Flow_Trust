import React, { useState } from 'react'
import { Plus, TrendingUp, LayoutDashboard, Wallet, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { AccountCard } from '../components/accounts/AccountCard'
import { CreateAccountModal } from '../components/accounts/CreateAccountModal'
import { useGetAccountsQuery } from '../../infrastructure/api/accountApi'
import { useAuth } from '../../application/context/AuthContext'

const AccountsPage: React.FC = () => {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: accounts, isLoading, error } = useGetAccountsQuery()

  return (
    <div className="flex flex-col min-h-screen animate-fade-in bg-background">
      {/* Top Navbar */}
      <nav className="border-b border-white/10 glass px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-flow w-6 h-6" />
            <span className="text-xl font-bold italic tracking-tighter">UBB <span className="text-trust">Flow&Trust</span></span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Comptes</h1>
            <p className="text-muted-foreground">Consultez et gérez vos comptes bancaires et portefeuilles digitaux.</p>
          </div>
          <Button 
            variant="flow" 
            onClick={() => setIsModalOpen(true)}
            className="gap-2 shadow-lg shadow-flow/20"
          >
            <Plus className="w-4 h-4" />
            Nouveau Compte
          </Button>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 glass rounded-2xl border border-red-500/20">
            <p className="text-red-400">Une erreur est survenue lors du chargement des comptes.</p>
            <Button variant="ghost" onClick={() => window.location.reload()} className="mt-4">Réessayer</Button>
          </div>
        ) : accounts?.length === 0 ? (
          <div className="bg-muted/30 border border-white/5 rounded-2xl p-16 text-center flex flex-col items-center justify-center space-y-4">
            <Wallet className="w-16 h-16 text-muted-foreground/20" />
            <div className="space-y-1">
              <h3 className="text-xl font-medium">Aucun compte trouvé</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Commencez par ajouter votre premier compte bancaire ou compte Mobile Money pour suivre vos flux.
              </p>
            </div>
            <Button variant="secondary" className="mt-4" onClick={() => setIsModalOpen(true)}>
              Ajouter un compte
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts?.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}

        {/* Create Account Modal */}
        <CreateAccountModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </main>
    </div>
  )
}

export default AccountsPage
