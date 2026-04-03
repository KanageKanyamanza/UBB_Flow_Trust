import React from 'react'
import { 
  X, 
  Calendar, 
  Tag, 
  CreditCard, 
  User, 
  FileText, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  MapPin, 
  FileImage,
  ExternalLink,
  Download
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Transaction, TxnDirection } from '@/domain/entities/transaction.entity'
import { Button } from '../ui/button'
import { cn } from '@/shared/utils/utils'

interface TransactionDetailProps {
  transaction: Transaction
  onClose: () => void
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({ transaction, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'XAF',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isFlow = transaction.direction === TxnDirection.IN
  const hasReceipts = transaction.evidenceFiles && transaction.evidenceFiles.length > 0

  return (
    <div className="space-y-8 pb-6">
      {/* Header with Amount */}
      <div className="text-center space-y-4">
        <div className={cn(
          "inline-flex p-4 rounded-3xl shadow-2xl mb-2",
          isFlow ? "bg-flow/20 text-flow glow-flow" : "bg-destructive/20 text-destructive glow-destructive"
        )}>
          {isFlow ? <ArrowDownLeft size={48} /> : <ArrowUpRight size={48} />}
        </div>
        <div>
          <h2 className={cn(
            "text-4xl font-black tracking-tighter mb-1",
            isFlow ? "text-flow" : "text-white"
          )}>
            {isFlow ? '+' : '-'} {formatAmount(transaction.amount, transaction.currency)}
          </h2>
          <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px]">
            {transaction.category.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 gap-4">
        <DetailItem 
          icon={<Calendar size={18} />} 
          label="Date & Heure" 
          value={formatDate(transaction.occurredAt)} 
        />
        <DetailItem 
          icon={<MapPin size={18} />} 
          label="Tiers / Bénéficiaire" 
          value={transaction.counterparty || 'Non spécifié'} 
        />
        <DetailItem 
          icon={<CreditCard size={18} />} 
          label="Mode de Règlement" 
          value={transaction.method.replace('_', ' ')} 
        />
        <DetailItem 
          icon={<Clock size={14} />} 
          label="Enregistré le" 
          value={formatDate(transaction.createdAt)} 
          small
        />
      </div>

      {/* Notes */}
      {transaction.notes && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <FileText size={14} /> Notes
          </div>
          <p className="text-sm leading-relaxed italic text-foreground/80">
            "{transaction.notes}"
          </p>
        </div>
      )}

      {/* Receipts / Proof of Payment */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
             <FileImage size={16} /> Justificatifs ({transaction.evidenceFiles?.length || 0})
          </div>
        </div>

        {hasReceipts ? (
          <div className="grid grid-cols-1 gap-4">
            {transaction.evidenceFiles?.map((file) => (
              <div key={file.id} className="relative group rounded-2xl overflow-hidden border border-white/10 glass shadow-2xl bg-black/40">
                <img 
                  src={file.fileUrl.startsWith('/') ? `http://localhost:5000${file.fileUrl}` : file.fileUrl} 
                  alt={file.fileName}
                  className="w-full h-auto max-h-[300px] object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                   <Button variant="glass" size="icon" className="h-12 w-12 rounded-full" asChild>
                     <a href={file.fileUrl.startsWith('/') ? `http://localhost:5000${file.fileUrl}` : file.fileUrl} target="_blank" rel="noopener noreferrer">
                       <ExternalLink size={20} />
                     </a>
                   </Button>
                   <Button variant="glass" size="icon" className="h-12 w-12 rounded-full">
                     <Download size={20} />
                   </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-xl text-[10px] font-bold truncate">
                  {file.fileName}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center space-y-3">
             <FileImage size={32} className="text-muted-foreground/20" />
             <p className="text-xs text-muted-foreground font-medium">Aucun justificatif joint à cette transaction.</p>
             <Button variant="outline" size="sm" className="h-8 text-[10px] font-black border-white/10 hover:bg-white/5">
                AJOUTER UN REÇU
             </Button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="pt-4">
        <Button variant="outline" className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 rounded-xl py-6 font-bold uppercase tracking-tighter">
          Supprimer la transaction
        </Button>
      </div>
    </div>
  )
}

const DetailItem = ({ icon, label, value, small }: { icon: any, label: string, value: string, small?: boolean }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
     <div className="p-2.5 rounded-xl bg-white/5 text-muted-foreground">
        {icon}
     </div>
     <div className="space-y-0.5">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className={cn("font-bold tracking-tight", small ? "text-xs opacity-60" : "text-sm")}>{value}</p>
     </div>
  </div>
)
