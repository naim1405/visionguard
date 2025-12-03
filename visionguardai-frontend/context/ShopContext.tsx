'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Shop } from '@/types'
import { shopService } from '@/lib/services/shopService'
import { useAuth } from './AuthContext'

interface ShopContextType {
  shops: Shop[]
  selectedShop: Shop | null
  loading: boolean
  setSelectedShop: (shop: Shop | null) => void
  refreshShops: () => Promise<void>
  hasSingleShop: boolean
  hasMultipleShops: boolean
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()

  const refreshShops = async () => {
    if (!isAuthenticated) {
      setShops([])
      setSelectedShop(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await shopService.getAllShops()
      setShops(data)
      
      // Auto-select first shop if only one or no shop selected
      if (data.length > 0 && !selectedShop) {
        setSelectedShop(data[0])
      }
    } catch (error) {
      console.error('Failed to load shops:', error)
      setShops([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshShops()
    } else {
      setShops([])
      setSelectedShop(null)
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const value: ShopContextType = {
    shops,
    selectedShop,
    loading,
    setSelectedShop,
    refreshShops,
    hasSingleShop: shops.length === 1,
    hasMultipleShops: shops.length > 1,
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShops() {
  const context = useContext(ShopContext)
  if (context === undefined) {
    throw new Error('useShops must be used within a ShopProvider')
  }
  return context
}
