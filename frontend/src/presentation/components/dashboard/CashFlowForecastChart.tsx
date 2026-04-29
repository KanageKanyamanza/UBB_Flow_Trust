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
import { Ban } from 'lucide-react'
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
              <stop offset="5%" stopColor="#41db8d" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#41db8d" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
          
          <XAxis 
            dataKey="formattedDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#888888' }} 
            minTickGap={60}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#888888' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                // Find the actual balance value from the hidden 'balance' key or one of the lines
                const item = payload.find(p => p.dataKey === 'balance') || payload[0]
                if (!item) return null

                const isForecast = item.payload.isForecast

                return (
                  <div className="bg-background/95 border border-white/10 p-3 rounded-xl backdrop-blur-md shadow-2xl ring-1 ring-white/5">
                    <div className="flex flex-col gap-1">
                      <p className="text-[#888] text-[10px] uppercase tracking-widest font-bold">{label}</p>
                      <div className="flex flex-col">
                        <span className="text-white font-black text-lg">
                          {new Intl.NumberFormat('fr-FR').format(Math.round(item.value as number))} CFA
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", isForecast ? "bg-trust" : "bg-flow")} />
                          <span className="text-[#888] text-[10px] uppercase tracking-wider font-semibold">
                            {isForecast ? 'Prévisionnel' : 'Solde Réel'}
                          </span>
                        </div>
                      </div>
                      
                      {item.value! < dangerThreshold && (
                        <div className="mt-2 pt-2 border-t border-destructive/20 flex items-center gap-2 text-destructive">
                          <Ban size={10} />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Zone de Vigilance</span>
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
            ifOverflow="hidden"
          />

          <ReferenceLine 
            y={dangerThreshold} 
            stroke="#ef444430" 
            strokeDasharray="4 4"
            label={{ 
              value: 'Seuil Critique', 
              position: 'insideBottomRight', 
              fill: '#ef4444', 
              fontSize: 10,
              fontWeight: 800,
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
                value: 'Aujourd\'hui', 
                position: 'top', 
                fill: '#888', 
                fontSize: 9, 
                fontWeight: 600,
                offset: 10 
              }} 
            />
          )}

          <Area 
            type="monotone" 
            dataKey="balance" 
            fill="url(#colorForecast)" 
            stroke="none"
            activeDot={false}
            animationDuration={1500}
          />

          {/* Historical Line */}
          <Line 
            type="monotone" 
            dataKey="balanceHistorical" 
            stroke="#41db8d" 
            strokeWidth={4}
            dot={{ r: 4, fill: '#41db8d', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#41db8d' }}
            connectNulls
            animationDuration={1500}
          />
          
          {/* Forecast Line (Dashed) */}
          <Line 
            type="monotone" 
            dataKey="balanceForecast" 
            stroke="#3b82f6" // Use Blue/Trust color for forecast
            strokeWidth={3}
            strokeDasharray="8 5"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}
            connectNulls
            animationDuration={1500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

