/** Wire types mirroring the backend DTOs. Kept hand-written and small on purpose. */

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'TOKEN_EXPIRED'
  | 'SCREEN_CONTEXT_REQUIRED'
  | 'SCREEN_NOT_FOUND'
  | 'SCREEN_API_MAPPING_DENIED'
  | 'SCREEN_ACCESS_DENIED'
  | 'ACTION_PERMISSION_DENIED'
  | 'RECORD_PERMISSION_DENIED'
  | 'FIELD_PERMISSION_DENIED'
  | 'VALIDATION_ERROR'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export interface ApiErrorBody {
  timestamp: string
  status: number
  code: ErrorCode
  message: string
  requestId: string
  details?: Record<string, unknown>
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
  username: string
  roles: string[]
}

export interface DemoAccount {
  username: string
  password: string
  description: string
}

export interface Me {
  userId: number
  username: string
  employeeId: number | null
  roles: string[]
}

export interface NavScreen {
  moduleKey: string
  submoduleKey: string | null
  screenCode: string
  name: string
  routePath: string | null
  actions: string[]
}

export interface NavSubmodule {
  submoduleKey: string
  name: string
  screens: NavScreen[]
}

export interface NavModule {
  moduleKey: string
  name: string
  screens: NavScreen[]
  submodules: NavSubmodule[]
}

export interface ScreenPermission {
  moduleKey: string
  submoduleKey: string | null
  screenCode: string
  screenName: string
  screenAccess: boolean
  allowedActions: string[]
  recordScopes: string[]
  readableFieldGroups: string[]
  creatableFieldGroups: string[]
  updatableFieldGroups: string[]
  readableFields: string[]
  creatableFields: string[]
  updatableFields: string[]
  sourceRoles: string[]
}

/** A row is an id plus only the fields the caller may read on the current screen. */
export interface FieldRow {
  id: number
  fields: Record<string, unknown>
}

export interface FieldPage {
  content: FieldRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  readableFields: string[]
}

// ---- organization pickers ----

export interface OrgOption {
  id: number
  code: string
  name: string
}

export interface OrgTeamOption extends OrgOption {
  departmentId: number | null
}

export interface OrganizationOptions {
  departments: OrgOption[]
  teams: OrgTeamOption[]
  managers: OrgOption[]
}

// ---- administration ----

export interface AdminModule {
  id: number
  moduleKey: string
  name: string
  ord: number
  active: boolean
}

export interface AdminSubmodule {
  id: number
  moduleKey: string
  submoduleKey: string
  name: string
  ord: number
  active: boolean
}

export interface AdminScreen {
  id: number
  moduleKey: string
  submoduleKey: string | null
  screenCode: string
  name: string
  routePath: string | null
  active: boolean
}

export interface AdminRole {
  id: number
  code: string
  name: string
  description: string | null
  kind: string
  system: boolean
  active: boolean
  userCount: number
}

export interface AdminAction {
  id: number
  code: string
  name: string
}

export interface AdminApiUseCase {
  id: number
  code: string
  name: string
  resource: string
  action: string
}

export interface AdminScreenApi {
  screenCode: string
  apiCode: string
}

export interface AdminField {
  id: number
  entityName: string
  fieldName: string
  displayLabel: string
  sensitive: boolean
  ord: number
}

export interface AdminFieldGroup {
  id: number
  code: string
  name: string
  description: string | null
  active: boolean
  fields: AdminField[]
}

export interface AdminUserRole {
  id: number
  roleId: number
  roleCode: string
  active: boolean
}

export interface AdminUser {
  id: number
  username: string
  employeeId: number | null
  employeeName: string | null
  active: boolean
  roles: AdminUserRole[]
}

export interface AdminResponsibility {
  id: number
  userId: number
  username: string
  responsibilityType: string
  targetType: string
  targetId: number
  targetName: string | null
  active: boolean
  validFrom: string | null
  validTo: string | null
}

export interface AdminTarget {
  targetType: string
  id: number
  code: string
  name: string
}

export interface AdminMetadata {
  modules: AdminModule[]
  submodules: AdminSubmodule[]
  screens: AdminScreen[]
  roles: AdminRole[]
  actions: AdminAction[]
  apiUseCases: AdminApiUseCase[]
  screenApiMappings: AdminScreenApi[]
  fieldGroups: AdminFieldGroup[]
  users: AdminUser[]
  responsibilities: AdminResponsibility[]
  responsibilityTargets: AdminTarget[]
}

export interface FieldGroupPermission {
  fieldGroupCode: string
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
}

export interface ScreenPermissionRow {
  screenId: number
  moduleKey: string
  submoduleKey: string | null
  screenCode: string
  screenName: string
  canAccess: boolean
  actions: string[]
  recordScopes: string[]
  fieldGroups: FieldGroupPermission[]
}

export interface RolePermissionMatrix {
  roleId: number
  roleCode: string
  roleName: string
  screens: ScreenPermissionRow[]
}

// ---- audit ----

export interface AuditLogRow {
  id: number
  requestId: string | null
  userId: number | null
  username: string | null
  action: string
  objectType: string | null
  objectId: string | null
  detail: string | null
  createdAt: string
}

export interface DecisionRow {
  id: number
  requestId: string | null
  userId: number | null
  username: string | null
  roles: string | null
  moduleKey: string | null
  submoduleKey: string | null
  screenCode: string | null
  apiCode: string | null
  resource: string | null
  action: string | null
  decision: 'ALLOW' | 'DENY'
  recordScopes: string | null
  fieldGroups: string | null
  reason: string | null
  durationMs: number | null
  createdAt: string
}

export interface AuditPage<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
