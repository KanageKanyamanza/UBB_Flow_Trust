import React, { createContext, useCallback, useContext, useReducer, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number // ms, 0 = persistent
}

type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string }

// ─── Reducer ─────────────────────────────────────────────────────────────────

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'ADD':
      // Max 5 toasts simultaneously
      return [...state.slice(-4), action.toast]
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id)
    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: Toast[]
  toast: (opts: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
  success: (title: string, message?: string, duration?: number) => string
  error: (title: string, message?: string, duration?: number) => string
  warning: (title: string, message?: string, duration?: number) => string
  info: (title: string, message?: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])
  const counterRef = useRef(0)

  const dismiss = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', id })
  }, [])

  const toast = useCallback((opts: Omit<Toast, 'id'>): string => {
    const id = `toast-${++counterRef.current}-${Date.now()}`
    dispatch({ type: 'ADD', toast: { ...opts, id } })

    const duration = opts.duration ?? 4000
    if (duration > 0) {
      setTimeout(() => dispatch({ type: 'REMOVE', id }), duration)
    }
    return id
  }, [])

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'success', title, message, duration }),
    [toast]
  )
  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'error', title, message, duration: duration ?? 6000 }),
    [toast]
  )
  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'warning', title, message, duration }),
    [toast]
  )
  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'info', title, message, duration }),
    [toast]
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

// ─── UI ──────────────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<
  ToastType,
  { icon: React.ReactNode; border: string; iconColor: string; bg: string }
> = {
  success: {
    icon: <CheckCircle size={18} />,
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  error: {
    icon: <XCircle size={18} />,
    iconColor: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    iconColor: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  info: {
    icon: <Info size={18} />,
    iconColor: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = TOAST_CONFIG[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`
        flex items-start gap-3 px-4 py-3.5 rounded-xl
        bg-background/80 backdrop-blur-xl border shadow-2xl
        ${config.border} min-w-[280px] max-w-[380px]
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <span className={`mt-0.5 shrink-0 ${config.iconColor}`}>{config.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-white/40 hover:text-white/80 transition-colors mt-0.5"
        aria-label="Fermer la notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      aria-label="Notifications"
      className="dark fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
