import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { tokenStore } from '@/shared/api/client'
import { authApi, meApi } from '@/shared/api/endpoints'
import { clearApiCalls } from '@/shared/permissions/debugStore'
import type { Me } from '@/shared/api/types'

interface AuthState {
  me: Me | null
  status: 'loading' | 'authenticated' | 'anonymous'
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [me, setMe] = useState<Me | null>(null)
  const [status, setStatus] = useState<AuthState['status']>('loading')

  const reset = useCallback(() => {
    tokenStore.clear()
    clearApiCalls()
    queryClient.clear()
    setMe(null)
    setStatus('anonymous')
  }, [queryClient])

  // Restore the session on reload; an invalid/expired pair simply drops us to the login screen.
  useEffect(() => {
    let cancelled = false
    if (!tokenStore.access()) {
      setStatus('anonymous')
      return
    }
    meApi
      .me()
      .then((identity) => {
        if (cancelled) return
        setMe(identity)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!cancelled) reset()
      })
    return () => {
      cancelled = true
    }
  }, [reset])

  useEffect(() => {
    const onExpired = () => reset()
    window.addEventListener('eal:session-expired', onExpired)
    return () => window.removeEventListener('eal:session-expired', onExpired)
  }, [reset])

  const login = useCallback(
    async (username: string, password: string) => {
      const tokens = await authApi.login(username, password)
      tokenStore.set(tokens)
      clearApiCalls()
      queryClient.clear()
      const identity = await meApi.me()
      setMe(identity)
      setStatus('authenticated')
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.refresh()
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => undefined)
    }
    reset()
  }, [reset])

  const value = useMemo<AuthState>(() => ({ me, status, login, logout }), [me, status, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
