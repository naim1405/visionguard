import apiClient from '../api/axios'
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types'

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    return response.data
  },

  async registerOwner(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register-owner', data)
    return response.data
  },

  async registerManager(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register-manager', data)
    return response.data
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('access_token')
    if (token) {
      await apiClient.post('/auth/logout')
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return response.data
  },
}
