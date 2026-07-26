import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ActiveScreenContext } from '@/shared/permissions/activeScreen'
import { SCREENS } from '@/shared/permissions/screens'
import type { ScreenPermission } from '@/shared/api/types'
import { EmployeeFieldForm } from './EmployeeFieldForm'

vi.mock('@/shared/api/endpoints', () => ({
  organizationApi: { options: vi.fn().mockResolvedValue({ departments: [], teams: [], managers: [] }) },
}))

const basePermission: ScreenPermission = {
  moduleKey: 'HRM',
  submoduleKey: 'EMPLOYEE',
  screenCode: 'MY_PROFILE',
  screenName: 'My Profile',
  screenAccess: true,
  allowedActions: ['READ', 'UPDATE'],
  recordScopes: ['SELF'],
  readableFieldGroups: ['PUBLIC_INFORMATION', 'CONTACT_INFORMATION'],
  creatableFieldGroups: [],
  updatableFieldGroups: ['CONTACT_INFORMATION'],
  readableFields: ['fullName', 'phoneNumber', 'personalEmail'],
  creatableFields: [],
  updatableFields: ['phoneNumber', 'personalEmail'],
  sourceRoles: ['EMPLOYEE'],
}

function wrap(children: ReactNode, permission: ScreenPermission = basePermission) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ActiveScreenContext.Provider value={{ screen: SCREENS.MY_PROFILE, permission }}>
        {children}
      </ActiveScreenContext.Provider>
    </QueryClientProvider>,
  )
}

describe('EmployeeFieldForm', () => {
  it('renders exactly the fields the screen says are updatable', () => {
    wrap(
      <EmployeeFieldForm
        mode="update"
        initial={{ fullName: 'Alice Nguyen', phoneNumber: '0123456789', personalEmail: 'a@x.com' }}
        submitLabel="Lưu"
        onSubmit={() => {}}
      />,
    )
    expect(screen.getByLabelText('Số điện thoại')).toBeInTheDocument()
    expect(screen.getByLabelText('Email cá nhân')).toBeInTheDocument()
    // readable but not updatable → no input at all
    expect(screen.queryByLabelText('Họ và tên')).not.toBeInTheDocument()
    // not in any granted group → never rendered
    expect(screen.queryByLabelText('Lương')).not.toBeInTheDocument()
  })

  it('submits only the fields that actually changed', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    wrap(
      <EmployeeFieldForm
        mode="update"
        initial={{ phoneNumber: '0123456789', personalEmail: 'a@x.com' }}
        submitLabel="Lưu"
        onSubmit={onSubmit}
      />,
    )
    await user.clear(screen.getByLabelText('Số điện thoại'))
    await user.type(screen.getByLabelText('Số điện thoại'), '0999888777')
    await user.click(screen.getByTestId('field-form-submit'))

    expect(onSubmit).toHaveBeenCalledWith({ phoneNumber: '0999888777' })
  })

  it('tells the user plainly when nothing is writable', () => {
    wrap(
      <EmployeeFieldForm mode="update" initial={{}} submitLabel="Lưu" onSubmit={() => {}} />,
      { ...basePermission, updatableFields: [], updatableFieldGroups: [] },
    )
    expect(screen.getByText(/không cho phép bạn ghi trường nào/i)).toBeInTheDocument()
  })

  it('uses creatableFields in create mode', () => {
    wrap(
      <EmployeeFieldForm mode="create" initial={{}} submitLabel="Tạo" onSubmit={() => {}} />,
      {
        ...basePermission,
        screenCode: 'EMPLOYEE_CREATE',
        creatableFields: ['employeeCode', 'fullName'],
        creatableFieldGroups: ['PUBLIC_INFORMATION'],
        updatableFields: [],
      },
    )
    expect(screen.getByLabelText('Mã nhân viên')).toBeInTheDocument()
    expect(screen.getByLabelText('Họ và tên')).toBeInTheDocument()
    expect(screen.queryByLabelText('Số điện thoại')).not.toBeInTheDocument()
  })
})
