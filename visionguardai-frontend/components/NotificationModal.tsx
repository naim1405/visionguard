'use client'

import React, { useState, useEffect } from 'react'
import { Notification, NotificationPriority, NotificationType } from '@/types'
import { useRouter } from 'next/navigation'

interface NotificationModalProps {
  notification: Notification | null
  onClose: () => void
}

export default function NotificationModal({ notification, onClose }: NotificationModalProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (notification) {
      setIsVisible(true)
      setIsExiting(false)
    }
  }, [notification])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300)
  }

  const handleAction = () => {
    if (notification?.action_url) {
      router.push(notification.action_url)
    }
    handleClose()
  }

  if (!notification || !isVisible) return null

  // Priority-based styling
  const getPriorityStyles = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700',
        }
      case 'high':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-500',
          icon: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700',
        }
      case 'medium':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
        }
      case 'low':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-500',
          icon: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700',
        }
    }
  }

  // Type-based icons
  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'info':
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const styles = getPriorityStyles(notification.priority)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
          isExiting ? 'opacity-0' : 'opacity-50'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className={`${styles.bg} border-l-4 ${styles.border} rounded-lg shadow-2xl max-w-md w-full transform transition-all duration-300 ${
            isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start p-6 pb-4">
            <div className={`flex-shrink-0 ${styles.icon}`}>
              {getTypeIcon(notification.type)}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {notification.title}
                  </h3>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white/50">
                    {notification.priority.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pb-4">
            <p className="text-gray-700 leading-relaxed">
              {notification.title?.includes('OWL EYE') || notification.title?.includes('Owl Eye') 
                ? 'Unauthorized person(s) detected on premises'
                : notification.message}
            </p>

            {/* Metadata */}
            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <div className="mt-3 p-3 bg-white/50 rounded text-sm">
                <p className="font-medium text-gray-700 mb-1">Details:</p>
                {Object.entries(notification.metadata)
                  .filter(([key]) => {
                    // For Owl Eye alerts, only show timestamp and shop_id
                    if (notification.title?.includes('OWL EYE') || notification.title?.includes('Owl Eye')) {
                      return key === 'timestamp' || key === 'shop_id'
                    }
                    return true
                  })
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between py-0.5">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-gray-900 font-medium">{String(value)}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Timestamp */}
            <p className="mt-3 text-xs text-gray-500">
              {new Date(notification.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6">
            {notification.action_url && (
              <button
                onClick={handleAction}
                className={`flex-1 px-4 py-2 ${styles.button} text-white font-medium rounded-lg transition-colors`}
              >
                View Details
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
