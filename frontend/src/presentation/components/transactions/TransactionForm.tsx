import React, { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Minus, 
  Calendar, 
  Tag, 
  CreditCard, 
  User, 
  FileText, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag, 
  Briefcase, 
  Truck, 
  Receipt, 
  Banknote, 
  Wallet,
  MoreHorizontal
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { ImageUpload } from '@/presentation/components/ui/ImageUpload'
import {
  TxnDirection,
  TxnCategory,
  TxnMethod,
  type CreateTransactionRequest,
} from '@/domain/entities/transaction.entity'
import { useGetAccountsQuery } from '@/infrastructure/api/accountApi'
import { useCreateTransactionMutation } from '@/infrastructure/api/transactionApi'
import { useUploadImageMutation } from '@/infrastructure/api/uploadApi'
import { cn } from '@/shared/utils/utils'

const CATEGORY_ICONS: Record<TxnCategory, React.ReactNode> = {
  [TxnCategory.SALES]: <ShoppingBag className="w-5 h-5" />,
  [TxnCategory.COGS]: <Truck className="w-5 h-5" />,
  [TxnCategory.PAYROLL]: <User className="w-5 h-5" />,
  [TxnCategory.RENT_UTILITIES]: <Briefcase className="w-5 h-5" />,
  [TxnCategory.TRANSPORT]: <Truck className="w-5 h-5" />,
  [TxnCategory.TAX]: <Receipt className="w-5 h-5" />,
  [TxnCategory.DEBT_SERVICE]: <CreditCard className="w-5 h-5" />,
  [TxnCategory.CAPEX]: <Plus className="w-5 h-5" />,
  [TxnCategory.OWNER_DRAW]: <Banknote className="w-5 h-5" />,
  [TxnCategory.FEES]: <Receipt className="w-5 h-5" />,
  [TxnCategory.MARKETING]: <Tag className="w-5 h-5" />,
  [TxnCategory.OTHER]: <MoreHorizontal className="w-5 h-5" />,
}

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000]

interface TransactionFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, onCancel }) => {
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccountsQuery()
  const [createTransaction, { isLoading: isCreating }] = useCreateTransactionMutation()
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation()
  const amountRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<Partial<CreateTransactionRequest>>({
    amount: undefined,
    direction: TxnDirection.OUT,
    category: TxnCategory.OTHER,
    method: TxnMethod.CASH,
    occurredAt: new Date().toISOString().split('T')[0],
    accountId: '',
  })

  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [showOptions, setShowOptions] = useState(false)

  // Set default account & auto-focus
  useEffect(() => {
    if (accounts && accounts.length > 0 && !formData.accountId) {
      setFormData((prev) => ({ ...prev, accountId: accounts[0].id }))
    }
  }, [accounts, formData.accountId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || !formData.accountId) return

    try {
      // 1. Create the transaction
      const transaction = await createTransaction({
        amount: Number(formData.amount),
        direction: formData.direction as TxnDirection,
        category: formData.category as TxnCategory,
        method: formData.method as TxnMethod,
        accountId: formData.accountId,
        occurredAt: new Date(formData.occurredAt!).toISOString(),
        notes: formData.notes,
        counterparty: formData.counterparty,
      }).unwrap()
      
      // 2. If there's a receipt, upload it and link to txnId
      if (receiptFile && transaction.id) {
        await uploadImage({
          file: receiptFile,
          txnId: transaction.id
        }).unwrap()
      }
      
      onSuccess?.()
    } catch (err) {
      console.error('Failed to process transaction:', err)
    }
  }

  const handleQuickAmount = (val: number) => {
    setFormData(prev => ({ ...prev, amount: (prev.amount || 0) + val }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-2">
      {/* Type Toggle - High Contrast */}
      <div className="flex p-1.5 bg-muted/30 rounded-2xl border border-white/5 shadow-inner">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, direction: TxnDirection.IN })}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-black tracking-widest text-xs",
            formData.direction === TxnDirection.IN
              ? "bg-flow text-white shadow-xl scale-[1.02] glow-flow"
              : "text-muted-foreground hover:bg-white/5 opacity-60"
          )}
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          ENTRÉE
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, direction: TxnDirection.OUT })}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-black tracking-widest text-xs",
            formData.direction === TxnDirection.OUT
              ? "bg-destructive text-white shadow-xl scale-[1.02] glow-destructive"
              : "text-muted-foreground hover:bg-white/5 opacity-60"
          )}
        >
          <Minus className="w-5 h-5 flex-shrink-0" />
          SORTIE
        </button>
      </div>

      {/* Amount Display - XL & Numpad optimized */}
      <div className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <span className={cn(
              "text-3xl font-black transition-colors duration-300",
              formData.direction === TxnDirection.IN ? "text-flow" : "text-destructive"
            )}>XAF</span>
          </div>
          <input
            ref={amountRef}
            type="number"
            inputMode="decimal"
            placeholder="0"
            required
            autoFocus
            className="w-full text-5xl h-24 pl-24 pr-6 font-black bg-muted/10 border-none rounded-3xl text-right focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/20 text-white"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          />
        </div>

        {/* Quick Amount Pills */}
        <div className="flex flex-wrap gap-2 justify-end px-2">
          {QUICK_AMOUNTS.map(val => (
            <button
              key={val}
              type="button"
              onClick={() => handleQuickAmount(val)}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-muted-foreground hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-all uppercase"
            >
              +{val >= 1000 ? `${val/1000}k` : val}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, amount: 0 })}
            className="px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-[10px] font-black text-destructive"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Account Selection - Horizontal Scrollable cards */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Source / Destination</label>
        <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-none">
          {isLoadingAccounts ? (
            <div className="flex gap-3">
              {[1, 2].map(i => <div key={i} className="h-16 w-32 animate-pulse bg-muted/20 rounded-2xl" />)}
            </div>
          ) : (
            accounts?.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => setFormData({ ...formData, accountId: account.id })}
                className={cn(
                  "flex-shrink-0 min-w-[120px] p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden",
                  formData.accountId === account.id
                    ? "bg-primary/20 border-primary text-primary glow-primary"
                    : "bg-muted/10 border-white/5 text-muted-foreground hover:bg-muted/20"
                )}
              >
                <div className="text-[10px] font-bold uppercase opacity-60 mb-1">{account.type}</div>
                <div className="text-xs font-black truncate">{account.name}</div>
                {formData.accountId === account.id && (
                  <div className="absolute top-1 right-1">
                    <Check size={12} className="text-primary" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Category Grid - 3 Columns for larger touch areas */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Catégorie d'opération</label>
        <div className="grid grid-cols-3 gap-3 px-1">
          {Object.entries(TxnCategory).map(([key, value]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFormData({ ...formData, category: value })}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-300 border aspect-[5/4]",
                formData.category === value
                  ? "bg-primary border-primary text-secondary shadow-lg shadow-primary/20 scale-[1.05] z-10"
                  : "bg-muted/10 border-white/5 text-muted-foreground hover:bg-muted/20 hover:border-white/10"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl",
                formData.category === value ? "bg-white/20" : "bg-white/5"
              )}>
                {CATEGORY_ICONS[value]}
              </div>
              <span className="text-[9px] uppercase font-black tracking-tighter text-center leading-tight">
                {key.replace('_', ' ')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div className="pt-2">
         <button 
           type="button"
           onClick={() => setShowOptions(!showOptions)}
           className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground py-2 hover:text-white transition-colors"
         >
           {showOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
           {showOptions ? 'Moins d\'options' : 'Plus d\'options (Date, Méthode, Notes)'}
         </button>
         
         <AnimatePresence>
           {showOptions && (
             <motion.div
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden space-y-4 pt-4"
             >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Date</label>
                    <Input
                      type="date"
                      className="h-12 text-sm bg-muted/10 border-white/5 rounded-xl font-bold"
                      value={formData.occurredAt}
                      onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Méthode</label>
                    <select
                      className="w-full h-12 px-4 bg-muted/10 border border-white/5 rounded-xl text-sm text-foreground font-bold focus:ring-2 focus:ring-primary/50 appearance-none"
                      value={formData.method}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value as TxnMethod })}
                    >
                      {Object.entries(TxnMethod).map(([key, value]) => (
                        <option key={value} value={value} className="bg-card">{key.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  placeholder="Notes ou détails supplémentaires..."
                  className="bg-muted/10 border-white/5 h-12 rounded-xl text-sm italic"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
                <Input
                   placeholder="Tiers / Bénéficiaire"
                   className="bg-muted/10 border-white/5 h-12 rounded-xl text-sm font-bold"
                   value={formData.counterparty || ''}
                   onChange={(e) => setFormData({ ...formData, counterparty: e.target.value })}
                 />

                {/* Receipt Upload */}
                <div className="pt-2">
                  <ImageUpload 
                    onFileSelect={setReceiptFile}
                    value={receiptFile}
                    label="Justificatif (Reçu/Facture)"
                    description="Glissez votre reçu ici"
                    className="bg-white/5"
                  />
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* Main CTA - One Tap Finalization */}
      <div className="flex gap-4 pt-6 sticky bottom-0 bg-background/80 backdrop-blur-md pb-4 pt-4 -mx-2 px-2">
        <Button 
          type="submit" 
          variant="flow" 
          disabled={isCreating || isUploading || !formData.amount}
          className="w-full h-16 rounded-2xl font-black text-xl shadow-2xl transition-all active:scale-[0.96] flex items-center justify-center gap-3 overflow-hidden group shadow-flow/30 hover:glow-flow"
        >
          {isCreating || isUploading ? (
            <div className="flex items-center gap-3">
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
               >
                 <Plus size={24} />
               </motion.div>
               {isUploading ? 'ENVOI DU REÇU...' : 'TRAITEMENT...'}
            </div>
          ) : (
            <>
              <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <Check className="w-6 h-6" strokeWidth={3} />
              </div>
              VALIDER LA TRANSACTION
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
