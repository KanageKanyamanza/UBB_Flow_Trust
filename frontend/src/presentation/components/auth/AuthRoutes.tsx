import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../../application/context/AuthContext'

interface ProtectedRouteProps {
  redirectPath?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath = '/login' }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}

export const PublicRoute: React.FC<{ redirectPath?: string }> = ({ redirectPath = '/dashboard' }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}
