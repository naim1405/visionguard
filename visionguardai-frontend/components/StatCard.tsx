'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color?: 'teal' | 'purple' | 'blue' | 'orange'
}

const colorClasses = {
  teal: 'from-teal-500/20 to-teal-600/20 border-teal-500/30 text-teal-400',
  purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
  blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
  orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400',
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = 'teal',
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        relative overflow-hidden
        rounded-xl border backdrop-blur-sm
        bg-gradient-to-br ${colorClasses[color]}
        p-6 hover:scale-[1.02] transition-transform duration-200
      `}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-slate-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</h3>
            {trend && (
              <p
                className={`text-sm ${
                  trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trendUp ? '↑' : '↓'} {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
