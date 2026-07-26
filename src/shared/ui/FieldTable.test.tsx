import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FieldPage } from '@/shared/api/types'
import { EMPLOYEE_COLUMN_ORDER, FieldTable } from './FieldTable'

vi.mock('@/shared/devmode/DeveloperModeProvider', () => ({
  useDeveloperMode: () => ({ developerMode: false, setDeveloperMode: () => {} }),
}))

function page(overrides: Partial<FieldPage> = {}): FieldPage {
  return {
    content: [
      { id: 4, fields: { employeeCode: 'E001', fullName: 'Alice Nguyen', jobTitle: 'Backend Developer' } },
      { id: 5, fields: { employeeCode: 'E002', fullName: 'Bob Tran', jobTitle: 'Backend Developer' } },
    ],
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
    readableFields: ['employeeCode', 'fullName', 'jobTitle'],
    ...overrides,
  }
}

describe('FieldTable', () => {
  it('renders one column per readable field, in the configured order', () => {
    render(<FieldTable page={page()} columnOrder={EMPLOYEE_COLUMN_ORDER} />)
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent?.trim())
    expect(headers).toEqual(['Họ và tên', 'Mã nhân viên', 'Chức danh'])
  })

  it('never renders a field the backend withheld', () => {
    render(<FieldTable page={page()} columnOrder={EMPLOYEE_COLUMN_ORDER} />)
    expect(screen.queryByText('Lương')).not.toBeInTheDocument()
    expect(screen.queryByText('Email cá nhân')).not.toBeInTheDocument()
  })

  it('formats salary as VND and right-aligns it', () => {
    const withSalary = page({
      content: [{ id: 4, fields: { fullName: 'Alice Nguyen', salary: 20000000 } }],
      readableFields: ['fullName', 'salary'],
    })
    render(<FieldTable page={withSalary} columnOrder={EMPLOYEE_COLUMN_ORDER} />)
    const cell = document.querySelector('[data-field="salary"]')
    expect(cell?.textContent).toMatch(/20[.,]000[.,]000/)
    expect(cell?.className).toContain('text-right')
  })

  it('translates coded values into words a person would use', () => {
    const withStatus = page({
      content: [{ id: 4, fields: { fullName: 'Alice Nguyen', status: 'ACTIVE', contractType: 'FULLTIME' } }],
      readableFields: ['fullName', 'status', 'contractType'],
    })
    render(<FieldTable page={withStatus} columnOrder={EMPLOYEE_COLUMN_ORDER} />)
    expect(screen.getByText('Đang làm việc')).toBeInTheDocument()
    expect(screen.getByText('Toàn thời gian')).toBeInTheDocument()
    expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument()
    expect(screen.queryByText('FULLTIME')).not.toBeInTheDocument()
  })

  it('drops columns no row actually carries', () => {
    // MEMBER_LIST advertises project fields the member rows do not include.
    const members = page({
      content: [{ id: 4, fields: { fullName: 'Alice Nguyen', roleInProject: 'MEMBER' } }],
      readableFields: ['fullName', 'roleInProject', 'projectStatus'],
    })
    render(<FieldTable page={members} columnOrder={EMPLOYEE_COLUMN_ORDER} />)
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent?.trim())
    expect(headers).toEqual(['Họ và tên', 'Vai trò trong dự án'])
  })

  it('explains an empty result and offers a way forward', () => {
    render(
      <FieldTable
        page={page({ content: [], totalElements: 0 })}
        emptyTitle="Danh bạ của bạn đang trống"
        emptyDescription="Khi có nhân viên thuộc phạm vi bạn phụ trách, họ sẽ xuất hiện ở đây."
      />,
    )
    expect(screen.getByText('Danh bạ của bạn đang trống')).toBeInTheDocument()
    expect(screen.getByText(/sẽ xuất hiện ở đây/)).toBeInTheDocument()
  })

  it('opens the record when a row is clicked', async () => {
    const onRowClick = vi.fn()
    const user = userEvent.setup()
    render(<FieldTable page={page()} columnOrder={EMPLOYEE_COLUMN_ORDER} onRowClick={onRowClick} />)
    await user.click(screen.getByText('Alice Nguyen'))
    expect(onRowClick).toHaveBeenCalledWith(4)
  })
})
