import apiClient from '../api/axios'

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
    bbox?: {
      x: number
      y: number
      w: number
      h: number
    }
    frame_number?: number
    stream_id?: string
    classification?: string
  } | null
  created_at: string
  updated_at: string
}

export interface AnomalyListResponse {
  total: number
  anomalies: Anomaly[]
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

export interface UpdateAnomalyRequest {
  status: 'pending' | 'acknowledged' | 'resolved' | 'false_positive'
  notes?: string
}

class AnomalyService {
  /**
   * Get list of anomalies with optional filters
   */
  async getAnomalies(params?: {
    shop_id?: string
    status?: string
    severity?: string
    limit?: number
    offset?: number
  }): Promise<AnomalyListResponse> {
    const response = await apiClient.get<AnomalyListResponse>('/api/anomalies', { params })
    return response.data
  }

  /**
   * Get a specific anomaly by ID
   */
  async getAnomalyById(anomalyId: string): Promise<Anomaly> {
    const response = await apiClient.get<Anomaly>(`/api/anomalies/${anomalyId}`)
    return response.data
  }

  /**
   * Update anomaly status
   */
  async updateAnomaly(anomalyId: string, data: UpdateAnomalyRequest): Promise<Anomaly> {
    const response = await apiClient.patch<Anomaly>(`/api/anomalies/${anomalyId}`, data)
    return response.data
  }

  /**
   * Get anomaly statistics
   */
  async getAnomalyStats(shop_id?: string): Promise<AnomalyStats> {
    const params = shop_id ? { shop_id } : {}
    const response = await apiClient.get<AnomalyStats>('/api/anomalies/stats/summary', { params })
    return response.data
  }

  /**
   * Get full URL for anomaly frame image with authentication
   * Uses Next.js API proxy route to handle authentication
   * Backend returns paths like: /api/anomalies/frames/shop_id/filename.jpg
   */
  getFrameImageUrl(imageUrl: string | null): string | null {
    if (!imageUrl) return null
    
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) return null
    
    // Remove leading /api/ since our proxy route will add it back
    let path = imageUrl
    if (path.startsWith('/api/')) {
      path = path.substring(5) // Remove '/api/'
    }
    
    // Use Next.js API proxy route for authenticated image requests
    // Pass token as query parameter
    return `/api/images/${path}?token=${encodeURIComponent(token)}`
  }
}

export const anomalyService = new AnomalyService()
