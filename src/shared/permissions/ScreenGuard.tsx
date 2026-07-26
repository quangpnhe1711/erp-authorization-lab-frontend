import { useMemo, type ReactNode } from 'react'
import { Alert, ApiErrorPanel } from '@/shared/ui/feedback'
import { Spinner } from '@/shared/ui/primitives'
import { ActiveScreenContext, useActiveScreen, type ActiveScreen } from './activeScreen'
import { useScreenPermission } from './hooks'
import { PermissionDebugDrawer } from './PermissionDebugDrawer'
import type { ScreenContext } from './screens'

/**
 * Route-level gate. It asks the server for the effective permission before rendering, so a screen
 * the user cannot access never mounts — but the answer is advisory only: every API call is still
 * checked server-side (spec §16, §20). Each guarded screen also carries its own debug drawer.
 */
export function ScreenGuard({ screen, children }: { screen: ScreenContext; children: ReactNode }) {
  const { data: permission, isLoading, error } = useScreenPermission(screen)
  const value = useMemo<ActiveScreen>(() => ({ screen, permission }), [screen, permission])

  if (isLoading) return <Spinner label="Đang kiểm tra quyền truy cập màn hình…" />
  if (error) return <ApiErrorPanel error={error} />

  if (!permission?.screenAccess) {
    return (
      <div data-testid="screen-access-denied" data-error-code="SCREEN_ACCESS_DENIED">
        <Alert tone="warning" title="SCREEN_ACCESS_DENIED">
          Bạn không có quyền truy cập màn hình <strong>{screen.screenCode}</strong>. Quyền màn hình được cấu hình ở{' '}
          <em>role_screen_permissions</em>.
        </Alert>
      </div>
    )
  }

  return (
    <ActiveScreenContext.Provider value={value}>
      {children}
      <PermissionDebugDrawer />
    </ActiveScreenContext.Provider>
  )
}

/** Renders children only when the screen grants the action; otherwise nothing (or a fallback). */
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
  const allowed = Boolean(permission?.allowedActions.includes(action))
  return <>{allowed ? children : fallback}</>
}
