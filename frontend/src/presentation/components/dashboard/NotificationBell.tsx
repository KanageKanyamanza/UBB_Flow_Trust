import React, { useState, useRef, useEffect } from 'react'
import { Bell, AlertTriangle, AlertCircle, Info, Check, Sparkles } from 'lucide-react'
import { useGetAlertsQuery, useAcknowledgeAlertMutation } from '@/infrastructure/api/alertApi'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/utils/utils'

export const NotificationBell: React.FC = () => {
  const { data: alerts = [], isLoading } = useGetAlertsQuery()
  const [acknowledge] = useAcknowledgeAlertMutation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAcknowledgeAll = async () => {
    try {
      await Promise.all(alerts.map(alert => acknowledge(alert.id).unwrap()))
    } catch (error) {
      console.error('Failed to acknowledge all alerts', error)
    }
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-destructive/10 hover:bg-destructive/15 border-destructive/20',
          text: 'text-destructive',
          dot: 'bg-destructive shadow-destructive/50',
          icon: <AlertCircle className="text-destructive shrink-0" size={16} />
        }
      case 'WARN':
        return {
          bg: 'bg-yellow-500/10 hover:bg-yellow-500/15 border-yellow-500/20',
          text: 'text-yellow-500',
          dot: 'bg-yellow-500 shadow-yellow-500/50',
          icon: <AlertTriangle className="text-yellow-500 shrink-0" size={16} />
        }
      default:
        return {
          bg: 'bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/20',
          text: 'text-blue-500',
          dot: 'bg-blue-500 shadow-blue-500/50',
          icon: <Info className="text-blue-500 shrink-0" size={16} />
        }
    }
  }

  const unreadCount = alerts.length

  return (
    <div className="relative z-40" ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-full border bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center text-muted-foreground hover:text-white",
          isOpen && "bg-white/10 border-white/20 text-white"
        )}
        aria-label="Notifications"
      >
        <Bell size={18} className={cn(unreadCount > 0 && "animate-wiggle")} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white border border-background shadow-lg shadow-destructive/20 animate-fade-in">
            {unreadCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl p-4 overflow-hidden glow-trust"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Alertes de Vigilance</span>
                {unreadCount > 0 && (
                  <span className="bg-destructive/20 text-destructive text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    {unreadCount} Active{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleAcknowledgeAll}
                  className="text-[10px] font-black uppercase tracking-widest text-trust hover:text-white transition-colors"
                >
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                  Chargement des alertes...
                </div>
              ) : alerts.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Tout est en ordre</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Aucune alerte active à signaler.</p>
                  </div>
                </div>
              ) : (
                alerts.map((alert) => {
                  const styles = getSeverityStyles(alert.severity)
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={cn(
                        "p-3 rounded-xl border flex items-start gap-3 transition-all group relative overflow-hidden",
                        styles.bg
                      )}
                    >
                      {/* Left Dot status */}
                      <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse", styles.dot)} />

                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-bold text-white leading-snug break-words">
                          {alert.message}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                      </div>

                      {/* Acknowledge Button */}
                      <button
                        onClick={() => acknowledge(alert.id)}
                        className="p-1 rounded-md bg-white/5 border border-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white/10 hover:border-white/10 text-muted-foreground hover:text-white transition-all shrink-0"
                        title="Marquer comme lu"
                      >
                        <Check size={12} />
                      </button>
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* View compliance button */}
            <div className="pt-3 border-t border-white/5 mt-3 flex justify-center">
              <a
                href="/compliance"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
              >
                Gérer la conformité
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
