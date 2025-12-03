'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { shopService } from '@/lib/services/shopService'
import { Shop } from '@/types'
import { Store, MapPin, AlertCircle, ArrowLeft, Camera, Plus, X, Loader2, Send, CheckCircle } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

function EditShopContent() {
  const [shop, setShop] = useState<Shop | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [cameraUrls, setCameraUrls] = useState<string[]>([''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingShop, setFetchingShop] = useState(true)
  const [showTelegramModal, setShowTelegramModal] = useState(false)
  const [telegramChatId, setTelegramChatId] = useState('')
  const [connectingTelegram, setConnectingTelegram] = useState(false)
  const [telegramError, setTelegramError] = useState('')

  const router = useRouter()
  const params = useParams()
  const { isOwner } = useAuth()
  const shopId = params.id as string

  useEffect(() => {
    if (!isOwner) {
      router.push('/shops')
      return
    }

    const fetchShop = async () => {
      try {
        const shopData = await shopService.getShop(shopId)
        setShop(shopData)
        setName(shopData.name)
        setAddress(shopData.address || '')
        setCameraUrls(shopData.cameras && shopData.cameras.length > 0 ? shopData.cameras : [''])
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load shop')
      } finally {
        setFetchingShop(false)
      }
    }

    fetchShop()
  }, [shopId, isOwner, router])

  const addCameraUrl = () => {
    setCameraUrls([...cameraUrls, ''])
  }

  const removeCameraUrl = (index: number) => {
    if (cameraUrls.length > 1) {
      setCameraUrls(cameraUrls.filter((_, i) => i !== index))
    }
  }

  const updateCameraUrl = (index: number, value: string) => {
    const updated = [...cameraUrls]
    updated[index] = value
    setCameraUrls(updated)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Filter out empty camera URLs
      const validCameraUrls = cameraUrls
        .map((url) => url.trim())
        .filter((url) => url)

      await shopService.updateShop(shopId, {
        name,
        address: address || undefined,
        cameras: validCameraUrls.length > 0 ? validCameraUrls : undefined,
      })

      router.push('/shops')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update shop')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectTelegram = async () => {
    if (!telegramChatId.trim()) {
      setTelegramError('Please enter your Telegram Chat ID')
      return
    }

    setConnectingTelegram(true)
    setTelegramError('')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/telegram/connect-shop?shop_id=${shopId}&chat_id=${telegramChatId.trim()}`,
        { method: 'POST' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to connect Telegram')
      }

      // Refresh shop data to show connected status
      const shopData = await shopService.getShop(shopId)
      setShop(shopData)
      setShowTelegramModal(false)
      setTelegramChatId('')
    } catch (err: any) {
      setTelegramError(err.message || 'Failed to connect Telegram')
    } finally {
      setConnectingTelegram(false)
    }
  }

  const handleDisconnectTelegram = async () => {
    if (!confirm('Are you sure you want to disconnect Telegram notifications?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/telegram/disconnect-shop/${shopId}`,
        { method: 'POST' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to disconnect Telegram')
      }

      // Refresh shop data to show disconnected status
      const shopData = await shopService.getShop(shopId)
      setShop(shopData)
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect Telegram')
    } finally {
      setLoading(false)
    }
  }

  if (!isOwner) {
    return null
  }

  if (fetchingShop) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading shop...</p>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-600 dark:text-red-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Shop not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Shop
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Update shop information and camera configurations
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Shop Name <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Downtown Store"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </div>
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Enter shop address (optional)"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera URLs
              </div>
            </label>
            <div className="space-y-3">
              {cameraUrls.map((url, index) => (
                <div key={index} className="flex gap-2 group">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateCameraUrl(index, e.target.value)}
                      placeholder={`rtsp://camera${index + 1}.example.com:554/stream`}
                      className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    />
                    <Camera className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {cameraUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCameraUrl(index)}
                      className="px-3 py-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Remove camera"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCameraUrl}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Another Camera
            </button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add RTSP, HTTP, or other video stream URLs for your cameras.
            </p>
          </div>

          {/* Telegram Connection Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Telegram Notifications
              </div>
            </label>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {shop.telegramChatId ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Send className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {shop.telegramChatId ? 'Telegram Connected' : 'Connect Telegram Bot'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {shop.telegramChatId 
                      ? 'This shop is connected to receive Telegram notifications for anomaly alerts.'
                      : 'Receive instant anomaly alerts on Telegram.'
                    }
                  </p>
                  {shop.telegramChatId ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Active • Chat ID: {shop.telegramChatId}
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnectTelegram}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        {loading ? 'Disconnecting...' : 'Disconnect Telegram'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowTelegramModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Connect Telegram
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>📱 When connected, you&apos;ll receive real-time notifications on Telegram.</p>
              <p>💡 To connect: Search for <strong>@VisionGuardAIBot</strong> on Telegram and get your Chat ID.</p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
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
                  Updating Shop...
                </span>
              ) : (
                'Update Shop'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Telegram Connection Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Telegram Bot
            </h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Step 1:</strong> Open Telegram and message{' '}
                  <a 
                    href="https://t.me/VisionGuardAIBot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    @VisionGuardAIBot
                  </a>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Step 2:</strong> Send <strong>/start</strong> or any message to the bot
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Step 3:</strong> The bot will reply with your Chat ID - copy and paste it below
                </p>
              </div>

              {telegramError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{telegramError}</p>
                </div>
              )}

              <div>
                <label htmlFor="chatId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Your Telegram Chat ID
                </label>
                <input
                  id="chatId"
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="e.g., 123456789"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleConnectTelegram}
                  disabled={connectingTelegram}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingTelegram ? 'Connecting...' : 'Connect'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTelegramModal(false)
                    setTelegramChatId('')
                    setTelegramError('')
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EditShopPage() {
  return (
    <ProtectedRoute requireRole="OWNER">
      <EditShopContent />
    </ProtectedRoute>
  )
}
