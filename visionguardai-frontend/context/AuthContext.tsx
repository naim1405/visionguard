'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthResponse, LoginRequest, RegisterRequest } from '@/types'
import { authService } from '@/lib/services/authService'

interface AuthContextType {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  isAuthenticated: boolean
  isOwner: boolean
  isManager: boolean
  login: (credentials: LoginRequest) => Promise<{ success: true; user: User } | { success: false; error: string }>
  registerOwner: (data: RegisterRequest) => Promise<{ success: true; user: User } | { success: false; error: string }>
  registerManager: (data: RegisterRequest) => Promise<{ success: true; user: User } | { success: false; error: string }>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load tokens from localStorage on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token')
    const storedRefreshToken = localStorage.getItem('refresh_token')
    const storedUser = localStorage.getItem('user')

    if (storedAccessToken && storedUser) {
      setAccessToken(storedAccessToken)
      setRefreshToken(storedRefreshToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials)
      
      // Store tokens and user data
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.user))

      setAccessToken(response.access_token)
      setRefreshToken(response.refresh_token)
      setUser(response.user)

      return { success: true as const, user: response.user }
    } catch (error: any) {
      return {
        success: false as const,
        error: error.response?.data?.detail || 'Login failed. Please check your credentials.',
      }
    }
  }

  const registerOwner = async (data: RegisterRequest) => {
    try {
      const response = await authService.registerOwner(data)

      // Store tokens and user data
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.user))

      setAccessToken(response.access_token)
      setRefreshToken(response.refresh_token)
      setUser(response.user)

      return { success: true as const, user: response.user }
    } catch (error: any) {
      return {
        success: false as const,
        error: error.response?.data?.detail || 'Registration failed. Please try again.',
      }
    }
  }

  const registerManager = async (data: RegisterRequest) => {
    try {
      const response = await authService.registerManager(data)

      // Store tokens and user data
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.user))

      setAccessToken(response.access_token)
      setRefreshToken(response.refresh_token)
      setUser(response.user)

      return { success: true as const, user: response.user }
    } catch (error: any) {
      return {
        success: false as const,
        error: error.response?.data?.detail || 'Registration failed. Please try again.',
      }
    }
  }

  const logout = async () => {
    try {
      if (accessToken) {
        await authService.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')

      setAccessToken(null)
      setRefreshToken(null)
      setUser(null)
    }
  }

  const getCurrentUser = async () => {
    if (!accessToken) return null

    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    loading,
    isAuthenticated: !!accessToken,
    isOwner: user?.role === 'OWNER',
    isManager: user?.role === 'MANAGER',
    login,
    registerOwner,
    registerManager,
    logout,
    getCurrentUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Return default values during SSR instead of throwing
    if (typeof window === 'undefined') {
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: true,
        isAuthenticated: false,
        isOwner: false,
        isManager: false,
        login: async () => ({ success: false as const, error: 'SSR' }),
        registerOwner: async () => ({ success: false as const, error: 'SSR' }),
        registerManager: async () => ({ success: false as const, error: 'SSR' }),
        logout: async () => {},
        getCurrentUser: async () => null,
      }
    }
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
