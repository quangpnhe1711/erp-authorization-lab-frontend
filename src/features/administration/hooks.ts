import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/shared/api/endpoints'
import type { AdminMetadata, RolePermissionMatrix } from '@/shared/api/types'
import type { ScreenContext } from '@/shared/permissions/screens'

/**
 * One metadata payload feeds every ADMINISTRATION screen. It is keyed by screen code because the
 * backend authorizes it per screen — a user allowed on USER_MANAGEMENT but not on ROLE_MANAGEMENT
 * must not reuse a cached answer from the other screen.
 */
export function useAdminMetadata(screen: ScreenContext) {
  return useQuery<AdminMetadata>({
    queryKey: ['admin-metadata', screen.screenCode],
    queryFn: () => adminApi.metadata(screen),
    staleTime: 30_000,
  })
}

export function useRolePermissions(screen: ScreenContext, roleId: number | null) {
  return useQuery<RolePermissionMatrix>({
    queryKey: ['role-permissions', screen.screenCode, roleId],
    queryFn: () => adminApi.rolePermissions(screen, roleId!),
    enabled: roleId != null,
  })
}
