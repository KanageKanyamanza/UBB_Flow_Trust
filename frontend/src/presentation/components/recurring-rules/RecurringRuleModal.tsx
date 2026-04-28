import React, { useState } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useCreateRecurringRuleMutation } from '../../../infrastructure/api/recurringRuleApi'

interface RecurringRuleModalProps {
  isOpen: boolean
  onClose: () => void
}

export const RecurringRuleModal: React.FC<RecurringRuleModalProps> = ({ isOpen, onClose }) => {
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
    
    if (!name.trim()) return setError('Le nom de la règle est requis')
    if (!amount || isNaN(Number(amount))) return setError('Un montant valide est requis')
    if (!startDate) return setError('Une date de début est requise')
    
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
      setError(err?.data?.error || 'Une erreur est survenue lors de la création de la règle')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Règle Récurrente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Nom de l'échéance</label>
          <Input 
            placeholder="Ex: Loyer, Salaire, Abonnement Internet..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Montant</label>
            <Input 
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Type de flux</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background/50 glass px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-flow disabled:cursor-not-allowed disabled:opacity-50"
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'IN' | 'OUT')}
            >
              <option value="OUT">Décaissement (-)</option>
              <option value="IN">Encaissement (+)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Fréquence</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background/50 glass px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-flow disabled:cursor-not-allowed disabled:opacity-50"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option value="DAILY">Quotidien</option>
            <option value="WEEKLY">Hebdomadaire</option>
            <option value="MONTHLY">Mensuel</option>
            <option value="YEARLY">Annuel</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Date de début</label>
            <Input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Date de fin (Optionnel)</label>
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
            Annuler
          </Button>
          <Button variant="flow" type="submit" disabled={isLoading} className="shadow-lg shadow-flow/20 text-white">
            {isLoading ? 'Création...' : 'Créer la Règle'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
