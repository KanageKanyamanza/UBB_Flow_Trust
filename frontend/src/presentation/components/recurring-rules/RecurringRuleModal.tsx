import React, { useState } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useCreateRecurringRuleMutation } from '../../../infrastructure/api/recurringRuleApi'
import { useTranslation } from 'react-i18next'

interface RecurringRuleModalProps {
  isOpen: boolean
  onClose: () => void
}

export const RecurringRuleModal: React.FC<RecurringRuleModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<'IN' | 'OUT'>('OUT')
  const [frequency, setFrequency] = useState('MONTHLY')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')

  const [error, setError] = useState('')
  const [createRule, { isLoading }] = useCreateRecurringRuleMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError(t('recurring.errors.nameRequired'))
    if (!amount || isNaN(Number(amount))) return setError(t('recurring.errors.amountRequired'))
    if (!startDate) return setError(t('recurring.errors.startDateRequired'))

    try {
      await createRule({
        name,
        amount: Number(amount),
        direction,
        frequency,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined
      }).unwrap()

      onClose()
      setName('')
      setAmount('')
      setDirection('OUT')
      setFrequency('MONTHLY')
      setStartDate(new Date().toISOString().split('T')[0])
      setEndDate('')
    } catch (err: any) {
      setError(err?.data?.error || t('recurring.errors.createFailed'))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('recurring.modal.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{t('recurring.modal.nameLabel')}</label>
          <Input
            placeholder={t('recurring.modal.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{t('recurring.modal.amountLabel')}</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{t('recurring.modal.typeLabel')}</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background/50 glass px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-flow disabled:cursor-not-allowed disabled:opacity-50"
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'IN' | 'OUT')}
            >
              <option value="OUT">{t('recurring.modal.outflow')}</option>
              <option value="IN">{t('recurring.modal.inflow')}</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{t('recurring.modal.frequencyLabel')}</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background/50 glass px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-flow disabled:cursor-not-allowed disabled:opacity-50"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option value="DAILY">{t('recurring.modal.daily')}</option>
            <option value="WEEKLY">{t('recurring.modal.weekly')}</option>
            <option value="MONTHLY">{t('recurring.modal.monthly')}</option>
            <option value="YEARLY">{t('recurring.modal.yearly')}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{t('recurring.modal.startDate')}</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{t('recurring.modal.endDate')}</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button variant="flow" type="submit" disabled={isLoading} className="shadow-lg shadow-flow/20 text-white">
            {isLoading ? t('recurring.modal.creating') : t('recurring.modal.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
