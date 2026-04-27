import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DataPoint {
  date: string
  totalIn: number
  totalOut: number
  net: number
}

interface DailyBalanceChartProps {
  data: DataPoint[]
  isLoading?: boolean
}

export const DailyBalanceChart: React.FC<DailyBalanceChartProps> = ({ data, isLoading }) => {
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'dd MMM', { locale: fr })
  }))

  if (isLoading) {
    return <div className="h-[300px] w-full flex items-center justify-center bg-white/5 animate-pulse rounded-xl" />
  }

  return (
    <div className="h-[350px] w-full py-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#41db8d" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#41db8d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
          <XAxis 
            dataKey="formattedDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#888888' }} 
            minTickGap={30}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#888888' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
            formatter={(value: number) => [new Intl.NumberFormat('fr-FR').format(value) + ' CFA', 'Solde Net']}
            labelStyle={{ color: '#888' }}
          />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          <Area 
            type="monotone" 
            dataKey="net" 
            stroke="#41db8d" 
            fillOpacity={1} 
            fill="url(#colorNet)" 
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
