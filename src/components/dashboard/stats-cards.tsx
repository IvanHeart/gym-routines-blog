import { BarChart3, BookOpen, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DashboardStats } from '@/dal/dashboard.dal'

interface StatsCardsProps {
  stats: DashboardStats
}

const STATS = (stats: DashboardStats) => [
  {
    label: 'Total rutinas',
    value: stats.totalRoutines,
    icon: BookOpen,
    description: `${stats.totalPublished} publicadas`,
  },
  {
    label: 'Publicadas',
    value: stats.totalPublished,
    icon: BarChart3,
    description: `${stats.totalRoutines - stats.totalPublished} borradores`,
  },
  {
    label: 'Vistas totales',
    value: stats.totalViews.toLocaleString('es'),
    icon: Eye,
    description: 'En todas tus rutinas',
  },
]

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STATS(stats).map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <stat.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
