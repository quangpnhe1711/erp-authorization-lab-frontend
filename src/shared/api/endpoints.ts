import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client'
import type { ScreenContext } from '@/shared/permissions/screens'
import { SCREENS } from '@/shared/permissions/screens'
import type {
  AdminMetadata,
  AuditLogRow,
  AuditPage,
  DecisionRow,
  DemoAccount,
  FieldPage,
  FieldRow,
  Me,
  NavModule,
  OrganizationOptions,
  RolePermissionMatrix,
  ScreenPermission,
  ScreenPermissionRow,
  TokenResponse,
} from './types'

// ---------------------------------------------------------------- auth / identity

export const authApi = {
  login: (username: string, password: string) =>
    apiPost<TokenResponse>('/api/auth/login', { username, password }),
  refresh: (refreshToken: string) => apiPost<TokenResponse>('/api/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => apiPost<void>('/api/auth/logout', { refreshToken }),
  demoAccounts: () => apiGet<DemoAccount[]>('/api/auth/demo-accounts'),
}

export const meApi = {
  me: () => apiGet<Me>('/api/me'),
  navigation: () => apiGet<NavModule[]>('/api/me/navigation'),
  screenPermission: (screen: ScreenContext) =>
    apiGet<ScreenPermission>('/api/me/screen-permission', {
      params: {
        moduleKey: screen.moduleKey,
        submoduleKey: screen.submoduleKey ?? '',
        screenCode: screen.screenCode,
      },
    }),
}

// ---------------------------------------------------------------- employees

export interface EmployeeQuery {
  q?: string
  departmentId?: number
  teamId?: number
  status?: string
  page?: number
  size?: number
}

export const employeeApi = {
  /** Same endpoint, different screen → different rows and fields (spec §7/§25). */
  search: (screen: ScreenContext, params: EmployeeQuery = {}) =>
    apiGet<FieldPage>('/api/employees', { screen, apiCode: 'EMPLOYEE_SEARCH', params }),

  detail: (screen: ScreenContext, id: number) =>
    apiGet<FieldRow>(`/api/employees/${id}`, { screen, apiCode: 'EMPLOYEE_DETAIL' }),

  update: (screen: ScreenContext, id: number, values: Record<string, unknown>) =>
    apiPatch<FieldRow>(`/api/employees/${id}`, values, { screen, apiCode: 'EMPLOYEE_UPDATE' }),

  create: (values: Record<string, unknown>) =>
    apiPost<FieldRow>('/api/employees', values, {
      screen: SCREENS.EMPLOYEE_CREATE,
      apiCode: 'EMPLOYEE_CREATE',
    }),

  salaries: (params: EmployeeQuery = {}) =>
    apiGet<FieldPage>('/api/salaries', { screen: SCREENS.SALARY_LIST, apiCode: 'SALARY_SEARCH', params }),
}

export const organizationApi = {
  /** id→label pickers for department / team / manager; managers are already scope-filtered. */
  options: (screen: ScreenContext) =>
    apiGet<OrganizationOptions>('/api/organization/options', { screen, apiCode: 'ORGANIZATION_OPTIONS' }),
}

// ---------------------------------------------------------------- projects

export const projectApi = {
  search: (screen: ScreenContext, params: { q?: string; page?: number; size?: number } = {}) =>
    apiGet<FieldPage>('/api/projects', { screen, apiCode: 'PROJECT_SEARCH', params }),

  detail: (screen: ScreenContext, id: number) =>
    apiGet<FieldRow>(`/api/projects/${id}`, { screen, apiCode: 'PROJECT_SEARCH' }),

  members: (id: number, params: { page?: number; size?: number } = {}) =>
    apiGet<FieldPage>(`/api/projects/${id}/members`, {
      screen: SCREENS.MEMBER_LIST,
      apiCode: 'PROJECT_MEMBER_SEARCH',
      params,
    }),

  addMember: (id: number, employeeId: number, roleInProject: string) =>
    apiPost<void>(
      `/api/projects/${id}/members`,
      { employeeId, roleInProject },
      { screen: SCREENS.EMPLOYEE_PICKER, apiCode: 'PROJECT_MEMBER_ASSIGN' },
    ),
}

// ---------------------------------------------------------------- administration

export const adminApi = {
  metadata: (screen: ScreenContext) =>
    apiGet<AdminMetadata>('/api/admin/metadata', { screen, apiCode: 'ADMIN_METADATA_READ' }),

  rolePermissions: (screen: ScreenContext, roleId: number) =>
    apiGet<RolePermissionMatrix>(`/api/admin/role-permissions/${roleId}`, {
      screen,
      apiCode: 'ADMIN_ROLE_PERMISSION_READ',
    }),

  saveRolePermissions: (screen: ScreenContext, roleId: number, screens: ScreenPermissionRow[]) =>
    apiPut<RolePermissionMatrix>(
      `/api/admin/role-permissions/${roleId}`,
      {
        screens: screens.map((s) => ({
          screenId: s.screenId,
          canAccess: s.canAccess,
          actions: s.actions,
          recordScopes: s.recordScopes,
          fieldGroups: s.fieldGroups,
        })),
      },
      { screen, apiCode: 'ADMIN_ROLE_PERMISSION_WRITE' },
    ),

  assignUserRole: (userId: number, roleId: number) =>
    apiPost<{ id: number }>(
      '/api/admin/user-roles',
      { userId, roleId },
      { screen: SCREENS.USER_ROLE_ASSIGNMENT, apiCode: 'ADMIN_USER_ROLE_ASSIGN' },
    ),

  revokeUserRole: (userRoleId: number) =>
    apiDelete<void>(`/api/admin/user-roles/${userRoleId}`, {
      screen: SCREENS.USER_ROLE_ASSIGNMENT,
      apiCode: 'ADMIN_USER_ROLE_REVOKE',
    }),

  assignResponsibility: (body: {
    userId: number
    responsibilityType: string
    targetType: string
    targetId: number
  }) =>
    apiPost<{ id: number }>('/api/admin/responsibilities', body, {
      screen: SCREENS.RESPONSIBILITY_ASSIGNMENT,
      apiCode: 'ADMIN_RESPONSIBILITY_ASSIGN',
    }),

  revokeResponsibility: (id: number) =>
    apiDelete<void>(`/api/admin/responsibilities/${id}`, {
      screen: SCREENS.RESPONSIBILITY_ASSIGNMENT,
      apiCode: 'ADMIN_RESPONSIBILITY_REVOKE',
    }),
}

// ---------------------------------------------------------------- audit

export const auditApi = {
  logs: (params: { action?: string; userId?: number; page?: number; size?: number } = {}) =>
    apiGet<AuditPage<AuditLogRow>>('/api/audit/logs', {
      screen: SCREENS.AUDIT_LOG_LIST,
      apiCode: 'AUDIT_LOG_SEARCH',
      params,
    }),

  decisions: (
    params: { decision?: string; screenCode?: string; userId?: number; page?: number; size?: number } = {},
  ) =>
    apiGet<AuditPage<DecisionRow>>('/api/audit/decisions', {
      screen: SCREENS.PERMISSION_DECISION_TRACE,
      apiCode: 'PERMISSION_DECISION_SEARCH',
      params,
    }),
}
