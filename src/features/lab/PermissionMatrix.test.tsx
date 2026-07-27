import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PermissionMatrix } from './PermissionMatrix'
import { buildLattice } from './labVocabulary'
import type { GroupPermissionView, ScopeCode } from './types'

const SCOPES: ScopeCode[] = [
  'NONE',
  'SELF',
  'ASSIGNED',
  'DIRECT_REPORTS',
  'TEAM',
  'DEPARTMENT',
  'DEPARTMENT_TREE',
  'RESPONSIBILITY',
  'ALL',
]

/** Same edges as V10, so the component is bounded by the relation the server actually enforces. */
const lattice = buildLattice([
  ...SCOPES.filter((s) => s !== 'NONE').map((wider) => ({ narrower: 'NONE' as ScopeCode, wider })),
  ...SCOPES.filter((s) => s !== 'ALL').map((narrower) => ({ narrower, wider: 'ALL' as ScopeCode })),
  { narrower: 'SELF', wider: 'TEAM' },
  { narrower: 'TEAM', wider: 'DEPARTMENT' },
  { narrower: 'DEPARTMENT', wider: 'DEPARTMENT_TREE' },
])

function group(overrides: Partial<GroupPermissionView> = {}): GroupPermissionView {
  return {
    groupCode: 'EMPLOYEE_CONTACT',
    groupName: 'Liên hệ cá nhân',
    attachedToScreen: true,
    containsPii: true,
    read: { enabled: true, scope: 'DEPARTMENT' },
    update: { enabled: true, scope: 'SELF' },
    unmask: { enabled: true, scope: 'SELF' },
    multiGroupFields: ['phoneNumber'],
    ...overrides,
  }
}

function renderMatrix(rows: GroupPermissionView[], maxRecordScope: ScopeCode | null = 'ALL') {
  const onChange = vi.fn()
  render(
    <PermissionMatrix
      rows={rows}
      scopes={SCOPES}
      lattice={lattice}
      maxRecordScope={maxRecordScope}
      onChange={onChange}
    />,
  )
  return onChange
}

describe('PermissionMatrix', () => {
  it('bounds the update scope by the read scope of the same row, not by the screen ceiling', () => {
    renderMatrix([group({ read: { enabled: true, scope: 'TEAM' } })])

    const updateScope = screen.getByTestId('scope-EMPLOYEE_CONTACT-update')
    const options = within(updateScope)
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value)

    expect(options).toContain('SELF')
    expect(options).toContain('TEAM')
    // DEPARTMENT is inside the screen ceiling (ALL) but outside the row's read scope (TEAM).
    expect(options).not.toContain('DEPARTMENT')
  })

  it('bounds the read scope by the screen maximum record scope', () => {
    renderMatrix([group()], 'DEPARTMENT')

    const readScope = screen.getByTestId('scope-EMPLOYEE_CONTACT-read')
    const options = within(readScope)
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value)

    expect(options).toContain('DEPARTMENT')
    expect(options).not.toContain('ALL')
    expect(options).not.toContain('DEPARTMENT_TREE')
  })

  it('keeps scopes the lattice cannot prove out of the narrower action', () => {
    renderMatrix([group({ read: { enabled: true, scope: 'DEPARTMENT' } })])

    const options = within(screen.getByTestId('scope-EMPLOYEE_CONTACT-update'))
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value)

    // DIRECT_REPORTS and DEPARTMENT are incomparable — offering it would invite a save the server rejects.
    expect(options).not.toContain('DIRECT_REPORTS')
    expect(options).not.toContain('RESPONSIBILITY')
  })

  it('disables update and unmask while read is off', () => {
    renderMatrix([
      group({
        read: { enabled: false, scope: null },
        update: { enabled: false, scope: null },
        unmask: { enabled: false, scope: null },
      }),
    ])

    expect(screen.getByTestId('cell-EMPLOYEE_CONTACT-update')).toBeDisabled()
    expect(screen.getByTestId('cell-EMPLOYEE_CONTACT-unmask')).toBeDisabled()
    expect(screen.getByTestId('cell-EMPLOYEE_CONTACT-read')).not.toBeDisabled()
  })

  it('defaults a newly enabled update scope to the read scope and unmask to self', async () => {
    const onChange = renderMatrix([
      group({
        update: { enabled: false, scope: null },
        unmask: { enabled: false, scope: null },
      }),
    ])

    await userEvent.click(screen.getByTestId('cell-EMPLOYEE_CONTACT-update'))
    expect(onChange).toHaveBeenCalledWith('EMPLOYEE_CONTACT', 'update', {
      enabled: true,
      scope: 'DEPARTMENT',
    })

    await userEvent.click(screen.getByTestId('cell-EMPLOYEE_CONTACT-unmask'))
    expect(onChange).toHaveBeenCalledWith('EMPLOYEE_CONTACT', 'unmask', { enabled: true, scope: 'SELF' })
  })

  it('hides the unmask column for a group with no sensitive field', () => {
    renderMatrix([group({ groupCode: 'EMPLOYEE_BASIC', containsPii: false, multiGroupFields: [] })])

    expect(screen.queryByTestId('cell-EMPLOYEE_BASIC-unmask')).toBeNull()
    expect(screen.getByText('Không áp dụng')).toBeInTheDocument()
  })

  it('warns on a field shared with another group and on an unattached group', () => {
    renderMatrix([group({ attachedToScreen: false })])

    expect(screen.getByTestId('multi-group-warning-EMPLOYEE_CONTACT')).toBeInTheDocument()
    expect(screen.getByTestId('unattached-EMPLOYEE_CONTACT')).toBeInTheDocument()
  })

  it('turning read off clears nothing on its own — the page decides, the cell only reports', async () => {
    const onChange = renderMatrix([group()])

    await userEvent.click(screen.getByTestId('cell-EMPLOYEE_CONTACT-read'))

    expect(onChange).toHaveBeenCalledWith('EMPLOYEE_CONTACT', 'read', { enabled: false, scope: null })
  })
})
