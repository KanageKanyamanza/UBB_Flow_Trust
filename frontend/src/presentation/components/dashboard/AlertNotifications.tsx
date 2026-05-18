import React from 'react'
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { useGetAlertsQuery, useAcknowledgeAlertMutation } from '@/infrastructure/api/alertApi'
import { Button } from '../ui/button'
import { cn } from '@/shared/utils/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const AlertNotifications: React.FC = () => {
  const { data: alerts, isLoading } = useGetAlertsQuery()
  const [acknowledge] = useAcknowledgeAlertMutation()

  if (isLoading || !alerts || alerts.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <AlertTriangle size={14} className="text-gold-accent" />
          Alertes de Vigilance ({alerts.length})
        </h3>
      </div>
      
      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4 transition-all group",
                alert.severity === 'CRITICAL' 
                  ? "bg-destructive/10 border-destructive/20 text-white" 
                  : "bg-gold-accent/10 border-gold-accent/20 text-white"
              )}
            >
              {/* Decorative background glow */}
              <div className={cn(
                "absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl",
                alert.severity === 'CRITICAL' ? "bg-destructive" : "bg-gold-accent"
              )} />

              <div className="flex gap-4 relative z-10">
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  alert.severity === 'CRITICAL' ? "bg-destructive/20" : "bg-gold-accent/20"
                )}>
                  {alert.severity === 'CRITICAL' ? (
                    <AlertCircle className="text-destructive" size={20} />
                  ) : (
                    <AlertTriangle className="text-gold-accent" size={20} />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                      alert.severity === 'CRITICAL' ? "bg-destructive/20 text-destructive" : "bg-gold-accent/20 text-gold-accent"
                    )}>
                      {alert.severity === 'CRITICAL' ? 'Critique' : 'Attention'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {format(new Date(alert.createdAt), 'dd MMM HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm font-bold leading-tight">{alert.message}</p>
                </div>

                <button 
                  onClick={() => acknowledge(alert.id)}
                  className="flex-shrink-0 self-start p-1 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="mt-3 flex items-center justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-white/5"
                  onClick={() => acknowledge(alert.id)}
                >
                  <CheckCircle2 size={12} />
                  Marquer comme lu
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
