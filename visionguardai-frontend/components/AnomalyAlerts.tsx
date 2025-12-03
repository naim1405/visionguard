'use client'

import React from 'react'
import { useAnomalyAlerts } from '@/hooks/useAnomalyAlerts'
import { AlertTriangle, X, CheckCircle } from 'lucide-react'

export default function AnomalyAlerts() {
  const { alerts, connected, clearAlerts, removeAlert } = useAnomalyAlerts()

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Anomaly Alerts
          </h3>
          <span
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              connected
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={clearAlerts}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 dark:text-green-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No anomalies detected</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              System is monitoring for suspicious activity
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-semibold">
                        Alert
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700 dark:text-gray-300">
                        Stream: <span className="font-mono">{alert.stream_id}</span>
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        Status:{' '}
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {alert.details.status}
                        </span>
                      </p>
                    </div>

                    {alert.frame && (
                      <div className="mt-3">
                        <img
                          src={`data:image/jpeg;base64,${alert.frame}`}
                          alt="Anomaly detection frame"
                          className="rounded-lg border border-gray-200 dark:border-slate-600 max-w-full h-auto"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
