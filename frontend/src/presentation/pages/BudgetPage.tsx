import React, { useState } from 'react'
import {
  PieChart,
  Download,
  Edit3,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import {
  useGetBudgetComparisonQuery,
  useSetBudgetMutation
} from '../../infrastructure/api/budgetApi'
import { useListTransactionsQuery } from '../../infrastructure/api/transactionApi'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/shared/utils/utils'
import { motion } from 'framer-motion'
import { useAuth } from '../../application/context/AuthContext'
import { useGetAccountsQuery } from '../../infrastructure/api/accountApi'
import { Seo } from '../components/seo/Seo'

const BudgetPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { data: accounts } = useGetAccountsQuery()
  
  // Gérants/Agents are restricted to their assigned accountId
  const defaultAccountId = user?.role === 'OWNER' ? '' : (user?.accountId || '')
  const [selectedAccountId, setSelectedAccountId] = useState<string>(defaultAccountId)

  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<string>('')
  
  const { data: comparison, isLoading } = useGetBudgetComparisonQuery({
    accountId: selectedAccountId || undefined
  })
  const { data: transactions } = useListTransactionsQuery()
  const [setBudget] = useSetBudgetMutation()

  const handleEdit = (category: string, currentAmount: number) => {
    setIsEditing(category)
    setEditAmount(currentAmount.toString())
  }

  const handleSave = async (category: string) => {
    await setBudget({ 
      category, 
      amount: parseFloat(editAmount) || 0,
      accountId: selectedAccountId || null
    })
    setIsEditing(null)
  }

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
    link.setAttribute('download', `transactions_brutes_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col min-h-screen animate-fade-in pb-20">
      <Seo title={`${t('pages.budget')} — ${t('brand.name')}`} noindex />
      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{t('budget.title')}</h1>
            <p className="text-muted-foreground">{t('budget.subtitle')}</p>
          </div>
          <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5" onClick={exportToCSV} disabled={!transactions}>
            <Download size={16} />
            {t('budget.exportCSV')}
          </Button>
        </header>

        {user?.role === 'OWNER' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl animate-fade-in">
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">{t('budget.shopLabel')}</p>
              <p className="text-xs text-muted-foreground">{t('budget.shopDesc')}</p>
            </div>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="flex h-10 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-trust cursor-pointer hover:bg-white/10 transition-colors w-full sm:w-72"
            >
              <option value="" className="bg-neutral-900 text-white">{t('budget.allShops')}</option>
              {accounts?.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-neutral-900 text-white">
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <div className="space-y-4">
               {[1,2,3,4].map(i => (
                 <Card key={i} className="glass h-24 animate-pulse border-white/5" />
               ))}
            </div>
          ) : (
            <Card className="glass border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2 font-bold uppercase tracking-tight">
                      <PieChart className="w-5 h-5 text-flow" />
                      {t('budget.performance')}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-white font-medium capitalize">{format(new Date(), 'MMMM yyyy', { locale: i18n.language === 'fr' ? fr : undefined })}</span>
                      {selectedAccountId === "" && user?.role === 'OWNER' && (
                        <span className="ml-2 text-trust font-bold text-xs uppercase tracking-wider">{t('budget.aggregated')}</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-trust/10 border border-trust/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-trust animate-pulse" />
                    <span className="text-[10px] font-black text-trust uppercase tracking-widest">{t('budget.realtime')}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {comparison?.map((item) => {
                    const percentage = item.budget > 0 ? (item.actual / item.budget) * 100 : 0
                    const isOver = item.actual > item.budget && item.budget > 0

                    const categoryName = t(`budget.categories.${item.category}`, { defaultValue: item.category })

                    return (
                      <div key={item.category} className="p-6 hover:bg-white/[0.01] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black uppercase tracking-widest text-white/90">{categoryName}</span>
                              {isOver && (
                                <div className="flex items-center gap-1 text-[10px] font-black text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                  <AlertCircle size={10} />
                                  {t('budget.vigilance')}
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                              {item.actual === 0 ? t('budget.noTransactions') : `${new Intl.NumberFormat('fr-FR').format(item.actual)} CFA`}
                            </p>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">{t('budget.budgetTarget')}</p>
                              <div className="flex items-center justify-end gap-2 font-mono text-sm">
                                {isEditing === item.category ? (
                                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-flow/50">
                                    <input
                                      type="number"
                                      value={editAmount}
                                      onChange={(e) => setEditAmount(e.target.value)}
                                      className="w-28 bg-transparent border-none text-white text-right font-bold focus:outline-none focus:ring-0 px-2 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => handleSave(item.category)} 
                                      className="p-1 hover:bg-success/20 text-success rounded-md transition-colors"
                                      title="Enregistrer"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button 
                                      onClick={() => setIsEditing(null)} 
                                      className="p-1 hover:bg-destructive/20 text-destructive rounded-md transition-colors"
                                      title="Annuler"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : selectedAccountId === "" ? (
                                   <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 text-muted-foreground/60 cursor-not-allowed">
                                     <span className="font-bold text-white/80">
                                       {item.budget === 0 ? t('budget.notSet') : `${new Intl.NumberFormat('fr-FR').format(item.budget)} CFA`}
                                     </span>
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-3 group bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 hover:border-trust/30 transition-all cursor-pointer" onClick={() => handleEdit(item.category, item.budget)}>
                                     <span className={cn(
                                       "font-bold transition-colors",
                                       item.budget === 0 ? "text-muted-foreground/40 italic" : "text-white"
                                     )}>
                                       {item.budget === 0 ? t('budget.notSet') : `${new Intl.NumberFormat('fr-FR').format(item.budget)} CFA`}
                                     </span>
                                     <Edit3 size={14} className="text-muted-foreground group-hover:text-trust opacity-0 group-hover:opacity-100 transition-all" />
                                   </div>
                                 )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                           <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative group">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(percentage, 100)}%` }}
                              className={cn(
                                "h-full transition-all duration-700 ease-out relative z-10",
                                percentage > 100 ? "bg-destructive" : "bg-green-500"
                              )}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                            </motion.div>
                            
                            {/* Overlay for "None" or "Over" */}
                            {percentage > 100 && (
                              <div className="absolute inset-0 bg-destructive/10 animate-pulse z-0" />
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1">
                             <div className="flex items-center gap-2">
                               <span className={cn(
                                 percentage > 100 ? "text-destructive" : 
                                 percentage > 75 ? "text-warning" : 
                                 item.budget === 0 ? "text-muted-foreground" : "text-flow"
                               )}>
                                {Math.round(percentage)}% Consommé
                               </span>
                             </div>
                             <div className="text-muted-foreground">
                               {item.budget > 0 ? (
                                 item.budget - item.actual > 0 ? (
                                   <span className="text-success">{new Intl.NumberFormat('fr-FR').format(item.budget - item.actual)} CFA</span>
                                 ) : (
                                   <span className="text-destructive">{new Intl.NumberFormat('fr-FR').format(item.actual - item.budget)} CFA</span>
                                 )
                               ) : t('budget.setBudget')}
                             </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default BudgetPage
