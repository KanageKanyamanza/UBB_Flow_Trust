import React, { useState } from 'react'
import { Plus, TrendingUp, LayoutDashboard, Wallet, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { AccountCard } from '../components/accounts/AccountCard'
import { CreateAccountModal } from '../components/accounts/CreateAccountModal'
import { useGetAccountsQuery } from '../../infrastructure/api/accountApi'
import { useAuth } from '../../application/context/AuthContext'
import { Seo } from '../components/seo/Seo'

const AccountsPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: accounts, isLoading, error } = useGetAccountsQuery()

  return (
    <div className="flex flex-col min-h-screen animate-fade-in bg-background">
      <Seo title={`${t('accounts.title')} — ${t('brand.name')}`} noindex />
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t('accounts.title')}</h1>
            <p className="text-muted-foreground">{t('accounts.subtitle')}</p>
          </div>
          {user?.role === 'OWNER' && (
            <Button
              variant="flow"
              onClick={() => setIsModalOpen(true)}
              className="gap-2 shadow-lg shadow-flow/20"
            >
              <Plus className="w-4 h-4" />
              {t('accounts.newAccount')}
            </Button>
          )}
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 glass rounded-2xl border border-red-500/20">
            <p className="text-red-400">{t('accounts.loadError')}</p>
            <Button variant="ghost" onClick={() => window.location.reload()} className="mt-4">{t('accounts.retry')}</Button>
          </div>
        ) : accounts?.length === 0 ? (
          <div className="bg-muted/30 border border-white/5 rounded-2xl p-16 text-center flex flex-col items-center justify-center space-y-4">
            <Wallet className="w-16 h-16 text-muted-foreground/20" />
            <div className="space-y-1">
              <h3 className="text-xl font-medium">{t('accounts.empty')}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {user?.role === 'OWNER' ? t('accounts.emptyOwnerDesc') : t('accounts.emptyAgentDesc')}
              </p>
            </div>
            {user?.role === 'OWNER' && (
              <Button variant="secondary" className="mt-4" onClick={() => setIsModalOpen(true)}>
                {t('accounts.addAccount')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts?.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}

        {/* Create Account Modal */}
        {user?.role === 'OWNER' && (
          <CreateAccountModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </main>
    </div>
  )
}

export default AccountsPage
