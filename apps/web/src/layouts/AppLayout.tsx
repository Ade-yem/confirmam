import React from 'react'
import { AppNav } from '@/components/common/AppNav'
import { ConnectionBanner } from '@/components/common/ConnectionBanner'
import { useConnectionStore } from '@/store/connectionStore'
import { cn } from '@/utils/cn'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { networkOnline, sseConnected } = useConnectionStore()
  const bannerActive = !networkOnline || !sseConnected

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <ConnectionBanner />
      
      {/* 
        This wrapper gains a top padding equal to the banner's height when active, 
        ensuring that the connection warning pushes the rest of the application 
        layout downwards.
      */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          bannerActive ? "pt-[44px]" : "pt-0"
        )}
      >
        <AppNav />
        
        {/*
          Content spacing adjusted mobile-first:
          - Mobile: pb-20 to clear the fixed bottom nav bar.
          - Tablet (md): pl-24 (width of the left nav rail).
          - Desktop (lg): pl-60 (width of the left sidebar).
        */}
        <main className="flex-1 pb-24">
          <div className="max-w-7xl mx-auto w-full min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
