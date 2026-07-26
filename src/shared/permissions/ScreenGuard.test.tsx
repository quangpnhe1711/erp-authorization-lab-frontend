import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { ScreenPermission } from '@/shared/api/types'
import { ActionGate, ScreenGuard } from './ScreenGuard'
import { SCREENS } from './screens'

const screenPermission = vi.fn()

vi.mock('@/shared/api/endpoints', () => ({
  meApi: { screenPermission: (...args: unknown[]) => screenPermission(...args) },
}))

vi.mock('./PermissionDebugDrawer', () => ({ PermissionDebugDrawer: () => null }))

function permission(overrides: Partial<ScreenPermission> = {}): ScreenPermission {
  return {
    moduleKey: 'HRM',
    submoduleKey: 'EMPLOYEE',
    screenCode: 'EMPLOYEE_LIST',
    screenName: 'Employee List',
    screenAccess: true,
    allowedActions: ['READ'],
    recordScopes: ['TEAM'],
    readableFieldGroups: ['PUBLIC_INFORMATION'],
    creatableFieldGroups: [],
    updatableFieldGroups: [],
    readableFields: ['fullName'],
    creatableFields: [],
    updatableFields: [],
    sourceRoles: ['EMPLOYEE'],
    ...overrides,
  }
}

function wrap(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>)
}

beforeEach(() => screenPermission.mockReset())

describe('ScreenGuard', () => {
  it('renders the screen when the server grants access', async () => {
    screenPermission.mockResolvedValue(permission())
    wrap(
      <ScreenGuard screen={SCREENS.EMPLOYEE_LIST}>
        <p>danh sách</p>
      </ScreenGuard>,
    )
    expect(await screen.findByText('danh sách')).toBeInTheDocument()
  })

  it('blocks the screen and names the error code when access is denied', async () => {
    screenPermission.mockResolvedValue(permission({ screenAccess: false, allowedActions: [] }))
    wrap(
      <ScreenGuard screen={SCREENS.EMPLOYEE_LIST}>
        <p>danh sách</p>
      </ScreenGuard>,
    )
    const denied = await screen.findByTestId('screen-access-denied')
    expect(denied).toHaveAttribute('data-error-code', 'SCREEN_ACCESS_DENIED')
    expect(screen.queryByText('danh sách')).not.toBeInTheDocument()
  })

  it('hides an action the screen does not grant', async () => {
    screenPermission.mockResolvedValue(permission({ allowedActions: ['READ'] }))
    wrap(
      <ScreenGuard screen={SCREENS.EMPLOYEE_LIST}>
        <ActionGate action="CREATE">
          <button type="button">Thêm nhân viên</button>
        </ActionGate>
        <ActionGate action="READ">
          <span>đọc được</span>
        </ActionGate>
      </ScreenGuard>,
    )
    await waitFor(() => expect(screen.getByText('đọc được')).toBeInTheDocument())
    expect(screen.queryByText('Thêm nhân viên')).not.toBeInTheDocument()
  })
})
