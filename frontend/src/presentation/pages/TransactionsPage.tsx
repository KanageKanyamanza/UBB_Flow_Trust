import React from 'react'
import { TransactionList } from '../components/transactions/TransactionList'
import { Plus, Download } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { useListTransactionsQuery } from '@/infrastructure/api/transactionApi'
import { format } from 'date-fns'
import { Seo } from '../components/seo/Seo'

const TransactionsPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: transactions, isLoading } = useListTransactionsQuery()

  const exportToCSV = () => {
    if (!transactions) return

    const headers = ['Date', 'Direction', 'Montant', 'Devise', 'Méthode', 'Catégorie', 'Contrepartie', 'Notes']
    const rows = transactions.map(t => [
      format(new Date(t.occurredAt), 'yyyy-MM-dd HH:mm'),
      t.direction,
      t.amount,
      t.currency,
      t.method,
      t.category,
      t.counterparty || '',
      t.notes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container py-5 pb-24 animate-fade-in relative">
      <Seo title="Flux de Trésorerie — UBBFlow" noindex />
      <div className="flex flex-col gap-4 mb-10">
        <header className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Flux de <span className="text-flow">Trésorerie</span>
              <div className="h-2 w-2 rounded-full bg-flow animate-pulse" />
            </h1>
            <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
              Gérez vos rentrées et sorties d'argent en temps réel pour accroître votre score de préparation et de crédibilité.
            </p>
          </div>
          
          <div className="hidden md:flex gap-3">
             <Button 
               variant="outline" 
               size="sm" 
               className="gap-2 border-white/5 bg-white/5 hover:bg-white/10 uppercase font-black text-[10px] tracking-widest"
               onClick={exportToCSV}
               disabled={isLoading || !transactions || transactions.length === 0}
             >
                <Download size={14} />
                Exporter CSV
             </Button>
             <Link to="/transactions/new">
               <Button
                  variant="flow"
                  className="gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-flow/20 glow-flow px-6"
                >
                  <Plus size={16} />
                  Nouvelle Transaction
                </Button>
             </Link>
          </div>
        </header>
      </div>

      {/* Decorative Gradients */}
      <div className="fixed top-20 right-0 w-[30%] h-[30%] bg-flow/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-20 left-0 w-[30%] h-[30%] bg-trust/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="space-y-6">
        <TransactionList onAddClick={() => navigate('/transactions/new')} />
      </div>
    </div>
  )
}

export default TransactionsPage
