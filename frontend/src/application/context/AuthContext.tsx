import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetMeQuery, useLoginMutation } from '../../infrastructure/api/authApi'

interface User {
  id: string
  email: string
  orgId?: string
  role: string
  firstName?: string | null
  lastName?: string | null
  accountId?: string | null
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (credentials: any) => Promise<any>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()
  const { data: userData, isLoading: isGettingUser } = useGetMeQuery(undefined, {
    skip: !localStorage.getItem('accessToken'),
  })
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation()

  useEffect(() => {
    if (userData) {
      setUser(userData as User)
    }
  }, [userData])

  useEffect(() => {
    const handle = () => {
      setUser(null)
    }
    window.addEventListener('auth:expired', handle)
    return () => window.removeEventListener('auth:expired', handle)
  }, [])

  const login = async (credentials: any) => {
    const result = await loginMutation(credentials).unwrap()
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      // The user will be automatically loaded by RTK Query's getMe after re-render
      // If the backend /me doesn't exist, we can manually set user from result
      if (result.user) setUser(result.user)
    }
    return result
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    navigate('/')
  }

  const value = {
    user,
    isAuthenticated: !!user || !!localStorage.getItem('accessToken'),
    login,
    logout,
    isLoading: isGettingUser || isLoggingIn,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
