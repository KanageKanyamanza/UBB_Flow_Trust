import React from 'react'
import { Building2, Smartphone, Wallet, Coins, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Account, useDeleteAccountMutation } from '../../../infrastructure/api/accountApi'

interface AccountCardProps {
  account: Account
}

const typeIcons = {
  BANK: Building2,
  MOBILE_MONEY: Smartphone,
  CASH: Wallet,
  OTHER: Coins,
}

const typeLabels = {
  BANK: 'Banque',
  MOBILE_MONEY: 'Mobile Money',
  CASH: 'Espèces',
  OTHER: 'Autre',
}

export const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation()
  const Icon = typeIcons[account.type] || Coins

  const handleDelete = async () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le compte "${account.name}" ?`)) {
      try {
        await deleteAccount(account.id).unwrap()
      } catch (error) {
        console.error('Failed to delete account:', error)
      }
    }
  }

  return (
    <Card className="glass relative group hover:scale-[1.02] transition-all duration-300">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5 text-muted-foreground group-hover:text-flow transition-colors">
            <Icon size={20} />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">{account.name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {typeLabels[account.type]} • {account.currency}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDelete}
          disabled={isLoading}
          className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={16} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight">
            {new Intl.NumberFormat('fr-FR').format(Number(account.balance))} {account.currency}
          </div>
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp size={12} className="text-green-500" />
            <span className="text-muted-foreground">En progression</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
