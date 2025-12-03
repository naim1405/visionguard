'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Video, AlertTriangle, Menu, X, Moon, Sun, Store, LogOut, User, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useShops } from '@/context/ShopContext'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const { user, isAuthenticated, isOwner, logout } = useAuth()
  const { selectedShop, hasSingleShop, hasMultipleShops } = useShops()
  
  // Use try-catch to handle theme context safely
  let theme: 'dark' | 'light' = 'dark'
  let toggleTheme = () => {}
  
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
    toggleTheme = themeContext.toggleTheme
  } catch (error) {
    // Theme context not available during SSR, use default
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't show sidebar on login/register pages or during SSR
  if (!mounted || !isAuthenticated || pathname === '/login' || pathname === '/register') {
    return null
  }

  // Show Live Feed only if:
  // - User is Manager (always show)
  // - User is Owner with single shop (show)
  // - User is Owner with multiple shops (hide)
  const showLiveFeed = !isOwner || hasSingleShop
  
  // Managers don't see All Shops (they only have access to one shop)
  const showAllShops = isOwner

  // For live feed, add shopId parameter if needed
  const liveFeedHref = isOwner && selectedShop 
    ? `/live-feed?shopId=${selectedShop.id}` 
    : '/live-feed'

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, show: true },
    { name: 'All Shops', href: '/shops', icon: Store, show: showAllShops },
    { name: 'Live Feed', href: liveFeedHref, icon: Video, show: showLiveFeed },
    { name: 'Suspicious Activity', href: '/suspicious-activity', icon: AlertTriangle, show: true },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-200/80 dark:bg-slate-800/80 hover:bg-gray-300 dark:hover:bg-slate-700 backdrop-blur-sm text-blue-600 dark:text-blue-400 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gradient-to-b from-gray-50/95 to-gray-100/95 dark:from-slate-900/95 dark:to-slate-950/95 backdrop-blur-xl
          border-r border-gray-300/50 dark:border-slate-800/50
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Title */}
          <div className="px-6 py-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  VisionGuard.ai
                </h1>
                <p className="text-xs text-gray-600 dark:text-slate-400">Smart Anti Theft Eye</p>
              </div>
            </div>
          </div>

          {/* User Info Badge */}
          {user && (
            <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  isOwner 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-purple-600 text-white'
                }`}>
                  {user.role}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {user.name}
                </span>
              </div>
            </div>
          )}

          {/* Selected Shop Display - Only show for owners with single shop */}
          {selectedShop && showLiveFeed && isOwner && hasSingleShop && (
            <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-green-600 dark:text-green-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Viewing</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 truncate font-semibold">
                    {selectedShop.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10'
                        : 'text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200/50 dark:hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Theme Toggle */}
          <div className="px-6 py-4 border-t border-gray-300/50 dark:border-slate-800/50">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 bg-gray-200/50 dark:bg-slate-800/50 hover:bg-gray-300/50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300"
            >
              <span className="text-sm font-medium">Theme</span>
              <div className="flex items-center space-x-2">
                {theme === 'dark' ? (
                  <Moon size={18} className="text-blue-400" />
                ) : (
                  <Sun size={18} className="text-amber-500" />
                )}
              </div>
            </button>
          </div>

          {/* User Menu */}
          <div className="px-6 py-4 border-t border-gray-300/50 dark:border-slate-800/50">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-200/50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
