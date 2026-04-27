import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts'

interface CategorySummary {
  category: string
  totalIn: number
  totalOut: number
}

interface CategorySummaryChartProps {
  data: CategorySummary[]
  isLoading?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  SALES: 'Ventes',
  COGS: 'Coûts de vente',
  PAYROLL: 'Salaires',
  RENT_UTILITIES: 'Loyer/Services',
  TRANSPORT: 'Transport',
  TAX: 'Impôts',
  DEBT_SERVICE: 'Dette',
  CAPEX: 'Investissements',
  OWNER_DRAW: 'Prélèvements',
  FEES: 'Frais',
  MARKETING: 'Marketing',
  OTHER: 'Autre'
}

export const CategorySummaryChart: React.FC<CategorySummaryChartProps> = ({ data, isLoading }) => {
  const formattedData = data.map(item => ({
    ...item,
    name: CATEGORY_LABELS[item.category] || item.category,
    net: item.totalIn - item.totalOut
  })).sort((a, b) => Math.abs(b.net) - Math.abs(a.net))

  if (isLoading) {
    return <div className="h-[300px] w-full flex items-center justify-center bg-white/5 animate-pulse rounded-xl" />
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground italic border border-dashed border-white/10 rounded-xl">
        Aucune donnée catégorisée disponible
      </div>
    )
  }

  return (
    <div className="h-[350px] w-full py-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />
          <XAxis 
            type="number" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#888888' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#888888', textAnchor: 'end' }} 
            width={60}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
            formatter={(value: number) => [new Intl.NumberFormat('fr-FR').format(value) + ' CFA', 'Total (abs)']}
            labelStyle={{ color: '#888' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="totalIn" name="Entrant" fill="#41db8d" radius={[0, 4, 4, 0]} barSize={10} />
          <Bar dataKey="totalOut" name="Sortant" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
