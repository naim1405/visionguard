'use client'

import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartProps {
  data: Array<{ name: string; value: number }>
  title: string
  theme?: 'dark' | 'light'
}

export default function Chart({ data, title, theme = 'dark' }: ChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`rounded-xl border backdrop-blur-sm p-6 ${
        theme === 'dark' ? 'border-slate-800/50 bg-slate-900/50' : 'border-gray-300 bg-white'
      }`}
    >
      <h3
        className={`text-lg font-semibold mb-6 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}
      >
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#d1d5db'} />
          <XAxis
            dataKey="name"
            stroke={theme === 'dark' ? '#94a3b8' : '#6b7280'}
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#6b7280'} style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
              border: theme === 'dark' ? '1px solid #334155' : '1px solid #d1d5db',
              borderRadius: '8px',
              color: theme === 'dark' ? '#fff' : '#1f2937',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#14b8a6"
            strokeWidth={3}
            dot={{ fill: '#14b8a6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
