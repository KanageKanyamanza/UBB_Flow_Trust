import React from 'react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine
} from 'recharts'
import { format, parseISO, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Ban, AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/utils/utils'

interface ForecastPoint {
  date: string
  balance: number
  isForecast: boolean
}

interface CashFlowForecastChartProps {
  data: ForecastPoint[]
  isLoading?: boolean
  dangerThreshold?: number
}

export const CashFlowForecastChart: React.FC<CashFlowForecastChartProps> = ({ 
  data, 
  isLoading,
  dangerThreshold = 500000 // Default danger threshold at 500k CFA
}) => {
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'dd MMM', { locale: fr })
  }))

  if (isLoading) {
    return <div className="h-[350px] w-full flex items-center justify-center bg-white/5 animate-pulse rounded-2xl" />
  }

  // Find the split point between historical and forecast
  // Split data for historical vs forecast
  const historicalData = formattedData.map((d, idx) => {
    const isFirstForecast = d.isForecast && (idx === 0 || !formattedData[idx - 1].isForecast)
    const isLastHistorical = !d.isForecast && (idx === formattedData.length - 1 || formattedData[idx + 1].isForecast)

    return {
      ...d,
      // Historical line should include the first forecast point to connect
      balanceHistorical: !d.isForecast || isFirstForecast ? d.balance : null,
      // Forecast line should include the last historical point to connect
      balanceForecast: d.isForecast || isLastHistorical ? d.balance : null
    }
  })

  return (
    <div className="h-[400px] w-full py-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={historicalData}
          margin={{ top: 20, right: 10, left: 30, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#41db8d" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#41db8d" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.01} />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="dangerGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#ef4444" floodOpacity="0.3" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
          
          <XAxis 
            dataKey="formattedDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#888888', fontWeight: 500 }} 
            minTickGap={60}
            dy={10}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#888888', fontWeight: 500 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            dx={-10}
          />
          
          <Tooltip 
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload.find(p => p.dataKey === 'balance') || payload[0]
                if (!item) return null

                const isForecast = item.payload.isForecast

                return (
                  <div className="bg-background/90 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-8">
                        <p className="text-[#888] text-[10px] uppercase tracking-[0.2em] font-black">{label}</p>
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                          isForecast ? "bg-trust/20 text-trust" : "bg-flow/20 text-flow"
                        )}>
                          {isForecast ? 'Prévision' : 'Réel'}
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-2xl tracking-tighter">
                          {new Intl.NumberFormat('fr-FR').format(Math.round(item.value as number))}
                          <span className="text-xs ml-1 text-muted-foreground font-medium">CFA</span>
                        </span>
                      </div>
                      
                      {Number(item.value) < dangerThreshold && (
                        <div className="mt-2 pt-2 border-t border-destructive/20 flex items-center gap-2 text-destructive animate-pulse">
                          <AlertTriangle size={12} />
                          <span className="text-[10px] font-black uppercase tracking-tight">Zone de Vigilance</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
              return null
            }}
          />

          {/* Danger Zone */}
          <ReferenceArea 
            y1={0} 
            y2={dangerThreshold} 
            fill="url(#dangerGradient)" 
            stroke="none"
          />

          <ReferenceLine 
            y={dangerThreshold} 
            stroke="#ef4444" 
            strokeDasharray="4 4"
            strokeOpacity={0.3}
            label={{ 
              value: 'SEUIL CRITIQUE', 
              position: 'insideBottomRight', 
              fill: '#ef4444', 
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.1em',
              textAnchor: 'end',
              dy: -10,
              dx: -10
            }} 
          />

          {/* Separation line for today */}
          {formattedData.find(d => d.isForecast) && (
            <ReferenceLine 
              x={formattedData.find(d => d.isForecast)?.formattedDate} 
              stroke="#ffffff10" 
              strokeDasharray="5 5" 
              label={{ 
                value: 'AUJOURD\'HUI', 
                position: 'top', 
                fill: '#888', 
                fontSize: 8, 
                fontWeight: 900,
                letterSpacing: '0.1em',
                offset: 15
              }} 
            />
          )}

          <Area 
            type="monotone" 
            dataKey="balance" 
            fill={historicalData.some(d => d.isForecast) ? "url(#colorForecast)" : "url(#colorHistorical)"}
            stroke="none"
            activeDot={false}
            animationDuration={2000}
          />

          {/* Historical Line */}
          <Line 
            type="monotone" 
            dataKey="balanceHistorical" 
            stroke="#41db8d" 
            strokeWidth={3}
            dot={{ r: 3, fill: '#41db8d', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0, fill: '#41db8d' }}
            connectNulls
            animationDuration={2000}
          />
          
          {/* Forecast Line (Dashed with Glow) */}
          <Line 
            type="monotone" 
            dataKey="balanceForecast" 
            stroke="#3b82f6" 
            strokeWidth={3}
            strokeDasharray="8 5"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}
            connectNulls
            filter="url(#glow)"
            animationDuration={2000}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}


