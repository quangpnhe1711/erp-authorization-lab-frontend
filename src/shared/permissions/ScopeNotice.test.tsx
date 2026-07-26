import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ScreenPermission } from '@/shared/api/types'
import { ScopeNotice } from './ScopeNotice'

const developerMode = { value: false }

vi.mock('@/shared/devmode/DeveloperModeProvider', () => ({
  useDeveloperMode: () => ({ developerMode: developerMode.value, setDeveloperMode: () => {} }),
}))

vi.mock('@/features/dashboard/useMyProfile', () => ({
  useMyProfile: () => ({ team: 'Nhóm Backend', department: 'Khối Phát triển', isLoading: false, hasContactGap: false }),
}))

function permission(scopes: string[]): ScreenPermission {
  return {
    moduleKey: 'HRM',
    submoduleKey: 'EMPLOYEE',
    screenCode: 'EMPLOYEE_LIST',
    screenName: 'Employee List',
    screenAccess: true,
    allowedActions: ['READ'],
    recordScopes: scopes,
    readableFieldGroups: [],
    creatableFieldGroups: [],
    updatableFieldGroups: [],
    readableFields: [],
    creatableFields: [],
    updatableFields: [],
    sourceRoles: ['EMPLOYEE'],
  }
}

describe('ScopeNotice', () => {
  it('states the visible slice as a sentence, never as scope codes', () => {
    render(<ScopeNotice permission={permission(['TEAM'])} count={3} noun="nhân viên" />)
    expect(screen.getByTestId('scope-notice')).toHaveTextContent(
      'Đang hiển thị 3 nhân viên thuộc nhóm Nhóm Backend.',
    )
    expect(screen.queryByText(/TEAM/)).not.toBeInTheDocument()
  })

  it('joins several scopes the way a person would say them', () => {
    render(<ScopeNotice permission={permission(['TEAM', 'RESPONSIBILITY'])} count={6} noun="nhân viên" />)
    expect(screen.getByTestId('scope-notice')).toHaveTextContent(
      'Đang hiển thị 6 nhân viên thuộc nhóm Nhóm Backend và các bộ phận bạn phụ trách.',
    )
  })

  it('says "toàn công ty" for the widest scope', () => {
    render(<ScopeNotice permission={permission(['ALL'])} count={8} noun="nhân viên" />)
    expect(screen.getByTestId('scope-notice')).toHaveTextContent('thuộc toàn công ty')
  })

  it('adds the raw scopes only in developer mode', () => {
    developerMode.value = true
    render(<ScopeNotice permission={permission(['TEAM', 'RESPONSIBILITY'])} count={6} noun="nhân viên" />)
    expect(screen.getByTestId('scope-notice')).toHaveTextContent('[TEAM ∪ RESPONSIBILITY]')
    developerMode.value = false
  })

  it('renders nothing when the screen has no scope at all', () => {
    const { container } = render(<ScopeNotice permission={permission([])} noun="nhân viên" />)
    expect(container).toBeEmptyDOMElement()
  })
})
