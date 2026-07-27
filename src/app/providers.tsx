import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ApiError } from '@/shared/api/client'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import { DeveloperModeProvider } from '@/shared/devmode/DeveloperModeProvider'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // A 403 is a permission answer, not a hiccup — retrying it just spams the decision log.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}

export function AppProviders({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const queryClient = client ?? createQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <DeveloperModeProvider>
            <AuthProvider>{children}</AuthProvider>
          </DeveloperModeProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
