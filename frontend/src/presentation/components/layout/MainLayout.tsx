import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Persisted Sidebar */}
      <Sidebar />
      
      {/* Dynamic Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden pt-16 md:pt-0">
        <div className="h-full">
           <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout
