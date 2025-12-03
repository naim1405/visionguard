'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useShops } from '@/context/ShopContext'
import { shopService } from '@/lib/services/shopService'
import { Shop } from '@/types'
import { Store, MapPin, Users, AlertCircle, ArrowLeft, Camera, Video, Edit } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

function ShopDetailsContent() {
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const router = useRouter()
  const params = useParams()
  const { isOwner, isManager } = useAuth()
  const { setSelectedShop, hasSingleShop } = useShops()
  const shopId = params.id as string

  useEffect(() => {
    loadShop()
  }, [shopId])

  const loadShop = async () => {
    try {
      const shopData = await shopService.getShop(shopId)
      setShop(shopData)
      setSelectedShop(shopData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load shop')
    } finally {
      setLoading(false)
    }
  }

  const handleViewLiveFeed = () => {
    if (shop) {
      setSelectedShop(shop)
      router.push(`/live-feed?shopId=${shop.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 mx-auto text-blue-600 dark:text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading shop details...</p>
        </div>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-600 dark:text-red-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{error || 'Shop not found'}</p>
          <button
            onClick={() => router.push('/shops')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to Shops
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
      </div>

      {/* Shop Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{shop.name}</h1>
              {shop.address && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-2">
                  <MapPin className="w-4 h-4" />
                  <span>{shop.address}</span>
                </div>
              )}
            </div>
          </div>
          {isOwner && (
            <button
              onClick={() => router.push(`/shops/${shop.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Shop
            </button>
          )}
        </div>

        {/* Managers Section */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <Users className="w-5 h-5" />
            Managers ({shop.managers.length})
          </div>
          {shop.managers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shop.managers.map((manager) => (
                <div
                  key={manager.id}
                  className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                    {manager.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {manager.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {manager.email}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No managers assigned to this shop</p>
          )}
        </div>

        {/* Cameras Section */}
        {shop.cameras && shop.cameras.length > 0 && (
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Camera className="w-5 h-5" />
              Cameras ({shop.cameras.length})
            </div>
            <div className="space-y-2">
              {shop.cameras.map((camera, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700"
                >
                  <Camera className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
                    {camera}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
          <button
            onClick={handleViewLiveFeed}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30 transition-all duration-200"
          >
            <Video className="w-5 h-5" />
            View Live Feed
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-6">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Created: {new Date(shop.created_at).toLocaleDateString()}</span>
            <span>Updated: {new Date(shop.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ShopDetailsPage() {
  return (
    <ProtectedRoute>
      <ShopDetailsContent />
    </ProtectedRoute>
  )
}
