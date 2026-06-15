import React from 'react'
import { motion } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageTransition — wraps page content with a smooth fade + slide-up animation.
 * Use inside AnimatePresence in App.tsx for route transitions.
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.22,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  )
}
