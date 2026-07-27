/**
 * Wire types of the Authorization Configuration Lab — the TypeScript face of `LabDtos`.
 *
 * Note there is no shared `scope` anywhere: read, update and unmask each carry their own
 * {@link ActionPermission}. Collapsing them into one field is the exact mistake the model forbids.
 */

export type ScopeCode =
  | 'NONE'
  | 'SELF'
  | 'ASSIGNED'
  | 'DIRECT_REPORTS'
  | 'TEAM'
  | 'DEPARTMENT'
  | 'DEPARTMENT_TREE'
  | 'RESPONSIBILITY'
  | 'ALL'

export type PiiClass = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'HIGHLY_CONFIDENTIAL'

export type ActionName = 'read' | 'update' | 'unmask'

export interface ScopeOption {
  code: ScopeCode
  name: string
  description: string | null
}

export interface ScopeContainment {
  narrower: ScopeCode
  wider: ScopeCode
}

export interface Vocabulary {
  scopes: ScopeOption[]
  containments: ScopeContainment[]
  resourceActions: string[]
  piiClasses: PiiClass[]
}

export interface RoleSummary {
  id: number
  code: string
  name: string
  description: string | null
  kind: string
  system: boolean
  active: boolean
  modules: string[]
  userCount: number
  screenCount: number
}

export interface ScreenSummary {
  id: number
  moduleKey: string
  submoduleKey: string | null
  screenCode: string
  name: string
  routePath: string | null
  resourceCode: string | null
  active: boolean
  fieldGroups: string[]
}

export interface ModuleSummary {
  id: number
  moduleKey: string
  name: string
  description: string | null
  active: boolean
  screens: ScreenSummary[]
}

export interface FieldSummary {
  id: number
  serviceName: string
  resourceCode: string | null
  tableName: string | null
  columnName: string | null
  entityName: string
  fieldName: string
  displayName: string
  dataType: string
  piiClass: PiiClass
  maskStyle: string
  sensitive: boolean
  groups: string[]
  screens: string[]
}

export interface FieldGroupSummary {
  id: number
  code: string
  name: string
  description: string | null
  active: boolean
  fields: FieldSummary[]
  screens: string[]
  grantedRoles: string[]
  overlappingGroups: string[]
}

export interface UserRoleAssignment {
  id: number
  roleId: number
  roleCode: string
  roleName: string
  active: boolean
  validFrom: string | null
  validTo: string | null
}

export interface UserSummary {
  id: number
  username: string
  employeeId: number | null
  employeeName: string | null
  departmentName: string | null
  active: boolean
  roles: UserRoleAssignment[]
}

export interface ActionPermission {
  enabled: boolean
  scope: ScopeCode | null
}

export interface GroupPermissionView {
  groupCode: string
  groupName: string
  attachedToScreen: boolean
  containsPii: boolean
  read: ActionPermission
  update: ActionPermission
  unmask: ActionPermission
  multiGroupFields: string[]
}

export interface ResourceActionView {
  resourceCode: string | null
  actionCode: string
  enabled: boolean
  scope: ScopeCode | null
}

export interface ScreenConfig {
  screenId: number
  screenCode: string
  screenName: string
  moduleKey: string
  submoduleKey: string | null
  resourceCode: string | null
  canEnter: boolean
  maxRecordScope: ScopeCode | null
  groups: GroupPermissionView[]
  resourceActions: ResourceActionView[]
}

export interface ValidationIssue {
  severity: 'ERROR' | 'WARNING'
  code: string
  message: string
  roleCode: string | null
  screenCode: string | null
  groupCode: string | null
  fieldName: string | null
}

export interface RoleScreenConfig {
  roleId: number
  roleCode: string
  roleName: string
  roleModules: string[]
  screen: ScreenConfig
  issues: ValidationIssue[]
}

export interface GroupPermissionUpdate {
  groupKey: string
  read: ActionPermission
  update: ActionPermission
  unmask: ActionPermission
}

export interface ResourceActionUpdate {
  actionCode: string
  enabled: boolean
  scope: ScopeCode | null
}

export interface ScreenConfigUpdate {
  roleCode: string
  screenKey: string
  canEnter: boolean
  maxRecordScope: ScopeCode | null
  groups: GroupPermissionUpdate[]
  resourceActions: ResourceActionUpdate[]
}

export interface ImpactChange {
  fieldName: string
  action: ActionName
  from: ScopeCode[]
  to: ScopeCode[]
  widening: boolean
}

export interface ImpactAnalysis {
  changes: ImpactChange[]
  affectedUsers: number
  affectedRoles: number
  affectedScreens: number
  affectedUsernames: string[]
  warnings: ValidationIssue[]
}

export interface SaveResult {
  config: RoleScreenConfig | null
  impact: ImpactAnalysis
  warnings: ValidationIssue[]
}

export interface ScopeSource {
  roleCode: string
  groupCode: string | null
  scope: ScopeCode | null
}

export interface ActionDecision {
  allowed: boolean
  matchedScope: ScopeCode | null
  requiredScope: ScopeCode[]
  sources: ScopeSource[]
}

export interface FieldDecision {
  fieldName: string
  displayName: string
  piiClass: PiiClass
  sensitive: boolean
  groups: string[]
  read: ActionDecision
  update: ActionDecision
  unmask: ActionDecision
  returnedValuePolicy: 'VISIBLE' | 'MASKED' | 'HIDDEN'
  value: unknown
}

export interface TargetRecordRequest {
  resource: string
  id: string
  ownerUserId?: number | null
  managerUserId?: number | null
  departmentId?: number | null
  teamId?: number | null
  projectId?: number | null
  assignedUserIds?: number[]
}

export interface ResolveRequest {
  userId: number
  screenKey: string
  targetRecord: TargetRecordRequest | null
}

export interface ResolveResponse {
  canEnter: boolean
  effectiveRecordScopes: Record<ActionName, ScopeCode[]>
  screenAccessSources: ScopeSource[]
  resourceActions: Record<string, ActionDecision>
  fields: Record<string, FieldDecision>
  trace: string[]
}

export interface AuditEvent {
  id: number
  requestId: string | null
  actor: string | null
  event: string
  roleCode: string | null
  screenCode: string | null
  fieldGroupCode: string | null
  objectType: string | null
  objectId: string | null
  before: unknown
  after: unknown
  createdAt: string
}

export interface DashboardStats {
  roles: number
  modules: number
  screens: number
  fieldGroups: number
  fields: number
  fieldsInMultipleGroups: number
  violatingConfigurations: number
  sensitiveFieldsWithoutUnmaskPolicy: number
  users: number
  recentChanges: AuditEvent[]
  issues: ValidationIssue[]
}

export interface FieldGroupClone {
  newCode: string
  newName: string
  copyPermissions: boolean
  attachToSourceScreens: boolean
  screenCodes: string[]
}
