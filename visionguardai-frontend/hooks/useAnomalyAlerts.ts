'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AnomalyAlert, WebSocketMessage } from '@/types'

const MAX_RECONNECT_DELAY = 30000 // 30 seconds max delay
const INITIAL_RECONNECT_DELAY = 1000 // 1 second initial delay
const HEARTBEAT_INTERVAL = 30000 // 30 seconds - match backend ping interval
const HEARTBEAT_TIMEOUT = 60000 // 60 seconds - close connection if no response

export function useAnomalyAlerts() {
  const { user, accessToken } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([])
  const [connected, setConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY)
  const reconnectAttemptsRef = useRef<number>(0)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout>()
  const lastHeartbeatRef = useRef<number>(Date.now())
  const isConnectingRef = useRef<boolean>(false)

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

  const clearHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = undefined
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = undefined
    }
  }

  const startHeartbeat = (ws: WebSocket) => {
    clearHeartbeat()

    // Send ping to server periodically
    heartbeatIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('[WS] Sending ping to server')
        ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }))

        // Set timeout to check if we receive pong
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current)
        }

        heartbeatTimeoutRef.current = setTimeout(() => {
          const timeSinceLastBeat = Date.now() - lastHeartbeatRef.current
          if (timeSinceLastBeat > HEARTBEAT_TIMEOUT) {
            console.warn('[WS] No heartbeat response, closing connection')
            ws.close(1000, 'Heartbeat timeout')
          }
        }, HEARTBEAT_TIMEOUT)
      }
    }, HEARTBEAT_INTERVAL)
  }

  const updateHeartbeat = () => {
    lastHeartbeatRef.current = Date.now()
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = undefined
    }
  }

  useEffect(() => {
    if (!user || !accessToken) return

    const connect = () => {
      // Prevent multiple simultaneous connection attempts
      if (isConnectingRef.current) {
        console.log('[WS] Connection attempt already in progress')
        return
      }

      try {
        isConnectingRef.current = true
        console.log(`[WS] Connecting... (attempt ${reconnectAttemptsRef.current + 1})`)

        // Connect to WebSocket with authentication
        const ws = new WebSocket(`${WS_URL}/ws/alerts/${user.id}?token=${accessToken}`)

        ws.onopen = () => {
          console.log('[WS] WebSocket connected successfully')
          setConnected(true)
          isConnectingRef.current = false
          
          // Reset reconnection parameters on successful connection
          reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
          reconnectAttemptsRef.current = 0
          
          // Start heartbeat monitoring
          lastHeartbeatRef.current = Date.now()
          startHeartbeat(ws)
        }

        ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data)

            // Handle different message types
            if (data.type === 'ping') {
              // Server sent ping, respond with pong
              console.log('[WS] Received ping from server, sending pong')
              updateHeartbeat()
              ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }))
            } else if (data.type === 'pong') {
              // Server responded to our ping
              console.log('[WS] Received pong from server')
              updateHeartbeat()
            } else if (data.type === 'anomaly_detected') {
              console.log('[WS] Anomaly detected:', data)
              updateHeartbeat()

              // Add to alerts list
              setAlerts((prev) => [
                {
                  id: Date.now(),
                  stream_id: data.stream_id || 'unknown',
                  person_id: data.result?.person_id || 0,
                  timestamp: new Date().toISOString(),
                  frame: data.annotated_frame,
                  details: {
                    status: data.result?.status || 'unknown',
                  },
                },
                ...prev.slice(0, 49), // Keep last 50 alerts
              ])

              // Send acknowledgment
              ws.send(
                JSON.stringify({
                  type: 'ack',
                  stream_id: data.stream_id,
                })
              )
            }
          } catch (error) {
            console.error('[WS] Error parsing WebSocket message:', error)
          }
        }

        ws.onerror = (error) => {
          console.error('[WS] WebSocket error:', error)
          isConnectingRef.current = false
        }

        ws.onclose = (event) => {
          console.log(`[WS] WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`)
          setConnected(false)
          isConnectingRef.current = false
          clearHeartbeat()

          // Attempt to reconnect with exponential backoff
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(
            reconnectDelayRef.current * Math.pow(1.5, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY
          )

          console.log(`[WS] Attempting to reconnect in ${delay / 1000} seconds...`)
          reconnectAttemptsRef.current += 1

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }

        wsRef.current = ws
      } catch (error) {
        console.error('[WS] Failed to create WebSocket connection:', error)
        isConnectingRef.current = false
        
        // Retry connection after delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        
        const delay = Math.min(
          reconnectDelayRef.current * Math.pow(1.5, reconnectAttemptsRef.current),
          MAX_RECONNECT_DELAY
        )
        
        reconnectAttemptsRef.current += 1
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    }

    connect()

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      clearHeartbeat()
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounting')
      }
    }
  }, [user, accessToken, WS_URL])

  const clearAlerts = () => {
    setAlerts([])
  }

  const removeAlert = (id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }

  return { alerts, connected, clearAlerts, removeAlert }
}
