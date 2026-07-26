import { createContext, useContext } from 'react'
import type { ScreenPermission } from '@/shared/api/types'
import type { ScreenContext } from './screens'

export interface ActiveScreen {
  screen: ScreenContext
  permission: ScreenPermission | undefined
}

/** Set by ScreenGuard; read by the screen body and the permission debug drawer. */
export const ActiveScreenContext = createContext<ActiveScreen | null>(null)

export function useActiveScreen(): ActiveScreen {
  const ctx = useContext(ActiveScreenContext)
  if (!ctx) throw new Error('useActiveScreen must be used inside <ScreenGuard>')
  return ctx
}
