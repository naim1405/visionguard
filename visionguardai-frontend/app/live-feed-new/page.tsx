'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { streamService } from '@/lib/services/streamService'
import ProtectedRoute from '@/components/ProtectedRoute'
import AnomalyAlerts from '@/components/AnomalyAlerts'
import { Video, VideoOff, AlertCircle, Camera } from 'lucide-react'

function LiveFeedContent() {
  const searchParams = useSearchParams()
  const shopId = searchParams.get('shopId')
  
  const { user, accessToken } = useAuth()
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamId, setStreamId] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopStream()
    }
  }, [])

  const startStream = async () => {
    if (!user || !accessToken) {
      setError('Authentication required')
      return
    }

    try {
      setError(null)
      
      // Get user media (camera)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      })

      localStreamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      })

      peerConnectionRef.current = pc

      // Add video tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Create and send offer to backend
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Validate shop_id
      if (!shopId) {
        throw new Error('Shop ID is required. Please provide shopId in URL params.')
      }

      // Send offer to backend with authentication
      const answer = await streamService.sendOffer({
        sdp: offer.sdp,
        type: offer.type,
        user_id: user.id,
        shop_id: shopId,
        stream_metadata: {
          stream_name: 'Live CCTV Feed',
          camera_id: 'cam-001',
          location: shopId ? `Shop ${shopId}` : 'General',
        },
      })

      setStreamId(answer.stream_id)

      // Set remote description (answer from server)
      await pc.setRemoteDescription(
        new RTCSessionDescription({
          sdp: answer.sdp,
          type: answer.type,
        })
      )

      setIsStreaming(true)
      console.log('WebRTC connection established, Stream ID:', answer.stream_id)
    } catch (err: any) {
      console.error('Stream error:', err)
      setError(err.message || 'Failed to start stream')
      stopStream()
    }
  }

  const stopStream = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    setStreamId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live CCTV Feed</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Real-time video monitoring with AI-powered anomaly detection
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Stream */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
            {/* Stream Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Camera Feed
                </h3>
                {streamId && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-mono">
                    {streamId}
                  </span>
                )}
              </div>
              
              {isStreaming ? (
                <span className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  Offline
                </span>
              )}
            </div>

            {/* Video Container */}
            <div className="relative bg-gray-900 aspect-video">
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 backdrop-blur-sm">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Stream Error
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />

              {!isStreaming && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <VideoOff className="w-16 h-16 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Camera feed is not active
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isStreaming ? (
                    <button
                      onClick={stopStream}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <VideoOff className="w-4 h-4" />
                      Stop Stream
                    </button>
                  ) : (
                    <button
                      onClick={startStream}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30 transition-all"
                    >
                      <Video className="w-4 h-4" />
                      Start Stream
                    </button>
                  )}
                </div>

                {shopId && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Shop ID: <span className="font-mono">{shopId}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Streaming as: {user?.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {user?.email} • {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly Alerts Sidebar */}
        <div className="lg:col-span-1">
          <AnomalyAlerts />
        </div>
      </div>
    </div>
  )
}

export default function LiveFeedPage() {
  return (
    <ProtectedRoute>
      <LiveFeedContent />
    </ProtectedRoute>
  )
}
