import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp,
  ShieldCheck,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  Layers
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Link } from 'react-router-dom'
import { useAuth } from '../../application/context/AuthContext'
import { useGetAccountsQuery } from '../../infrastructure/api/accountApi'
import { 
  useGetCategorySummaryQuery, 
  useGetDailyBalancesQuery, 
  useGetDashboardStatsQuery,
  useGetCashFlowForecastQuery
} from '../../infrastructure/api/analyticsApi'
import { AccountCard } from '../components/accounts/AccountCard'
import { DailyBalanceChart } from '../components/dashboard/DailyBalanceChart'
import { CategorySummaryChart } from '../components/dashboard/CategorySummaryChart'
import { CashFlowForecastChart } from '../components/dashboard/CashFlowForecastChart'
import { Plus, ChevronRight, Ban } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/shared/utils/utils'
import { SkeletonKpiCard, SkeletonChart } from '../components/ui/skeleton'
import { useToast } from '../../application/context/ToastContext'
import { Seo } from '../components/seo/Seo'

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const dateFnsLocale = i18n.language === 'fr' ? fr : undefined
  const { user, logout } = useAuth()
  const { error: toastError } = useToast()
  const { data: accounts, isLoading: isAccountsLoading, isError: isAccountsError } = useGetAccountsQuery()
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError } = useGetDashboardStatsQuery()
  const { data: dailyBalances, isLoading: isDailyBalanceLoading } = useGetDailyBalancesQuery()
  const { data: categorySummary, isLoading: isCategoryLoading } = useGetCategorySummaryQuery()
  const { data: forecast, isLoading: isForecastLoading } = useGetCashFlowForecastQuery()

  // Show error toasts on fetch failures
  React.useEffect(() => {
    if (isStatsError) toastError(t('common.error'), t('dashboard.errors.statsLoad'))
  }, [isStatsError])
  React.useEffect(() => {
    if (isAccountsError) toastError(t('common.error'), t('dashboard.errors.accountsLoad'))
  }, [isAccountsError])

  const recentAccounts = accounts?.slice(0, 3) || []

  return (
    <div className="flex flex-col min-h-screen animate-fade-in pb-20">
      <Seo title={`${t('pages.dashboard')} — ${t('brand.name')}`} noindex />
      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-4 justify-between">
              <h1 className="text-3xl font-bold tracking-tight">{t('pages.dashboard')}</h1>
              <Link to="/transactions/new">
                <Button variant="flow" size="sm" className="h-8 rounded-full px-4 gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-flow/20">
                  <Plus size={14} />
                  <span className="hidden md:block">{t('transactions.newTransaction')}</span>
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
              <Calendar className="w-4 h-4 text-flow" />
              {format(new Date(), 'EEEE d MMMM yyyy', { locale: dateFnsLocale })}
            </div>
          </div>
        </header>

        {/* Global Stats Overview */}
        {isStatsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <SkeletonKpiCard key={i} />)}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Trésorerie Totale */}
          <Card className="glass relative overflow-hidden group hover:bg-white/5 border-white/5">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.06] pointer-events-none">
              <Wallet size={80} className="text-flow" />
            </div>
            <CardHeader className="p-4 sm:p-4 pb-1.5">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Wallet className="w-4 h-4 text-flow" />
                {t('dashboard.kpi.totalBalance')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-4 pt-0">
              <div className="text-2xl font-bold">{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(stats?.totalBalance || 0)} CFA</div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.kpi.totalBalanceDesc')}</p>
            </CardContent>
          </Card>

          {/* Entrées du mois */}
          <Card className="glass relative overflow-hidden border-white/5">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.06] pointer-events-none">
              <ArrowUpRight size={80} className="text-success" />
            </div>
            <CardHeader className="p-4 sm:p-4 pb-1.5">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-success" />
                {t('dashboard.kpi.monthlyIn')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-4 pt-0">
              <div className="text-2xl font-bold text-success">
                +{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(stats?.currentMonthIn || 0)} CFA
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.kpi.monthlyInDesc', { month: format(new Date(), 'MMMM', { locale: dateFnsLocale }) })}</p>
            </CardContent>
          </Card>

          {/* Monthly Cash Burn */}
          <Card className="glass relative overflow-hidden border-white/5">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.06] pointer-events-none">
              <ArrowDownRight size={80} className="text-destructive" />
            </div>
            <CardHeader className="p-4 sm:p-4 pb-1.5">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-destructive" />
                {t('dashboard.kpi.burnRate')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-4 pt-0">
              <div className="text-2xl font-bold text-destructive">
                {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(stats?.monthlyBurnRate || 0)} CFA
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.kpi.burnRateDesc')}</p>
            </CardContent>
          </Card>

          {/* Estimated Runway */}
          <Card className={cn(
            "glass relative overflow-hidden",
            stats?.runwayMonths && stats.runwayMonths < 3 ? "border-destructive/30 bg-destructive/5" : "border-trust/10 glow-trust"
          )}>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.06] pointer-events-none">
              <ShieldCheck size={80} className={stats?.runwayMonths && stats.runwayMonths < 3 ? "text-destructive" : "text-trust"} />
            </div>
            <CardHeader className="p-4 sm:p-4 pb-1.5">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Calendar className={cn("w-4 h-4", stats?.runwayMonths && stats.runwayMonths < 3 ? "text-destructive" : "text-trust")} />
                {t('dashboard.kpi.runway')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-4 pt-0">
              <div className={cn(
                "text-2xl font-bold",
                stats?.runwayMonths && stats.runwayMonths < 3 ? "text-destructive" : "text-white"
              )}>
                {stats?.runwayMonths === 99 ? '∞' : t('dashboard.kpi.months', { count: stats?.runwayMonths })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.kpi.runwayDesc')}</p>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Charts Section */}
        {isDailyBalanceLoading && isCategoryLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonChart height={250} />
            <SkeletonChart height={250} />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass border-white/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 font-bold">
                <TrendingUp className="w-5 h-5 text-flow" />
                {t('dashboard.charts.dailyBalance')}
              </CardTitle>
              <CardDescription>{t('dashboard.charts.dailyBalanceDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DailyBalanceChart data={dailyBalances || []} isLoading={isDailyBalanceLoading} />
            </CardContent>
          </Card>

          <Card className="glass border-white/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 font-bold">
                <Layers className="w-5 h-5 text-flow" />
                {t('dashboard.charts.categoryDistrib')}
              </CardTitle>
              <CardDescription>{t('dashboard.charts.categoryDistribDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <CategorySummaryChart data={categorySummary || []} isLoading={isCategoryLoading} />
            </CardContent>
          </Card>
        </div>
        )}

        {/* Forecast Section */}
        <Card className="glass border-white/5">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2 font-bold">
                <ShieldCheck className="w-5 h-5 text-trust" />
                {t('dashboard.forecast.title')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t('dashboard.forecast.desc')}</CardDescription>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-destructive/10 border border-destructive/20 rounded-full w-fit">
              <Ban className="w-3 h-3 text-destructive" />
              <span className="text-[10px] font-bold text-destructive uppercase tracking-wider whitespace-nowrap">{t('dashboard.forecast.vigilance')}</span>
            </div>
          </CardHeader>
          <CardContent>
            <CashFlowForecastChart 
              data={forecast || []} 
              isLoading={isForecastLoading} 
              dangerThreshold={stats?.monthlyBurnRate ? stats.monthlyBurnRate * 0.5 : 500000}
            />
          </CardContent>
        </Card>

        {/* Recent Accounts */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight px-2 flex items-center gap-2">
              <Wallet size={20} className="text-flow" />
              {t('dashboard.accounts.title')}
            </h2>
            <Link to="/accounts" className="text-sm whitespace-nowrap text-trust hover:underline flex items-center gap-1 font-medium bg-trust/5 px-3 py-1 rounded-full border border-trust/10 transition-colors">
              {t('dashboard.accounts.manage')} <ChevronRight size={14} />
            </Link>
          </div>

          {isAccountsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <SkeletonKpiCard key={i} />
              ))}
            </div>
          ) : accounts?.length === 0 ? (
            <div className="bg-muted/30 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4">
              <Plus className="w-12 h-12 text-muted-foreground/30" />
              <div className="space-y-1">
                <h3 className="text-lg font-medium">{t('dashboard.accounts.empty')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{t('dashboard.accounts.emptyDesc')}</p>
              </div>
              <Button variant="secondary" className="mt-2" asChild>
                <Link to="/accounts">{t('dashboard.accounts.add')}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAccounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </section>

        {/* Action Call for trust */}
        <div className="bg-gradient-to-r from-trust/10 via-background to-flow/10 border border-white/5 rounded-3xl p-8 text-center sm:text-left flex flex-col sm:row gap-6 items-center justify-between overflow-hidden relative">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <ShieldCheck size={180} className="text-trust" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-bold flex items-center justify-center sm:justify-start gap-3">
              <div className="w-10 h-10 rounded-full bg-trust/20 border border-trust/30 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-trust" />
              </div>
              {t('trust.credibilityTitle')}
            </h3>
            <p className="text-muted-foreground max-w-xl">
              {t('trust.credibilityDesc')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 relative z-10">
            <Button className="bg-trust hover:bg-trust-hover shadow-lg shadow-trust/20 border-none" asChild>
              <Link to="/documents" className="gap-2">
                <Upload size={16} />
                {t('dashboard.cta.documents')}
              </Link>
            </Button>
            <Button variant="outline" className="border-white/10 hover:bg-white/5" asChild>
              <Link to="/transactions">{t('dashboard.cta.history')}</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
