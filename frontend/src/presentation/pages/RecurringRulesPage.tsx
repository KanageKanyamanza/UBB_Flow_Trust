import React, { useState, useMemo } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Trash2
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  differenceInDays,
  isBefore,
  isAfter,
  startOfDay
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { cn } from '@/shared/utils/utils'
import { useGetRecurringRulesQuery, useDeleteRecurringRuleMutation } from '../../infrastructure/api/recurringRuleApi'
import { RecurringRule } from '../../infrastructure/api/recurringRuleApi'
import { RecurringRuleModal } from '../components/recurring-rules/RecurringRuleModal'

const RecurringRulesPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: rules, isLoading } = useGetRecurringRulesQuery()
  const [deleteRule] = useDeleteRecurringRuleMutation()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const dateFormat = "MMMM yyyy"
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const today = () => setCurrentDate(new Date())

  // Generate projections for the currently viewed month
  const projections = useMemo(() => {
    if (!rules) return {}

    const eventsMap: Record<string, RecurringRule[]> = {}

    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      eventsMap[dateStr] = []
      
      rules.forEach(rule => {
        const ruleStart = startOfDay(new Date(rule.startDate))
        const ruleEnd = rule.endDate ? startOfDay(new Date(rule.endDate)) : null
        const currentDay = startOfDay(day)

        if (isBefore(currentDay, ruleStart)) return
        if (ruleEnd && isAfter(currentDay, ruleEnd)) return

        let matches = false
        const freq = rule.frequency.toLowerCase()
        
        if (freq === 'daily') {
          matches = true
        } else if (freq === 'weekly') {
          matches = differenceInDays(currentDay, ruleStart) % 7 === 0
        } else if (freq === 'monthly') {
          matches = currentDay.getDate() === ruleStart.getDate()
        } else if (freq === 'yearly') {
          matches = currentDay.getDate() === ruleStart.getDate() && currentDay.getMonth() === ruleStart.getMonth()
        }

        if (matches) {
          eventsMap[dateStr].push(rule)
        }
      })
    })

    return eventsMap
  }, [days, rules])

  return (
    <div className="flex flex-col min-h-screen animate-fade-in pb-20">
      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <RefreshCw className="text-flow" />
              Récurrences
            </h1>
            <p className="text-muted-foreground">Gérez vos échéances et flux financiers automatisés.</p>
          </div>
          <Button className="gap-2 bg-flow text-white hover:bg-flow/90" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Nouvelle Règle
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <Card className="glass border-white/5 lg:col-span-2 overflow-hidden flex flex-col">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold capitalize">{format(currentDate, dateFormat, { locale: fr })}</h2>
                  <Button variant="outline" size="sm" onClick={today} className="text-xs h-7 border-white/10">
                    Aujourd'hui
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-white/10">
                    <ChevronLeft size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-white/10">
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.01]">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="py-2 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-fr h-full">
                {days.map((day, i) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayEvents = projections[dateStr] || []
                  const isCurrentMonth = isSameMonth(day, monthStart)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div 
                      key={day.toString()} 
                      className={cn(
                        "min-h-[100px] border-b border-r border-white/5 p-2 transition-colors",
                        !isCurrentMonth && "bg-black/20 opacity-50",
                        i % 7 === 6 && "border-r-0", // No right border on last column
                        isToday && "bg-flow/5"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                          isToday ? "bg-flow text-white" : "text-muted-foreground"
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      
                      <div className="mt-2 space-y-1 overflow-y-auto max-h-24 no-scrollbar">
                        {dayEvents.map((event, idx) => (
                          <div 
                            key={`${event.id}-${idx}`}
                            className={cn(
                              "text-[10px] px-1.5 py-1 rounded border font-medium truncate flex items-center gap-1",
                              event.direction === 'IN' 
                                ? "bg-success/10 border-success/20 text-success" 
                                : "bg-destructive/10 border-destructive/20 text-destructive"
                            )}
                            title={`${event.name} - ${new Intl.NumberFormat('fr-FR').format(Number(event.amount))} CFA`}
                          >
                            {event.direction === 'IN' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            <span className="truncate">{event.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* List View */}
          <Card className="glass border-white/5">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-lg font-bold">Toutes les règles</CardTitle>
              <CardDescription>Vos transactions récurrentes actives.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-6 text-center text-muted-foreground animate-pulse">Chargement...</div>
                ) : !rules || rules.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Aucune règle récurrente configurée.
                  </div>
                ) : (
                  rules.map(rule => (
                    <div key={rule.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm text-white/90">{rule.name}</p>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">
                            {rule.frequency === 'DAILY' ? 'Quotidien' : 
                             rule.frequency === 'WEEKLY' ? 'Hebdomadaire' : 
                             rule.frequency === 'MONTHLY' ? 'Mensuel' : 'Annuel'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-bold text-sm",
                            rule.direction === 'IN' ? "text-success" : "text-destructive"
                          )}>
                            {rule.direction === 'IN' ? '+' : '-'}{new Intl.NumberFormat('fr-FR').format(Number(rule.amount))}
                          </p>
                          <button 
                            onClick={() => deleteRule(rule.id)}
                            className="mt-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1"
                            title="Supprimer la règle"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <RecurringRuleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}

export default RecurringRulesPage
