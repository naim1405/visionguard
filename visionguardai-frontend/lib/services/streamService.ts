import apiClient from '../api/axios'

export interface OfferRequest {
  sdp: string
  type: string
  user_id: string | number
  shop_id: string | number
  stream_metadata?: {
    stream_name?: string
    camera_id?: string
    location?: string
    filename?: string
  }
}

export interface OfferResponse {
  sdp: string
  type: string
  stream_id: string
}

export const streamService = {
  async sendOffer(offerData: OfferRequest): Promise<OfferResponse> {
    const response = await apiClient.post<OfferResponse>('/api/offer', offerData)
    return response.data
  },

  async deleteStream(userId: string | number, streamId: string): Promise<void> {
    await apiClient.delete(`/api/users/${userId}/streams/${streamId}`)
  },
}
