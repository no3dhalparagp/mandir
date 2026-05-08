"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatINR } from "@/lib/utils"
import { TrendingUp, Users, Gift, Flame, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: number
  isLoading?: boolean
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
            {trend && (
              <>
                {" "}
                <span className={trend > 0 ? "text-green-600" : "text-red-600"}>
                  {trend > 0 ? "+" : ""}{trend}%
                </span>
              </>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  stats: {
    totalDonations: number
    totalDevotees: number
    activePujas: number
    monthlyRevenue: number
    pendingRequests: number
    loading?: boolean
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Donations"
        value={formatINR(stats.totalDonations)}
        description="Lifetime donations"
        icon={<Gift className="h-4 w-4 text-blue-600" />}
        isLoading={stats.loading}
      />
      <StatCard
        title="Active Members"
        value={stats.totalDevotees}
        description="Registered devotees"
        icon={<Users className="h-4 w-4 text-green-600" />}
        isLoading={stats.loading}
      />
      <StatCard
        title="Active Pujas"
        value={stats.activePujas}
        description="Ongoing requests"
        icon={<Flame className="h-4 w-4 text-orange-600" />}
        isLoading={stats.loading}
      />
      <StatCard
        title="Monthly Revenue"
        value={formatINR(stats.monthlyRevenue)}
        description="This month"
        icon={<TrendingUp className="h-4 w-4 text-purple-600" />}
        isLoading={stats.loading}
      />
      <StatCard
        title="Pending Items"
        value={stats.pendingRequests}
        description="Action required"
        icon={<AlertCircle className="h-4 w-4 text-red-600" />}
        isLoading={stats.loading}
      />
    </div>
  )
}
