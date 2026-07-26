import { useQuery } from '@tanstack/react-query'
import { meApi } from '@/shared/api/endpoints'
import type { NavModule, ScreenPermission } from '@/shared/api/types'
import type { ScreenContext } from './screens'

/** The nav tree the server says this user may open. Never derived from role names in the UI. */
export function useNavigation() {
  return useQuery<NavModule[]>({
    queryKey: ['navigation'],
    queryFn: meApi.navigation,
    staleTime: 60_000,
  })
}

/** Effective permission on one screen — drives buttons, columns and the debug drawer (spec §20). */
export function useScreenPermission(screen: ScreenContext) {
  return useQuery<ScreenPermission>({
    queryKey: ['screen-permission', screen.moduleKey, screen.submoduleKey ?? '', screen.screenCode],
    queryFn: () => meApi.screenPermission(screen),
    staleTime: 60_000,
  })
}

export function can(permission: ScreenPermission | undefined, action: string): boolean {
  return Boolean(permission?.screenAccess && permission.allowedActions.includes(action))
}

export function canReadField(permission: ScreenPermission | undefined, field: string): boolean {
  return Boolean(permission?.readableFields.includes(field))
}

export function canUpdateField(permission: ScreenPermission | undefined, field: string): boolean {
  return Boolean(permission?.updatableFields.includes(field))
}

/** Flatten the nav tree so a route can ask "may I open this screen?" without walking modules. */
export function accessibleScreenCodes(navigation: NavModule[] | undefined): Set<string> {
  const codes = new Set<string>()
  for (const mod of navigation ?? []) {
    for (const screen of mod.screens) codes.add(screen.screenCode)
    for (const sub of mod.submodules) {
      for (const screen of sub.screens) codes.add(screen.screenCode)
    }
  }
  return codes
}
