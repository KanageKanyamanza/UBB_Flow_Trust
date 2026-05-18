import React, { useState } from 'react'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  ShieldCheck,
  Zap,
  PieChart,
  RefreshCw,
  Building2,
  FolderOpen
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/utils/utils'
import { useAuth } from '@/application/context/AuthContext'
import { Button } from '../ui/button'

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  path: string
  isCollapsed: boolean
  active: boolean
  onClick?: () => void
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, path, isCollapsed, active, onClick }) => (
  <Link to={path} onClick={onClick}>
    <motion.div
      className={cn(
        "flex items-center gap-2 p-2 mb-1 transition-all duration-300 group relative",
        active 
          ? "bg-flow/20 text-flow shadow-lg shadow-flow/5" 
          : "text-muted-foreground hover:bg-white/5 hover:text-white"
      )}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={cn(
        "flex-shrink-0 transition-transform duration-300",
        active && "scale-100"
      )}>
        {icon}
      </div>
      
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="font-bold tracking-tight whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {active && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute left-0 w-1 h-6 bg-flow rounded-full"
        />
      )}
    </motion.div>
  </Link>
)

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { logout, user } = useAuth()
  const location = useLocation()

  const navItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Tableau de Bord', path: '/dashboard' },
    { icon: <Building2 size={22} />, label: 'Profil PME', path: '/profile' },
    { icon: <ShieldCheck size={22} />, label: 'Conformité', path: '/compliance' },
    { icon: <FolderOpen size={22} />, label: 'Data Room', path: '/documents' },
    { icon: <TrendingUp size={22} />, label: 'Flux Financiers', path: '/transactions' },
    { icon: <PieChart size={22} />, label: 'Budget vs Réel', path: '/budget' },
    { icon: <RefreshCw size={22} />, label: 'Échéances', path: '/recurring-rules' },
    { icon: <Wallet size={22} />, label: 'Comptes', path: '/accounts' },
  ]

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className={cn(
        "flex items-center mb-12 transition-all duration-500",
        isCollapsed ? "justify-center" : "px-2"
      )}>
        {/* <TrendingUp className="text-flow w-5 h-5 flex-shrink-0" /> */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden pt-3"
            >
              <span className="text-xl font-black italic tracking-tighter whitespace-nowrap">
                UBB <span className="text-trust">Trust & Flow</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <SidebarItem
            key={item.path}
            {...item}
            isCollapsed={isCollapsed}
            active={location.pathname === item.path}
            onClick={() => setIsMobileOpen(false)}
          />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="py-3 px-2 border-t border-white/5 space-y-2">
        {!isCollapsed && (
          <div className="px-4 py-3 rounded-xl bg-white/5 space-y-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Connecté en tant que</p>
            <p className="text-xs font-bold truncate">{user?.email}</p>
          </div>
        )}
        
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-1 rounded-2xl text-destructive hover:bg-destructive/10 transition-all",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut size={22} />
          {!isCollapsed && <span className="font-bold tracking-tight">Déconnexion</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-full items-center justify-center p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="glass" 
          size="icon" 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="rounded-full shadow-2xl"
        >
          <Menu />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 70 : 200 }}
        className="hidden md:block h-screen bg-background border-r border-white/10 glass sticky top-0 overflow-hidden"
      >
        {SidebarContent}
      </motion.aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-background border-r border-white/10 z-50 md:hidden"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
