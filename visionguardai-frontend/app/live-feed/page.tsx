'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Video,
  VideoOff,
  Send,
  Wifi,
  WifiOff,
  Camera as CameraIcon,
  Plus,
  Maximize,
  PlayCircle,
  StopCircle,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { useShops } from '@/context/ShopContext'
import { streamService } from '@/lib/services/streamService'
import { shopService } from '@/lib/services/shopService'
import { Shop } from '@/types'
import { Eye, EyeOff } from 'lucide-react'

type StreamSource = {
  id: string
  type: 'webrtc' | 'file' | 'demo' | 'webcam' | 'camera'
  srcObject?: MediaStream
  url?: string
  name: string
  cameraUrl?: string
}

export default function LiveFeed() {
  const { user, accessToken, isManager } = useAuth()
  const { sendMessage, isConnected: wsConnected } = useNotifications()
  const { shops } = useShops()
  const searchParams = useSearchParams()
  const urlShopId = searchParams.get('shopId')
  
  // For managers, use their assigned shop ID; for owners, use URL param
  const [shopId, setShopId] = useState<string | null>(null)
  
  const [shop, setShop] = useState<Shop | null>(null)
  const [loadingShop, setLoadingShop] = useState(false)
  const [streams, setStreams] = useState<StreamSource[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected')
  const [statsInfo, setStatsInfo] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [personDetected, setPersonDetected] = useState(false)
  const [backendDetectionStatus, setBackendDetectionStatus] = useState<
    'inactive' | 'detecting' | 'person-found'
  >('inactive')

  // Owl Eye (Sentry Mode) state
  const [owlEyeActive, setOwlEyeActive] = useState(false)
  const owlEyeActiveRef = useRef(false)

  // Video ready state
  const [videosReady, setVideosReady] = useState(false)

  // Uploaded videos state
  const [areVideosPlaying, setAreVideosPlaying] = useState(false)

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // YOLO Detection state
  const [detectionModel, setDetectionModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [detectionActive, setDetectionActive] = useState(false)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({})
  const lastOwlEyeAlertRef = useRef<number>(0)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamIdRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const hasInitiatedConnection = useRef<boolean>(false) // Track if connection was initiated
  const loadedVideosRef = useRef<Set<string>>(new Set()) // Track which videos have loaded

  // Keep track of streams in a ref for cleanup
  const streamsRef = useRef<StreamSource[]>([])
  useEffect(() => {
    streamsRef.current = streams
  }, [streams])

  // Keep owlEyeActive in sync with ref
  useEffect(() => {
    owlEyeActiveRef.current = owlEyeActive
  }, [owlEyeActive])

  // Determine shop ID based on user role
  useEffect(() => {
    if (!user) return

    if (isManager) {
      // For managers, use their assigned shop (first shop in the list)
      if (shops.length > 0) {
        setShopId(shops[0].id)
      }
    } else {
      // For owners, use URL parameter
      setShopId(urlShopId)
    }
  }, [user, isManager, shops, urlShopId])

  // Check if all videos are ready
  const checkAllVideosReady = useCallback(() => {
    const totalVideos = streams.filter(s => s.type === 'file' || s.type === 'webrtc' || s.type === 'webcam').length
    if (totalVideos > 0 && loadedVideosRef.current.size === totalVideos) {
      console.log(`✅ All ${totalVideos} videos loaded and ready!`)
      setVideosReady(true)
    }
  }, [streams])

  // Handler for when a video's metadata is loaded
  const handleVideoLoaded = useCallback((streamId: string) => {
    loadedVideosRef.current.add(streamId)
    console.log(`📹 Video ${streamId} loaded (${loadedVideosRef.current.size} total)`)
    checkAllVideosReady()
  }, [checkAllVideosReady])

  // Load COCO-SSD model on mount
  useEffect(() => {
    const loadModel = async () => {
      setIsModelLoading(true)
      try {
        const model = await cocoSsd.load()
        setDetectionModel(model)
        console.log('COCO-SSD model loaded successfully')
      } catch (err) {
        console.error('Error loading detection model:', err)
        setError('Failed to load detection model')
      } finally {
        setIsModelLoading(false)
      }
    }
    loadModel()
  }, [])

  // Fetch shop data and load streams when shopId is available
  useEffect(() => {
    const fetchShopAndLoadStreams = async () => {
      if (!shopId || !user) return
      
      setLoadingShop(true)
      setVideosReady(false)
      loadedVideosRef.current.clear() // Reset loaded videos tracker
      try {
        const shopData = await shopService.getShop(shopId)
        setShop(shopData)
        
        // Load camera streams
        if (shopData.cameras && shopData.cameras.length > 0) {
          const cameraStreams: StreamSource[] = shopData.cameras.map((cameraUrl, index) => ({
            id: `camera-${index}`,
            type: 'file',
            url: cameraUrl,
            name: `Camera ${index + 1}`,
          }))
          setStreams(cameraStreams)
          console.log('📹 Camera streams loaded, waiting for videos to be ready...')
        }
      } catch (err) {
        console.error('Error fetching shop:', err)
        setError('Failed to load shop data')
      } finally {
        setLoadingShop(false)
      }
    }
    
    fetchShopAndLoadStreams()
  }, [shopId, user])

  // Establish WebRTC connection once videos are ready
  useEffect(() => {
    const connectWhenReady = async () => {
      if (videosReady && !isStreaming && !isConnecting && streams.length > 0) {
        console.log('✅ Videos ready! Establishing WebRTC connection...')
        await startWebRTC([])
      }
    }
    
    connectWhenReady()
  }, [videosReady, streams.length])

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

  // Auto-start detection when streams are available and model is loaded
  useEffect(() => {
    if (detectionModel && streams.length > 0 && !detectionActive) {
      startDetection()
    } else if (streams.length === 0 && detectionActive) {
      stopDetection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectionModel, streams.length, detectionActive])

  // Person detection function
  const detectPersons = async (
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ) => {
    if (!detectionModel || !videoElement) {
      return false
    }

    // Check if video has valid dimensions
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return false
    }

    try {
      const predictions = await detectionModel.detect(videoElement)
      const ctx = canvasElement.getContext('2d')

      if (!ctx) return false

      // Set canvas size to match video
      if (
        canvasElement.width !== videoElement.videoWidth ||
        canvasElement.height !== videoElement.videoHeight
      ) {
        canvasElement.width = videoElement.videoWidth
        canvasElement.height = videoElement.videoHeight
      }

      // Clear previous drawings
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

      let personDetected = false

      predictions.forEach((prediction) => {
        // Check if detected object is a person with confidence > 0.2
        if (prediction.class === 'person' && prediction.score > 0.1) {
          personDetected = true

          const [x, y, width, height] = prediction.bbox

          // Draw bounding box
          ctx.strokeStyle = '#00ff00'
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, width, height)

          // Draw label background
          ctx.fillStyle = '#00ff00'
          ctx.fillRect(x, y - 25, width, 25)

          // Draw label text
          ctx.fillStyle = '#000000'
          ctx.font = '16px Arial'
          ctx.fillText(`Person ${(prediction.score * 100).toFixed(1)}%`, x + 5, y - 7)
        }
      })

      return personDetected
    } catch (err) {
      console.error('Detection error:', err)
      return false
    }
  }

  // Start detection loop
  const startDetection = () => {
    if (!detectionModel) {
      setError('Detection model not loaded yet')
      return
    }

    setDetectionActive(true)
    setBackendDetectionStatus('detecting')

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }

    detectionIntervalRef.current = setInterval(async () => {
      let anyPersonDetected = false

      for (const stream of streams) {
        const videoEl = videoRefs.current[stream.id]
        const canvasEl = canvasRefs.current[stream.id]

        // Check if video element exists and has loaded metadata
        if (videoEl && canvasEl) {
          // For demo and file videos, ensure they are playing
          if ((stream.type === 'demo' || stream.type === 'file') && videoEl.paused) {
            continue // Skip paused videos
          }

          // Check if video has valid dimensions (metadata loaded)
          if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
            const detected = await detectPersons(videoEl, canvasEl)
            if (detected) {
              anyPersonDetected = true
            }
          }
        }
      }

      setPersonDetected(anyPersonDetected)
      setBackendDetectionStatus(anyPersonDetected ? 'person-found' : 'detecting')

      // Owl Eye: Send detection alert if active and person detected
      // Throttle alerts to once every 5 seconds
      const now = Date.now()
      const timeSinceLastAlert = now - lastOwlEyeAlertRef.current
      
      if (owlEyeActiveRef.current && anyPersonDetected && wsConnected && timeSinceLastAlert >= 5000) {
        lastOwlEyeAlertRef.current = now
        // Capture frame from first video element with detection
        for (const stream of streams) {
          const videoEl = videoRefs.current[stream.id]
          const canvasEl = canvasRefs.current[stream.id]
          
          if (videoEl && canvasEl && videoEl.readyState >= 2) {
            try {
              // Create a temporary canvas to capture the current frame
              const frameCanvas = document.createElement('canvas')
              frameCanvas.width = videoEl.videoWidth
              frameCanvas.height = videoEl.videoHeight
              const frameCtx = frameCanvas.getContext('2d')
              
              if (frameCtx) {
                frameCtx.drawImage(videoEl, 0, 0)
                const frameDataUrl = frameCanvas.toDataURL('image/jpeg', 0.8)
                
                // Get bounding boxes from canvas
                const predictions = await detectionModel?.detect(videoEl)
                const personDetections = predictions?.filter(p => p.class === 'person') || []
                
                // Send Owl Eye detection message via NotificationContext WebSocket
                const owlEyeMessage = {
                  type: 'owl_eye_detection',
                  data: {
                    timestamp: new Date().toISOString(),
                    frame_data: frameDataUrl,
                    shop_id: shopId,
                    stream_id: streamIdRef.current || stream.id,
                    detections: personDetections.map(p => ({
                      bbox: {
                        x: p.bbox[0],
                        y: p.bbox[1],
                        w: p.bbox[2],
                        h: p.bbox[3]
                      },
                      confidence: p.score,
                      class: p.class
                    })),
                    location: shop?.name || `Stream ${stream.name}`
                  }
                }
                
                sendMessage(owlEyeMessage)
                break // Only send once per detection cycle
              }
            } catch (err) {
              console.error('[Owl Eye] Error capturing frame:', err)
            }
          }
        }
      }
      // Note: WebRTC connection is already established on page load
      // Detection continues without needing to start WebRTC again
    }, 100) // Run detection every 100ms
  }

  // Stop detection loop
  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }

    // Clear all canvases
    Object.values(canvasRefs.current).forEach((canvas) => {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }
    })

    setDetectionActive(false)
    setPersonDetected(false)
    setBackendDetectionStatus('inactive')
  }

  // Start WebRTC connection to send video stream to backend
  const startWebRTC = async (localStreams: MediaStream[] = []) => {
    try {
      setIsConnecting(true)
      setConnectionStatus('connecting')
      setError(null)

      // Close existing connection if any
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }

      // Get backend URL from environment variables
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:8000'
      
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // Capture streams from video elements that are playing
      const capturedStreams: MediaStream[] = []
      
      // If no local streams provided, try to capture from video elements
      if (localStreams.length === 0) {
        for (const stream of streams) {
          if (stream.type === 'file') {
            const videoEl = videoRefs.current[stream.id]
            if (videoEl && videoEl.readyState >= 2) { // HAVE_CURRENT_DATA or higher
              try {
                // Capture stream from video element
                const capturedStream = (videoEl as any).captureStream()
                if (capturedStream && capturedStream.getTracks().length > 0) {
                  capturedStreams.push(capturedStream)
                  console.log(`📹 Captured stream from ${stream.name}`)
                }
              } catch (err) {
                console.error(`Failed to capture stream from ${stream.name}:`, err)
              }
            }
          }
        }
      } else {
        capturedStreams.push(...localStreams)
      }

      // Create RTCPeerConnection even if no streams yet
      // This establishes the connection, streams can be added later
      pcRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      })

      // Add captured tracks to peer connection if available
      if (capturedStreams.length > 0) {
        capturedStreams.forEach((stream) => {
          stream.getTracks().forEach((track) => {
            if (pcRef.current) {
              console.log(`➕ Adding track: ${track.kind}`)
              pcRef.current.addTrack(track, stream)
            }
          })
        })
      } else {
        console.log('⚠️ No video streams ready yet, establishing connection anyway')
      }

      // Add transceiver for sending video to backend
      pcRef.current.addTransceiver('video', { direction: 'sendonly' })

      // Handle incoming tracks from backend (for processed video)
      pcRef.current.ontrack = (event) => {
        console.log('🎥 Received track from backend:', event.track.kind, event.track.id)
        const remoteStream = event.streams[0]
        if (remoteStream) {
          console.log('Remote stream received with', remoteStream.getTracks().length, 'tracks')
        }
      }

      // Handle connection state changes
      pcRef.current.onconnectionstatechange = () => {
        if (pcRef.current) {
          const state = pcRef.current.connectionState
          console.log('🔌 Connection state changed:', state)
          setConnectionStatus(state)

          if (state === 'failed' || state === 'disconnected') {
            setIsStreaming(false)
            setError('Connection lost. Please reconnect.')
          } else if (state === 'connected') {
            setError(null)
            setIsStreaming(true)
            // Start playing all videos now that connection is established
            Object.values(videoRefs.current).forEach(video => {
              if (video && video.paused) {
                video.play().catch(err => {
                  console.error('Error playing video:', err)
                })
              }
            })
            console.log('▶️ Started playing all videos after connection established')
          }
        }
      }

      // ICE connection state monitoring
      pcRef.current.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', pcRef.current?.iceConnectionState)
      }

      pcRef.current.onicegatheringstatechange = () => {
        console.log('🧊 ICE gathering state:', pcRef.current?.iceGatheringState)
      }

      pcRef.current.onsignalingstatechange = () => {
        console.log('📡 Signaling state:', pcRef.current?.signalingState)
      }

      // Create and send offer
      const offer = await pcRef.current.createOffer()
      await pcRef.current.setLocalDescription(offer)
      console.log('📤 Created offer with SDP:', offer.sdp?.substring(0, 200) + '...')

      // Prepare stream metadata
      const streamMetadata: any = {
        stream_number: streams.length + 1,
      }

      // Add filename if available (for uploaded videos)
      if (localStreams.length > 0) {
        const firstStream = streams.find((s) => s.type === 'file' || s.type === 'demo')
        if (firstStream) {
          streamMetadata.filename = firstStream.name
        }
      }

      // Send offer to backend
      if (!shopId) {
        throw new Error('Shop ID is required. Please provide shopId in URL params.')
      }
      
      const answer = await streamService.sendOffer({
        sdp: offer.sdp,
        type: offer.type,
        user_id: user.id,
        shop_id: shopId,
        stream_metadata: streamMetadata,
      })

      console.log('📥 Received answer from backend:', answer.stream_id)
      console.log('Answer SDP:', answer.sdp?.substring(0, 200) + '...')

      // Validate response
      if (!answer.sdp || !answer.type || !answer.stream_id) {
        throw new Error('Invalid response from backend')
      }

      // Parse SDP to check for media lines
      const sdpLines = answer.sdp.split('\n')
      const mediaLines = sdpLines.filter(line => line.startsWith('m='))
      console.log('📄 SDP Media lines in answer:', mediaLines)
      const videoLine = mediaLines.find(line => line.includes('video'))
      if (!videoLine) {
        console.warn('⚠️ No video media line found in SDP answer!')
      }

      // Set remote description with the answer from backend
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription({ sdp: answer.sdp, type: answer.type })
      )

      console.log('✅ Remote description set successfully')
      console.log('Transceivers:', pcRef.current.getTransceivers().map(t => ({
        direction: t.direction,
        currentDirection: t.currentDirection,
        receiver: t.receiver.track?.kind,
        sender: t.sender.track?.kind
      })))

      // Store stream ID for later use
      streamIdRef.current = answer.stream_id
      console.log('WebRTC connected with stream_id:', answer.stream_id)

      setIsConnecting(false)

      // Start stats monitoring
      startStatsMonitoring()
    } catch (err) {
      setConnectionStatus('error')
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsStreaming(false)
      setIsConnecting(false)
      hasInitiatedConnection.current = false // Reset on error to allow retry
      console.error('WebRTC error:', err)
    }
  }

  // Monitor WebRTC stats
  const startStatsMonitoring = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
    }

    statsIntervalRef.current = setInterval(async () => {
      if (pcRef.current && pcRef.current.connectionState === 'connected') {
        try {
          const stats = await pcRef.current.getStats()
          let frames = 0
          let jitter = 0

          stats.forEach((report: any) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              frames = report.framesDecoded || 0
              jitter = report.jitter || 0
            }
          })

          setStatsInfo(`Frames: ${frames}, Jitter: ${jitter.toFixed(3)}`)
        } catch (err) {
          console.error('Stats error:', err)
        }
      }
    }, 1000)
  }

  // Stop WebRTC connection
  const stopWebRTC = async () => {
    try {
      // Stop stats monitoring
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
        statsIntervalRef.current = null
      }

      // Disconnect stream from backend
      if (streamIdRef.current && user?.id) {
        try {
          await streamService.deleteStream(user.id, streamIdRef.current)
        } catch (err) {
          console.error('Error closing stream:', err)
        }
        streamIdRef.current = null
      }

      // Close peer connection
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }

      // Remove WebRTC streams but keep demo streams
      setStreams((prev) => prev.filter((s) => s.type !== 'webrtc'))

      setIsStreaming(false)
      setIsConnecting(false)
      setConnectionStatus('disconnected')
      setStatsInfo('')
      setPersonDetected(false)
      setBackendDetectionStatus('inactive')
      hasInitiatedConnection.current = false // Reset connection flag
    } catch (err) {
      console.error('Error stopping WebRTC:', err)
    }
  }

  // Reconnect WebRTC
  const reconnectWebRTC = () => {
    stopWebRTC().then(() => {
      // If demo is running, we need to re-capture streams
      if (isDemoRunning) {
        handleDemoAction()
      } else {
        startWebRTC()
      }
    })
  }

  // Handle File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setStreams((prev) => [
        ...prev,
        {
          id: `file-${Date.now()}`,
          type: 'file',
          url,
          name: file.name,
        },
      ])
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle Play All Videos
  const handlePlayAllVideos = async () => {
    if (!areVideosPlaying) {
      // Play all uploaded videos
      setAreVideosPlaying(true)

      for (const stream of streams) {
        if (stream.type === 'file') {
          const videoEl = videoRefs.current[stream.id]
          if (videoEl) {
            try {
              await videoEl.play()
            } catch (e) {
              console.error('Error playing video:', e)
            }
          }
        }
      }

      // Detection will auto-start via useEffect
    } else {
      // Stop all videos
      setAreVideosPlaying(false)

      streams.forEach((stream) => {
        if (stream.type === 'file') {
          const videoEl = videoRefs.current[stream.id]
          if (videoEl) {
            videoEl.pause()
          }
        }
      })

      // Stop WebRTC and detection
      await stopWebRTC()
      stopDetection()
      hasInitiatedConnection.current = false // Reset flag
    }
  }

  // Toggle Full Screen
  const toggleFullScreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
        })
      } else {
        document.exitFullscreen()
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebRTC()
      stopDetection()
      // Revoke object URLs
      streamsRef.current.forEach((stream) => {
        if (stream.type === 'file' && stream.url) {
          URL.revokeObjectURL(stream.url)
        }
      })
      // Stop video playback
      setAreVideosPlaying(false)
    }
  }, [])

  // Calculate grid columns
  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2'
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2'
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  // Determine button states
  const hasUploadedVideos = streams.some((s) => s.type === 'file')
  const isAddCameraDisabled = areVideosPlaying
  const isPlayAllDisabled = !hasUploadedVideos

  // Show loading or error if shop ID is not available
  if (!shopId && !loadingShop) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-600 dark:text-red-400 mb-4" />
          <p className="text-gray-900 dark:text-white font-semibold mb-2">
            No Shop Selected
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isManager 
              ? 'No shop has been assigned to your account. Please contact your administrator.'
              : 'Please select a shop from the URL parameter (?shopId=YOUR_SHOP_ID).'
            }
          </p>
        </div>
      </div>
    )
  }

  if (loadingShop) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading shop data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1
          className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
        >
          Live Feed
        </h1>
        <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
          Monitor real-time camera feed and stream to AI detection service
        </p>
      </motion.div>

      {/* Status Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div
          className={`flex items-center space-x-3 p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800/50' : 'bg-white border-gray-300'
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              streams.length > 0
                ? 'bg-green-500/20'
                : theme === 'dark'
                ? 'bg-slate-800'
                : 'bg-gray-200'
            }`}
          >
            <CameraIcon
              size={20}
              className={
                streams.length > 0
                  ? 'text-green-400'
                  : theme === 'dark'
                  ? 'text-slate-500'
                  : 'text-gray-500'
              }
            />
          </div>
          <div>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
              Active Cameras
            </p>
            <p
              className={`font-medium ${
                streams.length > 0
                  ? 'text-green-400'
                  : theme === 'dark'
                  ? 'text-slate-500'
                  : 'text-gray-500'
              }`}
            >
              {streams.length} Source{streams.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center space-x-3 p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800/50' : 'bg-white border-gray-300'
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              isStreaming ? 'bg-teal-500/20' : theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200'
            }`}
          >
            {isStreaming ? (
              <Wifi size={20} className="text-teal-400 animate-pulse" />
            ) : (
              <WifiOff
                size={20}
                className={theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}
              />
            )}
          </div>
          <div>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
              Streaming Status
            </p>
            <p
              className={`font-medium ${
                isStreaming
                  ? 'text-teal-400'
                  : theme === 'dark'
                  ? 'text-slate-500'
                  : 'text-gray-500'
              }`}
            >
              {isStreaming ? 'Streaming...' : 'Not Streaming'}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800/50' : 'bg-white border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${
                owlEyeActive ? 'bg-amber-500/20' : theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200'
              }`}
            >
              {owlEyeActive ? (
                <Eye size={20} className="text-amber-400 animate-pulse" />
              ) : (
                <EyeOff size={20} className={theme === 'dark' ? 'text-slate-500' : 'text-gray-500'} />
              )}
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                The Owl Eye
              </p>
              <p
                className={`font-medium ${
                  owlEyeActive ? 'text-amber-400' : theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                }`}
              >
                {owlEyeActive ? 'Active (Sentry Mode)' : 'Inactive'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOwlEyeActive(!owlEyeActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              owlEyeActive ? 'bg-amber-500' : theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                owlEyeActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </motion.div>

      {/* Video Grid Container */}
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl border backdrop-blur-sm overflow-hidden p-4 ${
          theme === 'dark' ? 'border-slate-800/50 bg-slate-900/50' : 'border-gray-300 bg-white'
        }`}
      >
        <div
          className={`grid gap-4 ${getGridClass(streams.length)} min-h-[400px] p-4 rounded-lg ${
            theme === 'dark' ? 'bg-slate-950' : 'bg-gray-100'
          }`}
        >
          {streams.length === 0 ? (
            <div
              className={`col-span-full flex flex-col items-center justify-center h-full min-h-[400px] ${
                theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
              }`}
            >
              <CameraIcon
                size={64}
                className={`mb-4 ${theme === 'dark' ? 'text-slate-700' : 'text-gray-400'}`}
              />
              <p className="text-lg font-medium mb-2">
                {loadingShop ? 'Loading shop data...' : 'No Cameras Attached'}
              </p>
              <p className="text-sm">
                {loadingShop
                  ? 'Please wait...'
                  : 'Add cameras to this shop to start monitoring'}
              </p>
            </div>
          ) : (
            streams.map((stream) => (
              <div
                key={stream.id}
                className={`relative bg-black rounded-lg overflow-hidden border ${
                  theme === 'dark' ? 'border-slate-800' : 'border-gray-400'
                }`}
                style={{ aspectRatio: '16 / 9' }}
              >
                <div className="relative w-full h-full">
                  {stream.type === 'webrtc' || stream.type === 'webcam' ? (
                    <video
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                      onLoadedMetadata={() => handleVideoLoaded(stream.id)}
                      ref={(el) => {
                        if (el && stream.srcObject && el.srcObject !== stream.srcObject) {
                          el.srcObject = stream.srcObject
                        }
                        videoRefs.current[stream.id] = el
                      }}
                    />
                  ) : stream.type === 'camera' ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <div className="text-center p-6">
                        <CameraIcon className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                        <p className="text-white font-medium mb-2">Camera Ready</p>
                        <p className="text-sm text-gray-400 break-all max-w-md">
                          {stream.cameraUrl}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Click "Stream Cameras" to start
                        </p>
                      </div>
                    </div>
                  ) : (
                    <video
                      src={stream.url}
                      controls={false}
                      loop
                      muted
                      playsInline
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain"
                      onLoadedMetadata={() => handleVideoLoaded(stream.id)}
                      ref={(el) => {
                        videoRefs.current[stream.id] = el
                      }}
                    />
                  )}
                  {/* Detection Canvas Overlay */}
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[stream.id] = el
                    }}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white backdrop-blur-sm">
                  {stream.name}
                </div>
                {isStreaming && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-1 rounded bg-red-500/20 backdrop-blur-sm border border-red-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-red-400">LIVE</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {/* Add Camera (File) */}
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isAddCameraDisabled}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAddCameraDisabled}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 border ${
                  isAddCameraDisabled
                    ? theme === 'dark'
                      ? 'bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                    : theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-400'
                }`}
              >
                <Plus size={20} />
                <span>Add Video</span>
              </button>
            </div>

            {/* Play All Videos Button */}
            {hasUploadedVideos && (
              <button
                onClick={handlePlayAllVideos}
                disabled={isPlayAllDisabled}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 border ${
                  isPlayAllDisabled
                    ? theme === 'dark'
                      ? 'bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                    : areVideosPlaying
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20 border-transparent'
                }`}
              >
                {areVideosPlaying ? <StopCircle size={20} /> : <PlayCircle size={20} />}
                <span>{areVideosPlaying ? 'Stop All' : 'Play All'}</span>
              </button>
            )}

            {/* Stream Cameras Button - for camera URLs from shop */}
            {shop && shop.cameras && shop.cameras.length > 0 && !isStreaming && (
              <button
                onClick={() => startWebRTC([])}
                className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 border-transparent"
              >
                <Video size={20} />
                <span>Stream Cameras ({shop.cameras.length})</span>
              </button>
            )}

            {/* Connect/Disconnect WebRTC (Manual) */}
            {streams.length > 0 &&
              !detectionActive &&
              (!isStreaming ? (
                <button
                  onClick={() => startWebRTC()}
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium transition-all duration-200 shadow-lg shadow-teal-500/20"
                >
                  <Video size={20} />
                  <span>Connect Stream</span>
                </button>
              ) : (
                <button
                  onClick={stopWebRTC}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <VideoOff size={20} />
                  <span>Disconnect</span>
                </button>
              ))}
          </div>

          {/* Full Screen Button */}
          <button
            onClick={toggleFullScreen}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 border ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-400'
            }`}
          >
            <Maximize size={20} />
            <span>Full Screen</span>
          </button>
        </div>

        {/* Status Text */}
        <div
          className={`mt-4 text-sm space-y-1 ${
            theme === 'dark' ? 'text-slate-500' : 'text-gray-600'
          }`}
        >
          {error && <p className="text-red-400">{error}</p>}
          <p>
            • Videos: <code className={videosReady ? "text-green-400" : "text-yellow-400"}>
              {loadingShop ? 'Loading...' : videosReady ? 'Ready' : 'Initializing...'}
            </code>
          </p>
          <p>
            • Connection status: <code className="text-teal-400">{connectionStatus}</code>
          </p>
          {statsInfo && (
            <p>
              • Stats: <code className="text-teal-400">{statsInfo}</code>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
