/**
 * Screen-context registry (spec §6). Every business call must announce which screen it comes from;
 * the backend re-resolves that claim against the DB, so this table is a convenience, never a grant.
 */
export interface ScreenContext {
  moduleKey: string
  submoduleKey?: string
  screenCode: string
}

export const SCREENS = {
  DASHBOARD: { moduleKey: 'DASHBOARD', screenCode: 'DASHBOARD' },

  MY_PROFILE: { moduleKey: 'HRM', submoduleKey: 'EMPLOYEE', screenCode: 'MY_PROFILE' },
  EMPLOYEE_LIST: { moduleKey: 'HRM', submoduleKey: 'EMPLOYEE', screenCode: 'EMPLOYEE_LIST' },
  EMPLOYEE_DETAIL: { moduleKey: 'HRM', submoduleKey: 'EMPLOYEE', screenCode: 'EMPLOYEE_DETAIL' },
  EMPLOYEE_CREATE: { moduleKey: 'HRM', submoduleKey: 'EMPLOYEE', screenCode: 'EMPLOYEE_CREATE' },
  EMPLOYEE_EDIT: { moduleKey: 'HRM', submoduleKey: 'EMPLOYEE', screenCode: 'EMPLOYEE_EDIT' },
  SALARY_LIST: { moduleKey: 'HRM', submoduleKey: 'SALARY', screenCode: 'SALARY_LIST' },

  PROJECT_LIST: { moduleKey: 'PROJECT', submoduleKey: 'PROJECT', screenCode: 'PROJECT_LIST' },
  PROJECT_DETAIL: { moduleKey: 'PROJECT', submoduleKey: 'PROJECT', screenCode: 'PROJECT_DETAIL' },
  MEMBER_LIST: { moduleKey: 'PROJECT', submoduleKey: 'PROJECT_MEMBER', screenCode: 'MEMBER_LIST' },
  EMPLOYEE_PICKER: { moduleKey: 'PROJECT', submoduleKey: 'PROJECT_MEMBER', screenCode: 'EMPLOYEE_PICKER' },

  USER_MANAGEMENT: { moduleKey: 'ADMINISTRATION', submoduleKey: 'ADMIN', screenCode: 'USER_MANAGEMENT' },
  ROLE_MANAGEMENT: { moduleKey: 'ADMINISTRATION', submoduleKey: 'ADMIN', screenCode: 'ROLE_MANAGEMENT' },
  MODULE_MANAGEMENT: { moduleKey: 'ADMINISTRATION', submoduleKey: 'ADMIN', screenCode: 'MODULE_MANAGEMENT' },
  SUBMODULE_MANAGEMENT: { moduleKey: 'ADMINISTRATION', submoduleKey: 'ADMIN', screenCode: 'SUBMODULE_MANAGEMENT' },
  SCREEN_MANAGEMENT: { moduleKey: 'ADMINISTRATION', submoduleKey: 'ADMIN', screenCode: 'SCREEN_MANAGEMENT' },
  SCREEN_PERMISSION_CONFIG: {
    moduleKey: 'ADMINISTRATION',
    submoduleKey: 'ADMIN',
    screenCode: 'SCREEN_PERMISSION_CONFIG',
  },
  RECORD_SCOPE_CONFIG: { moduleKey: 'ADMINISTRATION', submoduleKey: 'ADMIN', screenCode: 'RECORD_SCOPE_CONFIG' },
  FIELD_GROUP_CONFIG: { moduleKey: 'ADMINISTRATION', submoduleKey: 'ADMIN', screenCode: 'FIELD_GROUP_CONFIG' },
  FIELD_GROUP_PERMISSION_CONFIG: {
    moduleKey: 'ADMINISTRATION',
    submoduleKey: 'ADMIN',
    screenCode: 'FIELD_GROUP_PERMISSION_CONFIG',
  },
  USER_ROLE_ASSIGNMENT: { moduleKey: 'ADMINISTRATION', submoduleKey: 'ADMIN', screenCode: 'USER_ROLE_ASSIGNMENT' },
  RESPONSIBILITY_ASSIGNMENT: {
    moduleKey: 'ADMINISTRATION',
    submoduleKey: 'ADMIN',
    screenCode: 'RESPONSIBILITY_ASSIGNMENT',
  },

  AUDIT_LOG_LIST: { moduleKey: 'AUDIT', submoduleKey: 'AUDIT', screenCode: 'AUDIT_LOG_LIST' },
  PERMISSION_DECISION_TRACE: { moduleKey: 'AUDIT', submoduleKey: 'AUDIT', screenCode: 'PERMISSION_DECISION_TRACE' },
} as const satisfies Record<string, ScreenContext>

export type ScreenKey = keyof typeof SCREENS

export function screenContextHeaders(ctx: ScreenContext): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Module-Key': ctx.moduleKey,
    'X-Screen-Code': ctx.screenCode,
  }
  if (ctx.submoduleKey) headers['X-Submodule-Key'] = ctx.submoduleKey
  return headers
}

/** Route path each screen owns, mirroring screens.route_path in the database. */
export const SCREEN_ROUTES: Record<ScreenKey, string> = {
  DASHBOARD: '/dashboard',
  MY_PROFILE: '/hrm/my-profile',
  EMPLOYEE_LIST: '/hrm/employees',
  EMPLOYEE_DETAIL: '/hrm/employees/:id',
  EMPLOYEE_CREATE: '/hrm/employees/new',
  EMPLOYEE_EDIT: '/hrm/employees/:id/edit',
  SALARY_LIST: '/hrm/salaries',
  PROJECT_LIST: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  MEMBER_LIST: '/projects/:id/members',
  EMPLOYEE_PICKER: '/projects/:id/members/add',
  USER_MANAGEMENT: '/admin/users',
  ROLE_MANAGEMENT: '/admin/roles',
  MODULE_MANAGEMENT: '/admin/modules',
  SUBMODULE_MANAGEMENT: '/admin/submodules',
  SCREEN_MANAGEMENT: '/admin/screens',
  SCREEN_PERMISSION_CONFIG: '/admin/screen-permissions',
  RECORD_SCOPE_CONFIG: '/admin/record-scopes',
  FIELD_GROUP_CONFIG: '/admin/field-groups',
  FIELD_GROUP_PERMISSION_CONFIG: '/admin/field-group-permissions',
  USER_ROLE_ASSIGNMENT: '/admin/user-roles',
  RESPONSIBILITY_ASSIGNMENT: '/admin/responsibilities',
  AUDIT_LOG_LIST: '/audit/logs',
  PERMISSION_DECISION_TRACE: '/audit/decisions',
}

/** Human labels for the field names the backend returns (used for table headers and detail rows). */
export const FIELD_LABELS: Record<string, string> = {
  employeeCode: 'Mã nhân viên',
  fullName: 'Họ và tên',
  companyEmail: 'Email công ty',
  jobTitle: 'Chức danh',
  personalEmail: 'Email cá nhân',
  phoneNumber: 'Số điện thoại',
  dateOfBirth: 'Ngày sinh',
  department: 'Phòng ban',
  team: 'Nhóm',
  manager: 'Quản lý',
  contractType: 'Loại hợp đồng',
  status: 'Trạng thái',
  salary: 'Lương',
  bankAccount: 'Tài khoản ngân hàng',
  projectName: 'Dự án',
  roleInProject: 'Vai trò trong dự án',
  projectCode: 'Mã dự án',
  projectStatus: 'Trạng thái dự án',
  projectDepartment: 'Phòng ban phụ trách',
}

/** Which field group a field belongs to — used to section the detail view (spec §9). */
export const FIELD_GROUP_OF: Record<string, string> = {
  employeeCode: 'PUBLIC_INFORMATION',
  fullName: 'PUBLIC_INFORMATION',
  companyEmail: 'PUBLIC_INFORMATION',
  jobTitle: 'PUBLIC_INFORMATION',
  personalEmail: 'CONTACT_INFORMATION',
  phoneNumber: 'CONTACT_INFORMATION',
  dateOfBirth: 'PERSONAL_INFORMATION',
  department: 'ORGANIZATION_INFORMATION',
  team: 'ORGANIZATION_INFORMATION',
  manager: 'ORGANIZATION_INFORMATION',
  contractType: 'CONTRACT_INFORMATION',
  status: 'CONTRACT_INFORMATION',
  salary: 'SALARY_INFORMATION',
  bankAccount: 'BANK_INFORMATION',
  projectName: 'PROJECT_INFORMATION',
  roleInProject: 'PROJECT_INFORMATION',
  projectCode: 'PROJECT_INFORMATION',
  projectStatus: 'PROJECT_INFORMATION',
  projectDepartment: 'PROJECT_INFORMATION',
}

export const FIELD_GROUP_LABELS: Record<string, string> = {
  PUBLIC_INFORMATION: 'Thông tin công khai',
  CONTACT_INFORMATION: 'Thông tin liên hệ',
  PERSONAL_INFORMATION: 'Thông tin cá nhân',
  ORGANIZATION_INFORMATION: 'Thông tin tổ chức',
  CONTRACT_INFORMATION: 'Thông tin hợp đồng',
  SALARY_INFORMATION: 'Thông tin lương',
  BANK_INFORMATION: 'Thông tin ngân hàng',
  PROJECT_INFORMATION: 'Thông tin dự án',
}

export const SENSITIVE_FIELD_GROUPS = new Set(['SALARY_INFORMATION', 'BANK_INFORMATION'])
