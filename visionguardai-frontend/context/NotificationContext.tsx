'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { Notification, NotificationMessage, WebSocketMessage } from '@/types'
import { useAuth } from './AuthContext'

interface NotificationContextType {
  currentNotification: Notification | null
  notificationHistory: Notification[]
  unreadCount: number
  isConnected: boolean
  clearNotification: () => void
  markAsRead: (notificationId: string) => void
  clearAll: () => void
  sendMessage: (message: any) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth()
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (!user || !accessToken) {
      console.log('[NotificationWS] No user or token available')
      return
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    try {
      const wsUrl = `${WS_BASE_URL}/ws/alerts/${user.id}?token=${accessToken}`
      console.log('[NotificationWS] Connecting to:', wsUrl)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[NotificationWS] Connected successfully')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('[NotificationWS] Message received:', message.type)

          if (message.type === 'notification') {
            const notifMessage = message as NotificationMessage
            const notification = notifMessage.data

            console.log('[NotificationWS] Notification:', notification.title, notification.priority)

            // Add to history
            setNotificationHistory((prev) => [notification, ...prev].slice(0, 50)) // Keep last 50
            setUnreadCount((prev) => prev + 1)

            // Show as current notification based on priority
            // High/Critical priority interrupts current notification
            if (
              notification.priority === 'critical' ||
              notification.priority === 'high' ||
              !currentNotification
            ) {
              setCurrentNotification(notification)
            }

            // Play notification sound for high/critical
            if (notification.priority === 'critical' || notification.priority === 'high') {
              playNotificationSound()
            }
          } else if (message.type === 'ping') {
            // Respond to ping with pong
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }))
            console.log('[NotificationWS] Responded to ping')
          } else if (message.type === 'pong') {
            console.log('[NotificationWS] Received pong')
          }
        } catch (error) {
          console.error('[NotificationWS] Error parsing message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[NotificationWS] WebSocket error:', error)
      }

      ws.onclose = (event) => {
        console.log('[NotificationWS] Disconnected:', event.code, event.reason)
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`[NotificationWS] Reconnecting in ${delay}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      }
    } catch (error) {
      console.error('[NotificationWS] Connection error:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('[NotificationWS] Error playing sound:', error)
    }
  }

  const clearNotification = () => {
    setCurrentNotification(null)
  }

  const markAsRead = (notificationId: string) => {
    setNotificationHistory((prev) =>
      prev.map((notif) =>
        notif.notification_id === notificationId ? { ...notif, read: true } : notif
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const clearAll = () => {
    setNotificationHistory([])
    setUnreadCount(0)
    setCurrentNotification(null)
  }

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      console.log('[NotificationWS] Sent message:', message.type)
    } else {
      console.warn('[NotificationWS] Cannot send message - WebSocket not connected')
    }
  }

  useEffect(() => {
    if (user && accessToken) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [user, accessToken])

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected || !wsRef.current) return

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }))
      }
    }, 30000) // Send ping every 30 seconds

    return () => clearInterval(interval)
  }, [isConnected])

  return (
    <NotificationContext.Provider
      value={{
        currentNotification,
        notificationHistory,
        unreadCount,
        isConnected,
        clearNotification,
        markAsRead,
        clearAll,
        sendMessage,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
