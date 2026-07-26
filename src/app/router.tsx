import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { useAuth } from '@/shared/auth/AuthProvider'
import { ScreenGuard } from '@/shared/permissions/ScreenGuard'
import { SCREENS, type ScreenKey } from '@/shared/permissions/screens'
import { AppLayout } from '@/layouts/AppLayout'
import { Spinner } from '@/shared/ui/primitives'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EmployeeListPage } from '@/features/employees/EmployeeListPage'
import {
  EmployeeCreateRoute,
  EmployeeDetailRoute,
  EmployeeEditRoute,
  MyProfileRoute,
} from '@/features/employees/pages'
import { SalaryListPage } from '@/features/salary/SalaryListPage'
import {
  EmployeePickerPage,
  MemberListPage,
  ProjectDetailPage,
  ProjectListPage,
} from '@/features/projects/pages'
import {
  FieldGroupConfigPage,
  ModuleManagementPage,
  RoleManagementPage,
  ScreenManagementPage,
  SubmoduleManagementPage,
  UserManagementPage,
} from '@/features/administration/catalogPages'
import {
  FieldGroupPermissionConfigPage,
  RecordScopeConfigPage,
  ScreenPermissionConfigPage,
} from '@/features/administration/RolePermissionEditor'
import {
  ResponsibilityAssignmentPage,
  UserRoleAssignmentPage,
} from '@/features/administration/assignmentPages'
import { AuditLogListPage, PermissionDecisionTracePage } from '@/features/audit/pages'
import { EmptyState } from '@/shared/ui/primitives'

/** Wraps a page in its screen context so every call it makes carries the right headers. */
function screen(key: ScreenKey, element: ReactElement) {
  return <ScreenGuard screen={SCREENS[key]}>{element}</ScreenGuard>
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { status } = useAuth()
  if (status === 'loading') return <Spinner label="Đang khôi phục phiên…" />
  if (status === 'anonymous') return <Navigate to="/login" replace />
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={screen('DASHBOARD', <DashboardPage />)} />

        <Route path="/hrm/my-profile" element={screen('MY_PROFILE', <MyProfileRoute />)} />
        <Route path="/hrm/employees" element={screen('EMPLOYEE_LIST', <EmployeeListPage />)} />
        <Route path="/hrm/employees/new" element={screen('EMPLOYEE_CREATE', <EmployeeCreateRoute />)} />
        <Route path="/hrm/employees/:id" element={screen('EMPLOYEE_DETAIL', <EmployeeDetailRoute />)} />
        <Route path="/hrm/employees/:id/edit" element={screen('EMPLOYEE_EDIT', <EmployeeEditRoute />)} />
        <Route path="/hrm/salaries" element={screen('SALARY_LIST', <SalaryListPage />)} />

        <Route path="/projects" element={screen('PROJECT_LIST', <ProjectListPage />)} />
        <Route path="/projects/:id" element={screen('PROJECT_DETAIL', <ProjectDetailPage />)} />
        <Route path="/projects/:id/members" element={screen('MEMBER_LIST', <MemberListPage />)} />
        <Route path="/projects/:id/members/add" element={screen('EMPLOYEE_PICKER', <EmployeePickerPage />)} />

        <Route path="/admin/users" element={screen('USER_MANAGEMENT', <UserManagementPage />)} />
        <Route path="/admin/roles" element={screen('ROLE_MANAGEMENT', <RoleManagementPage />)} />
        <Route path="/admin/modules" element={screen('MODULE_MANAGEMENT', <ModuleManagementPage />)} />
        <Route path="/admin/submodules" element={screen('SUBMODULE_MANAGEMENT', <SubmoduleManagementPage />)} />
        <Route path="/admin/screens" element={screen('SCREEN_MANAGEMENT', <ScreenManagementPage />)} />
        <Route
          path="/admin/screen-permissions"
          element={screen('SCREEN_PERMISSION_CONFIG', <ScreenPermissionConfigPage />)}
        />
        <Route path="/admin/record-scopes" element={screen('RECORD_SCOPE_CONFIG', <RecordScopeConfigPage />)} />
        <Route path="/admin/field-groups" element={screen('FIELD_GROUP_CONFIG', <FieldGroupConfigPage />)} />
        <Route
          path="/admin/field-group-permissions"
          element={screen('FIELD_GROUP_PERMISSION_CONFIG', <FieldGroupPermissionConfigPage />)}
        />
        <Route path="/admin/user-roles" element={screen('USER_ROLE_ASSIGNMENT', <UserRoleAssignmentPage />)} />
        <Route
          path="/admin/responsibilities"
          element={screen('RESPONSIBILITY_ASSIGNMENT', <ResponsibilityAssignmentPage />)}
        />

        <Route path="/audit/logs" element={screen('AUDIT_LOG_LIST', <AuditLogListPage />)} />
        <Route
          path="/audit/decisions"
          element={screen('PERMISSION_DECISION_TRACE', <PermissionDecisionTracePage />)}
        />

        <Route
          path="*"
          element={<EmptyState title="Không tìm thấy trang" hint="Đường dẫn không khớp màn hình nào." />}
        />
      </Route>
    </Routes>
  )
}
