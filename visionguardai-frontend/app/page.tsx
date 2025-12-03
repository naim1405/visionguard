'use client'

import { motion } from 'framer-motion'
import { Activity, Camera, Target, AlertCircle, CheckCircle, Clock, Store } from 'lucide-react'
import StatCard from '@/components/StatCard'
import Chart from '@/components/Chart'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useShops } from '@/context/ShopContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Mock data for anomalies chart
const anomalyData = [
  { name: 'Mon', value: 12 },
  { name: 'Tue', value: 19 },
  { name: 'Wed', value: 8 },
  { name: 'Thu', value: 25 },
  { name: 'Fri', value: 15 },
  { name: 'Sat', value: 22 },
  { name: 'Sun', value: 10 },
]

// Mock data for recent alerts
const recentAlerts = [
  {
    id: 1,
    time: '10:45 AM',
    location: 'Camera 1 - Main Entrance',
    type: 'Suspicious Movement',
    status: 'verified',
  },
  {
    id: 2,
    time: '09:32 AM',
    location: 'Camera 3 - Parking Lot',
    type: 'Unidentified Object',
    status: 'pending',
  },
  {
    id: 3,
    time: '08:15 AM',
    location: 'Camera 2 - Storage Area',
    type: 'Unauthorized Access',
    status: 'verified',
  },
  {
    id: 4,
    time: '07:50 AM',
    location: 'Camera 4 - Side Entrance',
    type: 'Motion Detected',
    status: 'false-positive',
  },
]

function Dashboard() {
  const systemOnline = true
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const { user, isOwner } = useAuth()
  const { shops, hasSingleShop, loading: shopsLoading } = useShops()
  const router = useRouter()

  // Listen for theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
    }
    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  // Auto-redirect owner with single shop to live feed
  useEffect(() => {
    if (!shopsLoading && isOwner && hasSingleShop && shops.length === 1) {
      // Delay redirect slightly to avoid jarring UX
      const timer = setTimeout(() => {
        router.push('/live-feed')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [shopsLoading, isOwner, hasSingleShop, shops, router])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1
          className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
        >
          Dashboard
        </h1>
        <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
          Welcome back, {user?.name || 'User'}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Anomalies"
          value="111"
          icon={Activity}
          trend="12% from last week"
          trendUp={true}
          color="teal"
        />
        <StatCard
          title="Active Cameras"
          value="4"
          icon={Camera}
          trend="All operational"
          trendUp={true}
          color="purple"
        />
        <StatCard
          title="Detection Accuracy"
          value="94.2%"
          icon={Target}
          trend="2.1% improvement"
          trendUp={true}
          color="blue"
        />
        <StatCard
          title="Pending Alerts"
          value="3"
          icon={AlertCircle}
          trend="5 resolved today"
          trendUp={false}
          color="orange"
        />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Chart data={anomalyData} title="Anomalies Detected This Week" theme={theme} />
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`rounded-xl border backdrop-blur-sm p-6 ${
            theme === 'dark' ? 'border-slate-800/50 bg-slate-900/50' : 'border-gray-300 bg-white'
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            System Status
          </h3>

          <div className="space-y-4">
            <div
              className={`flex items-center justify-between p-3 rounded-lg ${
                theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    systemOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span
                  className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}
                >
                  AI Service
                </span>
              </div>
              <span
                className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-700'
                }`}
              >
                {systemOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div
              className={`flex items-center justify-between p-3 rounded-lg ${
                theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span
                  className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}
                >
                  Backend API
                </span>
              </div>
              <span
                className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-700'
                }`}
              >
                Online
              </span>
            </div>

            <div
              className={`flex items-center justify-between p-3 rounded-lg ${
                theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span
                  className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}
                >
                  Database
                </span>
              </div>
              <span
                className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-700'
                }`}
              >
                Online
              </span>
            </div>

            <div
              className={`flex items-center justify-between p-3 rounded-lg ${
                theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                <span
                  className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}
                >
                  Storage
                </span>
              </div>
              <span
                className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'
                }`}
              >
                78% Used
              </span>
            </div>
          </div>

          <div
            className={`mt-6 pt-4 border-t ${
              theme === 'dark' ? 'border-slate-800/50' : 'border-gray-300'
            }`}
          >
            <div
              className={`text-xs space-y-1 ${
                theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
              }`}
            >
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
                  Just now
                </span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>99.8%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Alerts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className={`rounded-xl border backdrop-blur-sm p-6 ${
          theme === 'dark' ? 'border-slate-800/50 bg-slate-900/50' : 'border-gray-300 bg-white'
        }`}
      >
        <h3
          className={`text-lg font-semibold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          Recent Alerts
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`border-b ${theme === 'dark' ? 'border-slate-800' : 'border-gray-300'}`}
              >
                <th
                  className={`text-left py-3 px-4 text-sm font-medium ${
                    theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                  }`}
                >
                  Time
                </th>
                <th
                  className={`text-left py-3 px-4 text-sm font-medium ${
                    theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                  }`}
                >
                  Location
                </th>
                <th
                  className={`text-left py-3 px-4 text-sm font-medium ${
                    theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                  }`}
                >
                  Type
                </th>
                <th
                  className={`text-left py-3 px-4 text-sm font-medium ${
                    theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                  }`}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={`border-b transition-colors ${
                    theme === 'dark'
                      ? 'border-slate-800/50 hover:bg-slate-800/30'
                      : 'border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Clock
                        size={14}
                        className={theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}
                      />
                      <span
                        className={`text-sm ${
                          theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                        }`}
                      >
                        {alert.time}
                      </span>
                    </div>
                  </td>
                  <td
                    className={`py-3 px-4 text-sm ${
                      theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                    }`}
                  >
                    {alert.location}
                  </td>
                  <td
                    className={`py-3 px-4 text-sm ${
                      theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                    }`}
                  >
                    {alert.type}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`
                        inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                        ${
                          alert.status === 'verified'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                            : ''
                        }
                        ${
                          alert.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                            : ''
                        }
                        ${
                          alert.status === 'false-positive'
                            ? 'bg-slate-500/20 text-slate-700 dark:text-slate-400'
                            : ''
                        }
                      `}
                    >
                      {alert.status === 'verified' && <CheckCircle size={12} />}
                      {alert.status === 'pending' && <Clock size={12} />}
                      {alert.status === 'false-positive' && <AlertCircle size={12} />}
                      <span className="capitalize">{alert.status.replace('-', ' ')}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

function DashboardPageWrapper() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}

export default DashboardPageWrapper
