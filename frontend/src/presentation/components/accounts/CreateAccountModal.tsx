import React, { useState } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useCreateAccountMutation } from '../../../infrastructure/api/accountApi'

interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

type AccountType = 'BANK' | 'MOBILE_MONEY' | 'CASH' | 'OTHER'

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('BANK')
  const [balance, setBalance] = useState('')
  const [currency, setCurrency] = useState('XAF')
  const [error, setError] = useState('')
  const [createAccount, { isLoading }] = useCreateAccountMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!name.trim()) return setError('Le nom du compte est requis')
    
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
      setError(err?.data?.error || 'Une erreur est survenue lors de la création du compte')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau Compte">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Nom du Compte</label>
          <Input 
            placeholder="Compte Principal / Mobile Wallet..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Type de Compte</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background/50 glass px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
          >
            <option value="BANK">Banque</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CASH">Espèces</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Solde Initial</label>
            <Input 
              type="number"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="glass"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Devise</label>
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
            Annuler
          </Button>
          <Button variant="trust" type="submit" disabled={isLoading} className="shadow-lg shadow-trust/20">
            {isLoading ? 'Création...' : 'Créer le Compte'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
