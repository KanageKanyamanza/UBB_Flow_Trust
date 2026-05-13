import React, { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'

const MainLayout: React.FC = () => {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Persisted Sidebar */}
      <Sidebar />
      
      {/* Dynamic Content Area */}
      <main ref={mainRef} className="flex-1 relative overflow-y-auto overflow-x-hidden pt-16 md:pt-0">
        <div className="h-full">
           <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout
