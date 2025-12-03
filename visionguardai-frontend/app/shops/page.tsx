'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useShops } from '@/context/ShopContext'
import { Shop } from '@/types'
import { Store, Plus, Users, MapPin, AlertCircle } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

function ShopsPageContent() {
  const [error, setError] = useState('')

  const { user, isOwner } = useAuth()
  const { shops, loading, refreshShops } = useShops()
  const router = useRouter()

  useEffect(() => {
    // Refresh shops when component mounts
    refreshShops()
  }, [])

  const handleEditShop = (shopId: string) => {
    router.push(`/shops/${shopId}/edit`)
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading shops...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isOwner ? 'All Shops' : 'Assigned Shops'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isOwner
              ? 'Manage your shops and their security'
              : 'View shops you have access to'}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => router.push('/shops/create')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Create Shop
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Shops Grid */}
      {shops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {shop.name}
                      </h3>
                      {shop.address && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{shop.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Managers */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="w-4 h-4" />
                    Managers
                  </div>
                  {shop.managers.length > 0 ? (
                    <div className="space-y-1">
                      {shop.managers.slice(0, 3).map((manager) => (
                        <div
                          key={manager.id}
                          className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          {manager.email}
                        </div>
                      ))}
                      {shop.managers.length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          +{shop.managers.length - 3} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      No managers assigned
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/shops/${shop.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Store className="w-4 h-4" />
                    Show Details
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleEditShop(shop.id)}
                      className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created {new Date(shop.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Store className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No shops yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isOwner
              ? 'Create your first shop to get started'
              : 'No shops have been assigned to you yet'}
          </p>
          {isOwner && (
            <button
              onClick={() => router.push('/shops/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create Your First Shop
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ShopsPage() {
  return (
    <ProtectedRoute>
      <ShopsPageContent />
    </ProtectedRoute>
  )
}
