import React from 'react'
import { useNavigate } from 'react-router-dom'
import { TransactionForm } from '../components/transactions/TransactionForm'
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { Seo } from '../components/seo/Seo'

const NewTransactionPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/transactions')
  }

  const handleCancel = () => {
    navigate(-1)
  }

  return (
    <div className="flex flex-col min-h-screen animate-fade-in relative px-4 sm:px-10 py-10">
      <Seo title={`${t('pages.newTransaction')} — ${t('brand.name')}`} noindex />
      <div className="max-w-5xl mx-auto w-full space-y-10">
        <header className="relative pb-6 border-b border-white/5">
          <div className="flex justify-between items-start gap-4 mb-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-tight">
              {t('transactions.formTitle')} <span className="text-flow">{t('transactions.formTitleHighlight')}</span>
            </h1>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="h-10 px-4 rounded-xl border-white/10 hover:bg-white/5 gap-1 uppercase font-black text-[9px] tracking-widest flex-shrink-0"
            >
              <ChevronLeft size={14} />
              {t('common.back')}
            </Button>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl">
            {t('trust.scoreFlowDesc')}
          </p>
        </header>
        
        <div className="py-2">
          <TransactionForm 
            onSuccess={handleSuccess} 
            onCancel={handleCancel} 
          />
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed top-20 right-0 w-[40%] h-[40%] bg-flow/5 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-20 left-0 w-[40%] h-[40%] bg-trust/5 blur-[150px] rounded-full pointer-events-none -z-10" />
    </div>
  )
}

export default NewTransactionPage
