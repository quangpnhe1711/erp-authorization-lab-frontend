import { useMemo, type ReactNode } from 'react'
import { ApiError } from '@/shared/api/client'
import { DiagnosticsPanel } from '@/shared/devmode/DiagnosticsPanel'
import { ErrorState } from '@/shared/ui/feedback'
import { SkeletonCard } from '@/shared/ui/primitives'
import { ActiveScreenContext, useActiveScreen, type ActiveScreen } from './activeScreen'
import { useScreenPermission } from './hooks'
import type { ScreenContext } from './screens'

/**
 * Route gate. It asks the server what this person may do here before rendering, so an area they
 * were never granted shows a plain explanation instead of an empty page. The answer only shapes
 * the interface — the API enforces it again on every call.
 */
export function ScreenGuard({ screen, children }: { screen: ScreenContext; children: ReactNode }) {
  const { data: permission, isLoading, error } = useScreenPermission(screen)
  const value = useMemo<ActiveScreen>(() => ({ screen, permission }), [screen, permission])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (error) return <ErrorState error={error} />

  if (!permission?.screenAccess) {
    const denial = new ApiError({
      timestamp: new Date().toISOString(),
      status: 403,
      code: 'SCREEN_ACCESS_DENIED',
      message: `No access to ${screen.screenCode}`,
      requestId: '',
      details: { screenCode: screen.screenCode },
    })
    return (
      <ActiveScreenContext.Provider value={value}>
        <div className="rounded-card border border-line bg-surface shadow-card" data-testid="screen-access-denied">
          <ErrorState error={denial} />
        </div>
        <DiagnosticsPanel />
      </ActiveScreenContext.Provider>
    )
  }

  return (
    <ActiveScreenContext.Provider value={value}>
      {children}
      <DiagnosticsPanel />
    </ActiveScreenContext.Provider>
  )
}

/**
 * Shows an action only when this person can actually perform it. Hiding beats disabling here:
 * a button nobody in this role will ever use is noise, not a teaching moment.
 */
export function ActionGate({
  action,
  children,
  fallback = null,
}: {
  action: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { permission } = useActiveScreen()
  return <>{permission?.allowedActions.includes(action) ? children : fallback}</>
}
