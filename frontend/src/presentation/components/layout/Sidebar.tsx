import React, { useState } from 'react'
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  ShieldCheck,
  PieChart,
  RefreshCw,
  Building2,
  FolderOpen,
  Users,
  Globe
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
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
        "flex items-center gap-2 p-1.5 mb-0.5 transition-all duration-300 group relative",
        isCollapsed ? "justify-center" : "",
        active
          ? "bg-flow/20 text-flow shadow-lg shadow-flow/5"
          : "text-muted-foreground hover:bg-white/5 hover:text-white"
      )}
      whileHover={isCollapsed ? { scale: 1.05 } : { x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={cn("flex-shrink-0 transition-transform duration-300", active && "scale-100")}>
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
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')
  }

  const navItems = [
    { icon: <LayoutDashboard size={22} />, label: t('nav.dashboard'), path: '/dashboard' },
    ...(user?.role === 'OWNER' ? [
      { icon: <Building2 size={22} />, label: t('nav.profile'), path: '/profile' },
      { icon: <ShieldCheck size={22} />, label: t('nav.compliance'), path: '/compliance' },
      { icon: <FolderOpen size={22} />, label: t('nav.documents'), path: '/documents' },
    ] : []),
    { icon: <TrendingUp size={22} />, label: t('nav.transactions'), path: '/transactions' },
    { icon: <PieChart size={22} />, label: t('nav.budget'), path: '/budget' },
    { icon: <RefreshCw size={22} />, label: t('nav.recurringRules'), path: '/recurring-rules' },
    { icon: <Wallet size={22} />, label: t('nav.accounts'), path: '/accounts' },
  ]

  if (user?.role === 'OWNER') {
    navItems.push({ icon: <Users size={22} />, label: t('nav.team'), path: '/team' })
  }

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className={cn(
        "flex items-center mb-6 transition-all duration-500",
        isCollapsed ? "justify-center pt-3" : "px-2 pt-3"
      )}>
        <AnimatePresence>
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <img src="/logo.png" alt="TrustLane" className="h-8 w-auto rounded-xl" />
            </motion.div>
          ) : (
            <img src="/logo.png" alt="TrustLane" className="h-7 w-7 object-contain rounded-lg" />
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
      <div className="pt-2 pb-6 px-2 border-t border-white/5 space-y-1.5 hidden md:block">
        {!isCollapsed && (
          <div className="px-3 py-2 rounded-xl bg-white/5 space-y-0.5">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">{t('common.connected')}</p>
            <p className="text-xs font-bold truncate leading-none">{user?.email}</p>
          </div>
        )}

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-1 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all",
            isCollapsed ? "justify-center" : ""
          )}
          title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en Français'}
        >
          <Globe size={18} />
          {!isCollapsed && (
            <span className="font-bold tracking-tight text-xs uppercase">
              {i18n.language === 'fr' ? 'EN' : 'FR'}
            </span>
          )}
        </button>

        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-1 rounded-2xl text-destructive hover:bg-destructive/10 transition-all",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut size={22} />
          {!isCollapsed && <span className="font-bold tracking-tight">{t('nav.logout')}</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-full items-center justify-center p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-muted-foreground hover:text-white transition-all duration-300 shadow-md shadow-black/30"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Top Navbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <Button
            variant="glass"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
            className="rounded-xl"
          >
            <Menu size={20} />
          </Button>
          <img src="/logo.png" alt="TrustLane" className="h-7 w-auto" />
        </div>

        <div className="flex items-center gap-3 max-w-[60%]">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">{t('common.connected')}</p>
            <p className="text-xs font-bold truncate max-w-[150px]">{user?.email}</p>
          </div>
          <p className="text-xs font-bold truncate max-w-[100px] sm:hidden">{user?.email?.split('@')[0]}</p>

          <button
            onClick={toggleLanguage}
            className="p-2 rounded-xl text-muted-foreground hover:text-white transition-all"
            title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en Français'}
          >
            <Globe size={16} />
          </button>

          <Button
            variant="glass"
            size="icon"
            onClick={logout}
            className="text-destructive hover:bg-destructive/10 rounded-xl"
            aria-label={t('nav.logout')}
          >
            <LogOut size={18} />
          </Button>
        </div>
      </header>

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
              className="fixed inset-y-0 left-0 w-72 bg-background border-r border-white/10 z-50 md:hidden overflow-y-auto"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
