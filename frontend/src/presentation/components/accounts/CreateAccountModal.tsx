import React, { useState } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useCreateAccountMutation } from '../../../infrastructure/api/accountApi'
import { useTranslation } from 'react-i18next'

interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

type AccountType = 'BANK' | 'MOBILE_MONEY' | 'CASH' | 'OTHER'

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('BANK')
  const [balance, setBalance] = useState('')
  const [currency, setCurrency] = useState('XAF')
  const [error, setError] = useState('')
  const [createAccount, { isLoading }] = useCreateAccountMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError(t('accounts.modal.errors.nameRequired'))

    try {
      await createAccount({
        name,
        type,
        currency,
        balance: parseFloat(balance) || 0
      }).unwrap()

      onClose()
      setName('')
      setType('BANK')
      setBalance('')
      setCurrency('XAF')
    } catch (err: any) {
      setError(err?.data?.error || t('accounts.modal.errors.createFailed'))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('accounts.modal.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{t('accounts.modal.nameLabel')}</label>
          <Input
            placeholder={t('accounts.modal.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{t('accounts.modal.typeLabel')}</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background/50 glass px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
          >
            <option value="BANK">{t('accounts.modal.typeBank')}</option>
            <option value="MOBILE_MONEY">{t('accounts.modal.typeMobile')}</option>
            <option value="CASH">{t('accounts.modal.typeCash')}</option>
            <option value="OTHER">{t('accounts.modal.typeOther')}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{t('accounts.modal.balanceLabel')}</label>
            <Input
              type="number"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="glass"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">{t('accounts.modal.currencyLabel')}</label>
            <Input
              placeholder="XAF"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="glass"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button variant="trust" type="submit" disabled={isLoading} className="shadow-lg shadow-trust/20">
            {isLoading ? t('accounts.modal.creating') : t('accounts.modal.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
