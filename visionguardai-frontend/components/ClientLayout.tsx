'use client'

import { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import NotificationModal from '@/components/NotificationModal'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { NotificationProvider, useNotifications } from '@/context/NotificationContext'
import { ShopProvider } from '@/context/ShopContext'

function ClientLayoutInner({ children }: { children: ReactNode }) {
  const { currentNotification, clearNotification } = useNotifications()

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 lg:px-8">{children}</div>
        </main>
      </div>
      <NotificationModal
        notification={currentNotification}
        onClose={clearNotification}
      />
    </>
  )
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ShopProvider>
          <NotificationProvider>
            <ClientLayoutInner>{children}</ClientLayoutInner>
          </NotificationProvider>
        </ShopProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
