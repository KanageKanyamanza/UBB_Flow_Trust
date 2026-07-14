import React, { useState, useEffect, useRef, useMemo } from 'react'
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
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { ImageUpload } from '@/presentation/components/ui/ImageUpload'
import { Modal } from '@/presentation/components/ui/modal'
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
import { useTranslation } from 'react-i18next'
import { useToast } from '@/application/context/ToastContext'

const CATEGORY_ICONS: Record<TxnCategory, React.ReactNode> = {
  [TxnCategory.SALES]: <ShoppingBag />,
  [TxnCategory.COGS]: <Truck />,
  [TxnCategory.PAYROLL]: <User />,
  [TxnCategory.RENT_UTILITIES]: <Briefcase />,
  [TxnCategory.TRANSPORT]: <Truck />,
  [TxnCategory.TAX]: <Receipt />,
  [TxnCategory.DEBT_SERVICE]: <CreditCard />,
  [TxnCategory.CAPEX]: <Plus />,
  [TxnCategory.OWNER_DRAW]: <Banknote />,
  [TxnCategory.FEES]: <Receipt />,
  [TxnCategory.MARKETING]: <Tag />,
  [TxnCategory.OTHER]: <MoreHorizontal />,
}

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000]

interface TransactionFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation()

  const CATEGORY_LABELS: Record<TxnCategory, string> = useMemo(() => ({
    [TxnCategory.SALES]: t('transactions.categories.SALES'),
    [TxnCategory.COGS]: t('transactions.categories.COGS'),
    [TxnCategory.PAYROLL]: t('transactions.categories.PAYROLL'),
    [TxnCategory.RENT_UTILITIES]: t('transactions.categories.RENT_UTILITIES'),
    [TxnCategory.TRANSPORT]: t('transactions.categories.TRANSPORT'),
    [TxnCategory.TAX]: t('transactions.categories.TAX'),
    [TxnCategory.DEBT_SERVICE]: t('transactions.categories.DEBT_SERVICE'),
    [TxnCategory.CAPEX]: t('transactions.categories.CAPEX'),
    [TxnCategory.OWNER_DRAW]: t('transactions.categories.OWNER_DRAW'),
    [TxnCategory.FEES]: t('transactions.categories.FEES'),
    [TxnCategory.MARKETING]: t('transactions.categories.MARKETING'),
    [TxnCategory.OTHER]: t('transactions.categories.OTHER'),
  }), [t])

  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccountsQuery()
  const [createTransaction, { isLoading: isCreating }] = useCreateTransactionMutation()
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation()
  const amountRef = useRef<HTMLInputElement>(null)

  const { error: toastError } = useToast()
  const [showValidationErrors, setShowValidationErrors] = useState(false)

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
  const [isOverdraftModalOpen, setIsOverdraftModalOpen] = useState(false)
  const [overdraftAccount, setOverdraftAccount] = useState<any>(null)

  // Set default account & auto-focus
  useEffect(() => {
    if (accounts && accounts.length > 0 && !formData.accountId) {
      setFormData((prev) => ({ ...prev, accountId: accounts[0].id }))
    }
  }, [accounts, formData.accountId])

  const performSubmit = async () => {
    try {
      // 1. Create the transaction
      const transaction = await createTransaction({
        amount: Number(formData.amount),
        direction: formData.direction as TxnDirection,
        category: formData.category as TxnCategory,
        method: formData.method as TxnMethod,
        accountId: formData.accountId!,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.category === TxnCategory.OTHER && !formData.notes?.trim()) {
      setShowOptions(true)
      setShowValidationErrors(true)
      toastError(
        t('transactions.form.notesRequiredTitle'),
        t('transactions.form.notesRequiredDesc')
      )
      return
    }

    if (!formData.amount || !formData.accountId) return

    if (formData.direction === TxnDirection.OUT) {
      const selectedAccount = accounts?.find(a => a.id === formData.accountId)
      if (selectedAccount && Number(selectedAccount.balance) < Number(formData.amount)) {
        setOverdraftAccount(selectedAccount)
        setIsOverdraftModalOpen(true)
        return
      }
    }

    await performSubmit()
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
          {t('transactions.form.inflow')}
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
          {t('transactions.form.outflow')}
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
            {t('transactions.form.reset')}
          </button>
        </div>
      </div>

      {/* Account Selection - Horizontal Scrollable cards */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">{t('transactions.form.sourceDestination')}</label>
        <div className="flex flex-wrap gap-3 px-1">
          {isLoadingAccounts ? (
            <div className="flex gap-3 w-full">
              {[1, 2].map(i => <div key={i} className="h-16 flex-1 animate-pulse bg-muted/20 rounded-2xl" />)}
            </div>
          ) : (
            <>
              {accounts?.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, accountId: account.id })}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden min-w-[140px] flex-1 sm:max-w-[200px]",
                    formData.accountId === account.id
                      ? "bg-primary/20 border-primary text-primary glow-primary"
                      : "bg-muted/10 border-white/5 text-muted-foreground hover:bg-muted/20"
                  )}
                >
                  <div className="text-[10px] font-bold uppercase opacity-60 mb-1">{account.type}</div>
                  <div className="text-xs font-black truncate">{account.name}</div>
                  {formData.accountId === account.id && (
                    <div className="absolute top-2 right-2">
                      <Check size={12} className="text-primary" />
                    </div>
                  )}
                </button>
              ))}
              <Link to="/accounts" className="flex-1 sm:flex-none">
                <button
                  type="button"
                  className="w-full h-full min-w-[140px] p-4 rounded-2xl border border-dashed border-white/10 text-muted-foreground hover:bg-white/5 hover:border-white/20 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <Plus size={20} />
                  <span className="text-[10px] font-black uppercase">{t('transactions.form.newAccount')}</span>
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Category Grid - 3 Columns for larger touch areas */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">{t('transactions.form.categoryLabel')}</label>
        <div className="flex flex-wrap gap-2 px-1">
          {Object.entries(TxnCategory).map(([key, value]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setFormData({ ...formData, category: value })
                setShowValidationErrors(false)
                if (value === TxnCategory.OTHER) {
                  setShowOptions(true)
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-300 border min-w-[95px] flex-1 sm:max-w-[120px]",
                formData.category === value
                  ? "bg-primary border-primary text-secondary shadow-lg shadow-primary/20 scale-[1.05] z-10"
                  : "bg-muted/10 border-white/5 text-muted-foreground hover:bg-muted/20 hover:border-white/10"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg",
                formData.category === value ? "bg-white/20" : "bg-white/5"
              )}>
                {React.isValidElement(CATEGORY_ICONS[value]) 
                  ? React.cloneElement(CATEGORY_ICONS[value] as React.ReactElement, { size: 18 })
                  : CATEGORY_ICONS[value]
                }
              </div>
              <span className="text-[10px] uppercase font-black tracking-tighter text-center leading-tight">
                {CATEGORY_LABELS[value as TxnCategory]}
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
           {showOptions ? t('transactions.form.lessOptions') : t('transactions.form.moreOptions')}
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
                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t('transactions.form.date')}</label>
                    <Input
                      type="date"
                      className="h-12 text-sm bg-muted/10 border-white/5 rounded-xl font-bold"
                      value={formData.occurredAt}
                      onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t('transactions.form.method')}</label>
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
                <div className="space-y-1.5 w-full">
                  <Input
                    placeholder={
                      formData.category === TxnCategory.OTHER
                        ? t('transactions.form.notesRequiredPlaceholder')
                        : t('transactions.form.notesPlaceholder')
                    }
                    className={cn(
                      "bg-muted/10 border-white/5 h-12 rounded-xl text-sm italic",
                      showValidationErrors && formData.category === TxnCategory.OTHER && !formData.notes?.trim() && "border-destructive focus-visible:ring-destructive"
                    )}
                    value={formData.notes || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, notes: e.target.value })
                      if (showValidationErrors && e.target.value.trim()) {
                        setShowValidationErrors(false)
                      }
                    }}
                  />
                  {showValidationErrors && formData.category === TxnCategory.OTHER && !formData.notes?.trim() && (
                    <p className="text-[11px] text-destructive font-bold ml-1">
                      {t('transactions.form.notesRequiredDesc')}
                    </p>
                  )}
                </div>
                <Input
                   placeholder={t('transactions.form.counterpartyPlaceholder')}
                   className="bg-muted/10 border-white/5 h-12 rounded-xl text-sm font-bold"
                   value={formData.counterparty || ''}
                   onChange={(e) => setFormData({ ...formData, counterparty: e.target.value })}
                 />

                {/* Receipt Upload */}
                <div className="pt-2">
                  <ImageUpload 
                    onFileSelect={setReceiptFile}
                    value={receiptFile}
                    label={t('transactions.form.receiptLabel')}
                    description={t('transactions.form.receiptDesc')}
                    className="bg-white/5"
                  />
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* Main CTA - One Tap Finalization */}
      <div className="flex gap-4 pt-6 sticky bottom-0 bg-background/95 backdrop-blur-md pb-4 pt-4 -mx-10 px-10 z-20">
        <Button 
          type="submit" 
          variant="flow" 
          disabled={isCreating || isUploading || !formData.amount}
          className="w-full h-14 sm:h-16 rounded-2xl font-black text-sm sm:text-lg shadow-2xl transition-all active:scale-[0.96] flex items-center justify-center gap-2 overflow-hidden group shadow-flow/30 hover:glow-flow"
        >
          {isCreating || isUploading ? (
            <div className="flex items-center gap-2">
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
               >
                 <Plus size={20} />
               </motion.div>
               <span>{isUploading ? t('transactions.form.uploading') : t('transactions.form.processing')}</span>
            </div>
          ) : (
            <>
              <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform hidden sm:block">
                <Check className="w-5 h-5" strokeWidth={3} />
              </div>
              <span className="whitespace-nowrap">{t('transactions.form.submit')}</span>
            </>
          )}
        </Button>
      </div>

      <Modal 
        isOpen={isOverdraftModalOpen} 
        onClose={() => setIsOverdraftModalOpen(false)} 
        title={t('transactions.form.overdraftTitle')}
      >
        <div className="space-y-4">
          <p className="text-white/80">
            {t('transactions.form.overdraftDesc', { balance: overdraftAccount ? Number(overdraftAccount.balance).toLocaleString() : '' })}
          </p>
          <p className="text-white/80">
            {t('transactions.form.overdraftConfirm')}
          </p>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOverdraftModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={async () => {
              setIsOverdraftModalOpen(false)
              await performSubmit()
            }}>
              {t('transactions.form.continue')}
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  )
}
