import React from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-500">
      <div 
        className="relative w-full sm:max-w-md bg-background border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl glass p-8 sm:p-6 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 pb-12 sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
        <div className="flex items-center justify-between mb-8 sm:mb-6">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="rounded-full p-1"
          >
            <X size={20} />
          </Button>
        </div>
        
        {children}
      </div>
    </div>
  )
}
