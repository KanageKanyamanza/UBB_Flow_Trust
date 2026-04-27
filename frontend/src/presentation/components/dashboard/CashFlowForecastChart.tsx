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
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  // Split data for historical vs forecast
  const historicalData = formattedData.map(d => ({
    ...d,
    balanceHistorical: d.isForecast ? null : d.balance,
    balanceForecast: !d.isForecast && d.date !== formattedData.find(p => p.isForecast)?.date ? null : d.balance
  }))

  // Find the point where they join to ensure continuity
  const joinPointIndex = formattedData.findIndex(d => d.isForecast)
  if (joinPointIndex > 0) {
    // Add the last historical point to the forecast data to connect them
    const joinPoint = formattedData[joinPointIndex - 1]
    // historicalData[joinPointIndex].balanceForecast = joinPoint.balance
  }

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
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
          
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
                // Filter to avoid duplicates (only show line data, not area data)
                const data = payload.filter(item => item.dataKey !== 'balance')
                if (data.length === 0) return null

                return (
                  <div className="bg-[#0c0c0c/90] border border-white/10 p-3 rounded-xl backdrop-blur-md shadow-2xl">
                    <p className="text-[#888] text-[11px] mb-2 font-medium">{label}</p>
                    {data.map((item, index) => (
                      <div key={index} className="flex flex-col gap-0.5">
                        <span className="text-white font-bold text-sm">
                          {new Intl.NumberFormat('fr-FR').format(Math.round(item.value as number))} CFA
                        </span>
                        <span className="text-[#888] text-[10px] uppercase tracking-wider font-semibold">
                          {item.dataKey === 'balanceHistorical' ? 'Solde Réel' : 'Solde Prévisionnel'}
                        </span>
                      </div>
                    ))}
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
            stroke="#ef444450" 
            strokeDasharray="3 3"
            label={{ 
              value: 'Zone de Danger', 
              position: 'top', 
              fill: '#ef4444', 
              fontSize: 10,
              fontWeight: 600,
              textAnchor: 'end',
              dx: -10
            }} 
          />

          {/* Separation line for today */}
          {formattedData.find(d => d.isForecast) && (
            <ReferenceLine 
              x={formattedData.find(d => d.isForecast)?.formattedDate} 
              stroke="#ffffff20" 
              strokeDasharray="5 5" 
              label={{ value: 'Aujourd\'hui', position: 'top', fill: '#888', fontSize: 10, offset: 10 }} 
            />
          )}

          <Area 
            type="monotone" 
            dataKey="balance" 
            fill="url(#colorForecast)" 
            stroke="none"
            activeDot={false}
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
          />
          
          {/* Forecast Line (Dashed) */}
          <Line 
            type="monotone" 
            dataKey="balanceForecast" 
            stroke="#41db8d" 
            strokeWidth={3}
            strokeDasharray="8 5"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: '#41db8d' }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
