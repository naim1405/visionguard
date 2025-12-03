// Type definitions for VisionGuard.ai

export interface Activity {
  id: number
  timestamp: string
  location: string
  description: string
  status: 'pending' | 'verified' | 'dismissed'
  severity: 'low' | 'medium' | 'high'
  thumbnail?: string
}

export interface Alert {
  id: number
  time: string
  location: string
  type: string
  status: 'verified' | 'pending' | 'false-positive'
}

export interface SystemStatus {
  service: string
  status: 'online' | 'offline' | 'warning'
  value?: string
}

export interface ChartData {
  name: string
  value: number
}

export interface StreamFrame {
  frame: string
  timestamp: string
}

export interface DetectionResult {
  success: boolean
  message: string
  timestamp: string
  detections: Detection[]
}

export interface Detection {
  type: string
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

// Authentication Types
export type UserRole = 'OWNER' | 'MANAGER'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role?: UserRole
}

// Shop Types
export interface Shop {
  id: string
  name: string
  address?: string
  owner_id: string
  managers: Manager[]
  cameras?: string[]
  telegramChatId?: string | null
  created_at: string
  updated_at: string
}

export interface Manager {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface CreateShopRequest {
  name: string
  address?: string
  assigned_manager_emails?: string[]
  cameras?: string[]
}

export interface UpdateShopRequest {
  name?: string
  address?: string
  cameras?: string[]
}

// WebRTC Types
export interface WebRTCOffer {
  sdp: string
  type: string
  user_id: string
  shop_id: string
  stream_metadata?: {
    stream_name: string
    camera_id: string
    location: string
  }
}

export interface WebRTCAnswer {
  sdp: string
  type: string
  stream_id: string
}

// WebSocket Types
export interface AnomalyAlert {
  id: number
  stream_id: string
  person_id: number
  timestamp: string
  frame?: string
  details: {
    status: string
    confidence?: number
  }
}

export interface WebSocketMessage {
  type: 'anomaly_detected' | 'ack' | 'error' | 'notification' | 'ping' | 'pong'
  stream_id?: string
  result?: any
  annotated_frame?: string
  data?: any
}

// Notification Types
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'
export type NotificationType = 'info' | 'warning' | 'alert' | 'success' | 'error'

export interface Notification {
  notification_id: string
  title: string
  message: string
  priority: NotificationPriority
  type: NotificationType
  timestamp: string
  metadata?: Record<string, any>
  action_url?: string
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'notification'
  data: Notification
}

// Anomaly Types (from backend)
export interface Anomaly {
  id: string
  shop_id: string
  timestamp: string
  location: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'acknowledged' | 'resolved' | 'false_positive'
  description: string
  image_url: string | null
  anomaly_type: string | null
  confidence_score: number | null
  resolved_by: string | null
  resolved_at: string | null
  notes: string | null
  extra_data: {
    person_id?: number
    bbox?: { x: number; y: number; w: number; h: number }
    frame_number?: number
    stream_id?: string
    classification?: string
  } | null
  created_at: string
  updated_at: string
}

export interface AnomalyStats {
  total: number
  recent_24h: number
  by_status: {
    pending: number
    acknowledged: number
    resolved: number
    false_positive: number
  }
  by_severity: {
    low: number
    medium: number
    high: number
    critical: number
  }
}
