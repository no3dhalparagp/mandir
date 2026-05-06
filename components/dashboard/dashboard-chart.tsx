"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ChartData {
  name: string
  income: number
  expense: number
}

export function DashboardChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-xs" />
        <YAxis className="text-xs" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, undefined]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Legend />
        <Bar dataKey="income" name="Income" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
