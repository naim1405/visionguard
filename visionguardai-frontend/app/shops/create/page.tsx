'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { shopService } from '@/lib/services/shopService'
import { Store, MapPin, Users, AlertCircle, ArrowLeft, Camera, Plus, X } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import ToastContainer from '@/components/ToastContainer'
import { useToast } from '@/hooks/useToast'

function CreateShopContent() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [managerEmails, setManagerEmails] = useState('')
  const [cameraUrls, setCameraUrls] = useState<string[]>([''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { isOwner } = useAuth()
  const { toasts, showToast, removeToast } = useToast()

  if (!isOwner) {
    router.push('/shops')
    return null
  }

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
      // Parse comma-separated emails
      const emailList = managerEmails
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email)

      // Validate manager emails if provided
      if (emailList.length > 0) {
        const invalidEmails: string[] = []
        const alreadyAssignedEmails: string[] = []
        
        for (const email of emailList) {
          try {
            const result = await shopService.checkManagerEmail(email)
            if (!result.exists) {
              invalidEmails.push(email)
            }
          } catch (err: any) {
            // Check if error is about manager already assigned
            if (err.response?.data?.detail?.includes('already assigned')) {
              alreadyAssignedEmails.push(email)
            } else {
              console.error(`Error checking email ${email}:`, err)
              invalidEmails.push(email)
            }
          }
        }

        if (invalidEmails.length > 0) {
          setLoading(false)
          showToast(
            `No manager account found for: ${invalidEmails.join(', ')}. Please ask them to create an account first.`,
            'error',
            8000
          )
          return
        }

        if (alreadyAssignedEmails.length > 0) {
          setLoading(false)
          showToast(
            `Manager(s) already assigned to another shop: ${alreadyAssignedEmails.join(', ')}. A manager can only be assigned to one shop.`,
            'error',
            8000
          )
          return
        }
      }

      // Filter out empty camera URLs
      const validCameraUrls = cameraUrls
        .map((url) => url.trim())
        .filter((url) => url)

      await shopService.createShop({
        name,
        address: address || undefined,
        assigned_manager_emails: emailList.length > 0 ? emailList : undefined,
        cameras: validCameraUrls.length > 0 ? validCameraUrls : undefined,
      })

      showToast('Shop created successfully!', 'success')
      setTimeout(() => router.push('/shops'), 1000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create shop')
      showToast('Failed to create shop', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
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
          Create New Shop
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Add a new shop to your VisionGuard AI security network
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
            <label
              htmlFor="managers"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Manager Emails
              </div>
            </label>
            <input
              id="managers"
              type="text"
              value={managerEmails}
              onChange={(e) => setManagerEmails(e.target.value)}
              placeholder="manager1@example.com, manager2@example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Separate multiple emails with commas. Only emails with existing manager accounts can be assigned. Each manager can only be assigned to one shop.
            </p>
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
                  Creating Shop...
                </span>
              ) : (
                'Create Shop'
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
    </div>
  )
}

export default function CreateShopPage() {
  return (
    <ProtectedRoute requireRole="OWNER">
      <CreateShopContent />
    </ProtectedRoute>
  )
}
