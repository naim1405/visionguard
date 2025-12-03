'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, X, Eye, MapPin, Calendar, RefreshCw, Loader2 } from 'lucide-react'
import { anomalyService, Anomaly } from '@/lib/services/anomalyService'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'

export default function SuspiciousActivity() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const anomalyIdParam = searchParams.get('anomaly_id')
  
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedActivity, setSelectedActivity] = useState<Anomaly | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

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

  // Fetch anomalies and stats
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch anomalies
      const anomalyData = await anomalyService.getAnomalies({
        limit: 100,
        offset: 0
      })
      setAnomalies(anomalyData.anomalies)
      
      // Fetch stats
      const statsData = await anomalyService.getAnomalyStats()
      setStats(statsData)
      
      // If anomaly_id is in URL, fetch and show that anomaly
      if (anomalyIdParam) {
        const anomaly = await anomalyService.getAnomalyById(anomalyIdParam)
        setSelectedActivity(anomaly)
      }
    } catch (err: any) {
      console.error('Error fetching anomalies:', err)
      setError(err.response?.data?.detail || 'Failed to load anomalies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, anomalyIdParam])

  // Update anomaly status
  const updateAnomalyStatus = async (anomalyId: string, status: Anomaly['status'], notes?: string) => {
    try {
      setUpdating(anomalyId)
      await anomalyService.updateAnomaly(anomalyId, { status, notes })
      
      // Refresh data
      await fetchData()
      
      // Close modal if open
      if (selectedActivity?.id === anomalyId) {
        setSelectedActivity(null)
      }
    } catch (err: any) {
      console.error('Error updating anomaly:', err)
      alert(err.response?.data?.detail || 'Failed to update anomaly')
    } finally {
      setUpdating(null)
    }
  }

  const filteredActivities = anomalies.filter(
    (activity) => filterStatus === 'all' || activity.status === filterStatus
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return theme === 'dark'
          ? 'text-red-400 bg-red-500/20 border-red-500/30'
          : 'text-red-700 bg-red-500/20 border-red-500/30'
      case 'medium':
        return theme === 'dark'
          ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
          : 'text-yellow-700 bg-yellow-500/20 border-yellow-500/30'
      case 'low':
        return theme === 'dark'
          ? 'text-blue-400 bg-blue-500/20 border-blue-500/30'
          : 'text-blue-700 bg-blue-500/20 border-blue-500/30'
      default:
        return theme === 'dark'
          ? 'text-slate-400 bg-slate-500/20 border-slate-500/30'
          : 'text-slate-700 bg-slate-500/20 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <CheckCircle
            size={16}
            className={theme === 'dark' ? 'text-green-400' : 'text-green-700'}
          />
        )
      case 'pending':
        return (
          <Clock size={16} className={theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'} />
        )
      case 'acknowledged':
        return (
          <Eye size={16} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-700'} />
        )
      case 'false_positive':
        return <X size={16} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-700'} />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
          Please log in to view suspicious activities
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
            >
              Suspicious Activity
            </h1>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
              Review and manage detected suspicious activities
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
        >
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Stats Bar */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <div
            className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-slate-900/50 border-slate-800/50' : 'bg-white border-gray-300'
            }`}
          >
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
              Total
            </p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {stats.total}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'}`}>
              Pending
            </p>
            <p
              className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'
              }`}
            >
              {stats.by_status.pending}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
              Acknowledged
            </p>
            <p
              className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
              }`}
            >
              {stats.by_status.acknowledged}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
              Resolved
            </p>
            <p
              className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-green-400' : 'text-green-700'
              }`}
            >
              {stats.by_status.resolved}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-500/10 border border-slate-500/30">
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>
              False Positive
            </p>
            <p
              className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-700'
              }`}
            >
              {stats.by_status.false_positive}
            </p>
          </div>
        </motion.div>
      )}

      {/* Filter Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2"
      >
        {['all', 'pending', 'acknowledged', 'resolved', 'false_positive'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${
                filterStatus === status
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                  : theme === 'dark'
                  ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            {status === 'false_positive' ? 'False Positive' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={`animate-spin ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} size={48} />
        </div>
      )}

      {/* Activity List */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
        {filteredActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className={`rounded-xl border backdrop-blur-sm p-5 transition-all duration-200 ${
              theme === 'dark'
                ? 'border-slate-800/50 bg-slate-900/50 hover:bg-slate-800/50'
                : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <AlertTriangle
                      size={24}
                      className={
                        activity.severity === 'critical' || activity.severity === 'high'
                          ? 'text-red-400'
                          : activity.severity === 'medium'
                          ? 'text-yellow-400'
                          : 'text-blue-400'
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-semibold mb-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {activity.description}
                    </h3>
                    <div
                      className={`flex flex-wrap gap-3 text-sm ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(activity.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{activity.location}</span>
                      </div>
                      {activity.confidence_score && (
                        <div className="flex items-center gap-1">
                          <span>Confidence: {(activity.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Severity Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                    activity.severity
                  )}`}
                >
                  {activity.severity.toUpperCase()}
                </span>

                {/* Status Badge */}
                <span
                  className={`
                  flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border
                  ${
                    activity.status === 'resolved'
                      ? `bg-green-500/20 border-green-500/30 ${
                          theme === 'dark' ? 'text-green-400' : 'text-green-700'
                        }`
                      : ''
                  }
                  ${
                    activity.status === 'pending'
                      ? `bg-yellow-500/20 border-yellow-500/30 ${
                          theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'
                        }`
                      : ''
                  }
                  ${
                    activity.status === 'acknowledged'
                      ? `bg-blue-500/20 border-blue-500/30 ${
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
                        }`
                      : ''
                  }
                  ${
                    activity.status === 'false_positive'
                      ? `bg-slate-500/20 border-slate-500/30 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-700'
                        }`
                      : ''
                  }
                `}
                >
                  {getStatusIcon(activity.status)}
                  <span className="capitalize">{activity.status.replace('_', ' ')}</span>
                </span>

                {/* View Button */}
                <button
                  onClick={() => setSelectedActivity(activity)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 transition-all duration-200 ${
                    theme === 'dark' ? 'text-teal-400' : 'text-teal-700'
                  }`}
                >
                  <Eye size={16} />
                  <span className="hidden sm:inline">View Details</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredActivities.length === 0 && !loading && (
          <div
            className={`text-center py-12 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}
          >
            <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No {filterStatus !== 'all' ? filterStatus.replace('_', ' ') : ''} activities found</p>
          </div>
        )}
      </motion.div>
    )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-xl border max-w-2xl w-full shadow-2xl max-h-[85vh] flex flex-col ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-300'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-6 pb-4 flex-shrink-0">
                <h2
                  className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Activity Details
                </h2>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 px-6 pb-6 overflow-y-auto flex-1">
                {/* Image */}
                {selectedActivity.image_url ? (
                  <div className="aspect-video rounded-lg overflow-hidden border relative">
                    <Image
                      src={anomalyService.getFrameImageUrl(selectedActivity.image_url) || ''}
                      alt="Anomaly frame"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className={`aspect-video rounded-lg flex items-center justify-center border ${
                      theme === 'dark'
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <Eye
                        size={48}
                        className={`mx-auto mb-2 ${
                          theme === 'dark' ? 'text-slate-700' : 'text-gray-400'
                        }`}
                      />
                      <p className={theme === 'dark' ? 'text-slate-600' : 'text-gray-500'}>
                        No image available
                      </p>
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
                    }`}
                  >
                    <p
                      className={`text-sm mb-1 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                      }`}
                    >
                      Timestamp
                    </p>
                    <p
                      className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    >
                      {formatDate(selectedActivity.timestamp)}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
                    }`}
                  >
                    <p
                      className={`text-sm mb-1 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                      }`}
                    >
                      Location
                    </p>
                    <p
                      className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    >
                      {selectedActivity.location}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
                    }`}
                  >
                    <p
                      className={`text-sm mb-1 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                      }`}
                    >
                      Severity
                    </p>
                    <p
                      className={`font-medium capitalize ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {selectedActivity.severity}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
                    }`}
                  >
                    <p
                      className={`text-sm mb-1 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                      }`}
                    >
                      Status
                    </p>
                    <p
                      className={`font-medium capitalize ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {selectedActivity.status.replace('_', ' ')}
                    </p>
                  </div>
                  {selectedActivity.confidence_score && (
                    <div
                      className={`p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
                      }`}
                    >
                      <p
                        className={`text-sm mb-1 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                        }`}
                      >
                        Confidence
                      </p>
                      <p
                        className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {(selectedActivity.confidence_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {selectedActivity.extra_data?.person_id && (
                    <div
                      className={`p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
                      }`}
                    >
                      <p
                        className={`text-sm mb-1 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                        }`}
                      >
                        Person ID
                      </p>
                      <p
                        className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {selectedActivity.extra_data.person_id}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className={`p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
                  }`}
                >
                  <p
                    className={`text-sm mb-2 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                    }`}
                  >
                    Description
                  </p>
                  <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                    {selectedActivity.description}
                  </p>
                </div>

                {selectedActivity.notes && (
                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
                    }`}
                  >
                    <p
                      className={`text-sm mb-2 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                      }`}
                    >
                      Notes
                    </p>
                    <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      {selectedActivity.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedActivity.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => updateAnomalyStatus(selectedActivity.id, 'acknowledged')}
                      disabled={updating === selectedActivity.id}
                      className="flex-1 px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updating === selectedActivity.id && <Loader2 className="animate-spin" size={16} />}
                      Acknowledge
                    </button>
                    <button
                      onClick={() => updateAnomalyStatus(selectedActivity.id, 'resolved', 'Verified and resolved')}
                      disabled={updating === selectedActivity.id}
                      className="flex-1 px-4 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updating === selectedActivity.id && <Loader2 className="animate-spin" size={16} />}
                      Resolve
                    </button>
                    <button
                      onClick={() => updateAnomalyStatus(selectedActivity.id, 'false_positive', 'Marked as false positive')}
                      disabled={updating === selectedActivity.id}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        theme === 'dark'
                          ? 'bg-slate-700 hover:bg-slate-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      {updating === selectedActivity.id && <Loader2 className="animate-spin" size={16} />}
                      False Positive
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
