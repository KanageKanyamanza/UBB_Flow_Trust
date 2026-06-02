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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-500 p-0 sm:p-4">
      <div 
        className="relative w-full sm:max-w-2xl md:max-w-3xl bg-background border-t sm:border border-white/10 rounded-t-xl sm:rounded-xl shadow-2xl glass flex flex-col max-h-[95vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-4 sm:hidden flex-shrink-0" />
        
        <div className="flex items-center justify-between px-8 sm:px-6 py-4 border-b border-white/5 flex-shrink-0">
          <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/80">{title}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="rounded-full h-8 w-8 p-0"
          >
            <X size={20} />
          </Button>
        </div>
        
        <div className="overflow-y-auto px-8 sm:px-6 py-6 pb-12 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
