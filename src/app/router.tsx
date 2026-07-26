import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { Compass } from 'lucide-react'
import { useAuth } from '@/shared/auth/AuthProvider'
import { ScreenGuard } from '@/shared/permissions/ScreenGuard'
import { SCREENS, type ScreenKey } from '@/shared/permissions/screens'
import { AppLayout } from '@/layouts/AppLayout'
import { Card, Spinner } from '@/shared/ui/primitives'
import { EmptyState } from '@/shared/ui/feedback'
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
import { AccessControlPage, CatalogPage } from '@/features/administration/pages'
import {
  ResponsibilityPage,
  RoleAssignmentPage,
  UsersPage,
} from '@/features/administration/directoryPages'
import { ActivityPage } from '@/features/activity/pages'

/** Wraps a page in its screen context so every call it makes is attributed to the right screen. */
function screen(key: ScreenKey, element: ReactElement) {
  return <ScreenGuard screen={SCREENS[key]}>{element}</ScreenGuard>
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { status } = useAuth()
  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Đang mở workspace…" />
      </div>
    )
  }
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

        {/* People */}
        <Route path="/hrm/my-profile" element={screen('MY_PROFILE', <MyProfileRoute />)} />
        <Route path="/hrm/employees" element={screen('EMPLOYEE_LIST', <EmployeeListPage />)} />
        <Route path="/hrm/employees/new" element={screen('EMPLOYEE_CREATE', <EmployeeCreateRoute />)} />
        <Route path="/hrm/employees/:id" element={screen('EMPLOYEE_DETAIL', <EmployeeDetailRoute />)} />
        <Route path="/hrm/employees/:id/edit" element={screen('EMPLOYEE_EDIT', <EmployeeEditRoute />)} />
        <Route path="/hrm/salaries" element={screen('SALARY_LIST', <SalaryListPage />)} />

        {/* Delivery */}
        <Route path="/projects" element={screen('PROJECT_LIST', <ProjectListPage />)} />
        <Route path="/projects/:id" element={screen('PROJECT_DETAIL', <ProjectDetailPage />)} />
        <Route path="/projects/:id/members" element={screen('MEMBER_LIST', <MemberListPage />)} />
        <Route path="/projects/:id/members/add" element={screen('EMPLOYEE_PICKER', <EmployeePickerPage />)} />

        {/* Administration */}
        <Route path="/admin/users" element={screen('USER_MANAGEMENT', <UsersPage />)} />
        <Route path="/admin/user-roles" element={screen('USER_ROLE_ASSIGNMENT', <RoleAssignmentPage />)} />
        <Route path="/admin/access" element={<AccessControlPage />} />
        <Route path="/admin/catalog" element={<CatalogPage />} />
        <Route
          path="/admin/responsibilities"
          element={screen('RESPONSIBILITY_ASSIGNMENT', <ResponsibilityPage />)}
        />

        {/* Activity */}
        <Route path="/activity" element={screen('AUDIT_LOG_LIST', <ActivityPage />)} />

        {/* Paths the database still advertises as screen routes. */}
        <Route path="/admin/roles" element={<Navigate to="/admin/catalog" replace />} />
        <Route path="/admin/modules" element={<Navigate to="/admin/catalog" replace />} />
        <Route path="/admin/submodules" element={<Navigate to="/admin/catalog" replace />} />
        <Route path="/admin/screens" element={<Navigate to="/admin/catalog" replace />} />
        <Route path="/admin/field-groups" element={<Navigate to="/admin/catalog" replace />} />
        <Route path="/admin/screen-permissions" element={<Navigate to="/admin/access" replace />} />
        <Route path="/admin/record-scopes" element={<Navigate to="/admin/access" replace />} />
        <Route path="/admin/field-group-permissions" element={<Navigate to="/admin/access" replace />} />
        <Route path="/audit/logs" element={<Navigate to="/activity" replace />} />
        <Route path="/audit/decisions" element={<Navigate to="/activity" replace />} />

        <Route
          path="*"
          element={
            <Card padded={false}>
              <EmptyState
                icon={Compass}
                title="Không tìm thấy trang"
                description="Đường dẫn này không còn tồn tại. Dùng thanh điều hướng bên trái để quay lại công việc."
              />
            </Card>
          }
        />
      </Route>
    </Routes>
  )
}
