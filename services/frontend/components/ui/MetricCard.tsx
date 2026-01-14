import React from 'react'
import { Card } from './Card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function MetricCard({ title, value, subtitle, icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-success-600' : 'text-error-600'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 p-3 bg-slate-100 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
