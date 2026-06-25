import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  X,
  Plus,
  RefreshCcw,
  ArrowUpDown,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Download,
  Paperclip,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useListTransactionsQuery } from '@/infrastructure/api/transactionApi'
import { Transaction, TxnDirection, TxnCategory } from '@/domain/entities/transaction.entity'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Modal } from '@/presentation/components/ui/modal'
import { TransactionDetail } from './TransactionDetail'
import { cn } from '@/shared/utils/utils'
import { useTranslation } from 'react-i18next'

interface TransactionListProps {
  onAddClick?: () => void
}

export const TransactionList: React.FC<TransactionListProps> = ({ onAddClick }) => {
  const { t, i18n } = useTranslation()

  const CATEGORY_LABELS: Record<string, string> = useMemo(() => ({
    SALES: t('transactions.categories.SALES'),
    COGS: t('transactions.categories.COGS'),
    PAYROLL: t('transactions.categories.PAYROLL'),
    RENT_UTILITIES: t('transactions.categories.RENT_UTILITIES'),
    TRANSPORT: t('transactions.categories.TRANSPORT'),
    TAX: t('transactions.categories.TAX'),
    DEBT_SERVICE: t('transactions.categories.DEBT_SERVICE'),
    CAPEX: t('transactions.categories.CAPEX'),
    OWNER_DRAW: t('transactions.categories.OWNER_DRAW'),
    FEES: t('transactions.categories.FEES'),
    MARKETING: t('transactions.categories.MARKETING'),
    OTHER: t('transactions.categories.OTHER'),
  }), [t])

  const [search, setSearch] = useState('')
  const [directionFilter, setDirectionFilter] = useState<TxnDirection | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<TxnCategory | 'ALL'>('ALL')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const {
    data: transactions,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useListTransactionsQuery()

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []

    let filtered = transactions.filter((txn) => {
      // 1. Search term
      const matchesSearch =
        txn.counterparty?.toLowerCase().includes(search.toLowerCase()) ||
        txn.notes?.toLowerCase().includes(search.toLowerCase()) ||
        txn.amount.toString().includes(search) ||
        txn.category.toLowerCase().includes(search.toLowerCase())

      // 2. Direction
      const matchesDirection = directionFilter === 'ALL' || txn.direction === directionFilter

      // 3. Category
      const matchesCategory = categoryFilter === 'ALL' || txn.category === categoryFilter

      // 4. Date Range
      let matchesDate = true
      if (dateRange.start) {
        matchesDate = matchesDate && new Date(txn.occurredAt) >= new Date(dateRange.start)
      }
      if (dateRange.end) {
        const end = new Date(dateRange.end)
        end.setHours(23, 59, 59, 999) // include the entire end date
        matchesDate = matchesDate && new Date(txn.occurredAt) <= end
      }

      return matchesSearch && matchesDirection && matchesCategory && matchesDate
    })

    // Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.occurredAt).getTime()
        const dateB = new Date(b.occurredAt).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      } else {
        const amountA = Number(a.amount)
        const amountB = Number(b.amount)
        return sortOrder === 'desc' ? amountB - amountA : amountA - amountB
      }
    })
  }, [transactions, search, directionFilter, categoryFilter, dateRange, sortBy, sortOrder])

  // Summary stats for filtered results
  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, txn) => {
        const amt = Number(txn.amount)
        if (txn.direction === TxnDirection.IN) acc.in += amt
        else acc.out += amt
        acc.net = acc.in - acc.out
        return acc
      },
      { in: 0, out: 0, net: 0 }
    )
  }, [filteredTransactions])

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', {
      style: 'currency',
      currency: currency || 'XAF',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const toggleSortOrder = () => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Search and Quick Filters */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl -mx-4 px-4 pt-2 pb-4 border-b border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
              search ? "text-primary" : "text-muted-foreground"
            )} />
            <Input
              placeholder={t('transactions.searchPlaceholder')}
              className="pl-10 bg-muted/30 border-none rounded-2xl h-12 focus:ring-primary/20 ring-1 ring-white/5 group-hover:ring-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? "trust" : "glass"}
            size="icon"
            className="h-12 w-12 rounded-2xl"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-5 h-5" />
          </Button>
          {onAddClick && (
            <Button
              variant="flow"
              size="icon"
              className="h-12 w-12 rounded-2xl flex"
              onClick={onAddClick}
            >
              <Plus className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* Filter Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-5"
            >
              {/* Reset Button */}
              <div className="flex justify-between items-center">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('transactions.list.advancedFilters')}</h3>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => {
                     setDirectionFilter('ALL');
                     setCategoryFilter('ALL');
                     setDateRange({ start: '', end: '' });
                   }}
                   className="text-xs font-bold text-destructive hover:bg-destructive/10"
                 >
                   {t('transactions.list.reset')}
                 </Button>
              </div>

              {/* Type Grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ALL', label: t('transactions.list.all'), color: 'bg-muted/30' },
                  { id: TxnDirection.IN, label: t('transactions.list.inflows'), color: 'bg-flow/10 text-flow', active: 'bg-flow text-white' },
                  { id: TxnDirection.OUT, label: t('transactions.list.outflows'), color: 'bg-destructive/10 text-destructive', active: 'bg-destructive text-white' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setDirectionFilter(type.id as any)}
                    className={cn(
                      "py-3 rounded-xl text-xs font-extrabold transition-all border border-transparent shadow-sm",
                      directionFilter === type.id ? (type.active || 'bg-primary text-secondary') : type.color
                    )}
                  >
                    {type.label.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                   <Calendar size={14} /> {t('transactions.list.period').toUpperCase()}
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <Input 
                      type="date" 
                      value={dateRange.start} 
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="bg-muted/30 border-none rounded-xl text-xs"
                    />
                    <Input 
                      type="date" 
                      value={dateRange.end} 
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="bg-muted/30 border-none rounded-xl text-xs"
                    />
                 </div>
              </div>

              {/* Categories Pills */}
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                   <LayoutGrid size={13} /> {t('transactions.list.categories')}
                 </div>
                 <div className="flex flex-wrap gap-2 pt-1">
                   {Object.values(TxnCategory).map(cat => (
                     <button
                       key={cat}
                       onClick={() => setCategoryFilter(cat === categoryFilter ? 'ALL' : cat)}
                       className={cn(
                         "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                         categoryFilter === cat 
                           ? "bg-primary border-primary text-secondary shadow-lg shadow-primary/20" 
                           : "bg-muted/20 border-white/5 text-muted-foreground hover:bg-muted/40"
                       )}
                     >
                       {CATEGORY_LABELS[cat] || cat.replace('_', ' ')}
                     </button>
                   ))}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar: Count & Sort */}
        <div className="flex items-center justify-between px-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-2">
             <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">{filteredTransactions.length}</span>
             {t('transactions.list.results')}
          </div>
          <div className="flex items-center gap-1">
             <Button 
               variant="ghost" 
               size="sm" 
               className="h-7 text-[10px] font-extrabold uppercase px-2 hover:bg-white/5"
               onClick={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}
             >
               {sortBy === 'date' ? t('transactions.list.byDate') : t('transactions.list.byAmount')}
             </Button>
             <Button 
               variant="ghost" 
               size="sm" 
               className="h-7 w-7 p-0 hover:bg-white/5"
               onClick={toggleSortOrder}
             >
               <ArrowUpDown className={cn("h-3 w-3 transition-transform", sortOrder === 'asc' ? 'rotate-180' : '')} />
             </Button>
          </div>
        </div>
      </div>

      {/* Summary Mini Cards */}
      <div className="grid grid-cols-2 gap-4">
         <Card className="glass border-flow/20 overflow-hidden group">
            <div className="h-1 w-full bg-flow/30" />
            <CardContent className="p-3">
               <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('transactions.list.inflows')}</span>
                  <ArrowDownLeft className="text-flow w-3 h-3 group-hover:scale-125 transition-transform" />
               </div>
               <div className="text-sm font-black text-flow">{formatAmount(summary.in, 'XAF')}</div>
            </CardContent>
         </Card>
         <Card className="glass border-destructive/20 overflow-hidden group">
            <div className="h-1 w-full bg-destructive/30" />
            <CardContent className="p-3">
               <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('transactions.list.outflows')}</span>
                  <ArrowUpRight className="text-destructive w-3 h-3 group-hover:scale-125 transition-transform" />
               </div>
               <div className="text-sm font-black text-destructive">{formatAmount(summary.out, 'XAF')}</div>
            </CardContent>
         </Card>
      </div>

      {/* Transaction List */}
      <div className="relative pb-10">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-2xl border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center text-center space-y-4">
             <div className="p-4 bg-destructive/10 rounded-full text-destructive">
                <X size={32} />
             </div>
             <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">{t('transactions.list.errorTitle')}</p>
             <Button variant="outline" onClick={() => refetch()}>{t('transactions.list.retry')}</Button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95">
             <div className="p-5 bg-muted/10 rounded-full text-muted-foreground/30">
                <Search size={40} />
             </div>
             <div className="space-y-1">
               <p className="font-bold text-white text-lg">{t('transactions.list.emptyTitle')}</p>
               <p className="text-muted-foreground text-sm max-w-[240px]">
                 {t('transactions.list.emptyDesc')}
               </p>
             </div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode='popLayout'>
              {filteredTransactions.map((txn, index) => (
                <motion.div
                  key={txn.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                >
                  <Card 
                    onClick={() => {
                      setSelectedTransaction(txn);
                      setIsDetailModalOpen(true);
                    }}
                    className="glass border-white/5 hover:border-white/10 hover:shadow-xl hover:translate-y-[-2px] transition-all cursor-pointer group overflow-hidden active:scale-[0.98]"
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      {/* Visual Direction Indicator */}
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12",
                        txn.direction === TxnDirection.IN 
                          ? "bg-flow/10 text-flow shadow-lg shadow-flow/5" 
                          : "bg-destructive/10 text-destructive shadow-lg shadow-destructive/5"
                      )}>
                        {txn.direction === TxnDirection.IN ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-black text-sm uppercase tracking-tight truncate">
                              {txn.counterparty || CATEGORY_LABELS[txn.category] || txn.category.replace('_', ' ')}
                            </h4>
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest",
                              txn.direction === TxnDirection.IN 
                                ? "bg-flow/5 border-flow/20 text-flow" 
                                : "bg-destructive/5 border-destructive/20 text-destructive"
                            )}>
                              {CATEGORY_LABELS[txn.category] || txn.category.replace('_', ' ')}
                            </span>
                            {txn.evidenceFiles && txn.evidenceFiles.length > 0 && (
                              <Paperclip size={12} className="text-primary animate-pulse" />
                            )}
                         </div>
                         <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={12} className="opacity-50" />
                              {formatDate(txn.occurredAt)}
                            </span>
                            {txn.account?.name && (
                              <span className="flex items-center gap-1.5 opacity-80">
                                <span className="h-1 w-1 rounded-full bg-white/20" />
                                {txn.account.name}
                              </span>
                            )}
                         </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                         <div className={cn(
                           "text-base font-black tracking-tighter",
                           txn.direction === TxnDirection.IN ? "text-flow" : "text-white"
                         )}>
                           {txn.direction === TxnDirection.IN ? '+' : '-'} {formatAmount(txn.amount, txn.currency)}
                         </div>
                         {txn.notes && (
                           <p className="text-[10px] italic text-muted-foreground truncate max-w-[100px]">
                             {txn.notes}
                           </p>
                         )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={t('transactions.list.detailTitle')}
        >
          <TransactionDetail 
            transaction={selectedTransaction} 
            onClose={() => setIsDetailModalOpen(false)} 
          />
        </Modal>
      )}
    </div>
  )
}
