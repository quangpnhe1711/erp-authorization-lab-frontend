import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/shared/api/client'
import type {
  AuditEvent,
  DashboardStats,
  FieldGroupClone,
  FieldGroupSummary,
  FieldSummary,
  ModuleSummary,
  ResolveRequest,
  ResolveResponse,
  ImpactAnalysis,
  RoleScreenConfig,
  RoleSummary,
  SaveResult,
  ScopeCode,
  ScreenConfigUpdate,
  ScreenSummary,
  UserSummary,
  Vocabulary,
} from './types'

/**
 * Lab endpoints carry no screen-context headers: they configure the permission model rather than
 * being governed by it, so they are authorised by role on the server side (see SecurityConfig).
 */
export const labApi = {
  vocabulary: () => apiGet<Vocabulary>('/api/scopes'),
  roles: () => apiGet<RoleSummary[]>('/api/roles'),
  modules: () => apiGet<ModuleSummary[]>('/api/modules'),
  screens: () => apiGet<ScreenSummary[]>('/api/screens'),
  fields: () => apiGet<FieldSummary[]>('/api/fields'),
  fieldGroups: () => apiGet<FieldGroupSummary[]>('/api/field-groups'),
  users: () => apiGet<UserSummary[]>('/api/users'),
  dashboard: () => apiGet<DashboardStats>('/api/lab-dashboard'),
  auditEvents: (params: { limit?: number; roleCode?: string } = {}) =>
    apiGet<AuditEvent[]>('/api/audit-events', { params }),

  roleScreenConfig: (roleCode: string, screenKey: string) =>
    apiGet<RoleScreenConfig>('/api/role-group-permissions', { params: { roleCode, screenKey } }),

  saveScreenConfig: (update: ScreenConfigUpdate) =>
    apiPut<SaveResult>('/api/role-group-permissions', update),

  impact: (update: ScreenConfigUpdate) =>
    apiPost<ImpactAnalysis>('/api/role-group-permissions/impact', update),

  screenAccess: (body: {
    roleCode: string
    screenKey: string
    canEnter: boolean
    maxRecordScope: ScopeCode | null
  }) => apiPut<RoleScreenConfig>('/api/role-screen-access', body),

  resolve: (request: ResolveRequest) =>
    apiPost<ResolveResponse>('/api/effective-permissions/resolve', request),

  createFieldGroup: (body: {
    code: string
    name: string
    description?: string | null
    fieldNames: string[]
    screenCodes: string[]
  }) => apiPost<FieldGroupSummary>('/api/field-groups', body),

  renameFieldGroup: (code: string, body: { name: string; description?: string | null }) =>
    apiPatch<FieldGroupSummary>(`/api/field-groups/${code}`, body),

  replaceGroupFields: (code: string, fieldNames: string[]) =>
    apiPut<FieldGroupSummary>(`/api/field-groups/${code}/fields`, { fieldNames }),

  replaceGroupScreens: (code: string, screenCodes: string[]) =>
    apiPut<FieldGroupSummary>(`/api/field-groups/${code}/screens`, { screenCodes }),

  cloneFieldGroup: (code: string, body: FieldGroupClone) =>
    apiPost<SaveResult>(`/api/field-groups/${code}/clone`, body),

  assignRole: (body: { userId: number; roleCode: string; validFrom?: string; validTo?: string }) =>
    apiPost<UserSummary[]>('/api/user-roles', body),

  revokeRole: (userRoleId: number) => apiDelete<UserSummary[]>(`/api/user-roles/${userRoleId}`),
}
