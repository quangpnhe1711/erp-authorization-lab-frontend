import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { FieldPage } from '@/shared/api/types'
import { EMPLOYEE_COLUMN_ORDER, FieldTable } from './FieldTable'

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
    expect(headers).toEqual(['Mã nhân viên', 'Họ và tên', 'Chức danh'])
  })

  it('never renders a field the backend withheld', () => {
    render(<FieldTable page={page()} columnOrder={EMPLOYEE_COLUMN_ORDER} />)
    expect(screen.queryByText('Lương')).not.toBeInTheDocument()
    expect(screen.queryByText('Email cá nhân')).not.toBeInTheDocument()
  })

  it('marks sensitive field groups with a lock', () => {
    const withSalary = page({
      content: [{ id: 4, fields: { fullName: 'Alice Nguyen', salary: 20000000 } }],
      readableFields: ['fullName', 'salary'],
    })
    render(<FieldTable page={withSalary} columnOrder={EMPLOYEE_COLUMN_ORDER} />)
    expect(screen.getByLabelText('Trường nhạy cảm')).toBeInTheDocument()
  })

  it('formats salary as VND currency', () => {
    const withSalary = page({
      content: [{ id: 4, fields: { fullName: 'Alice Nguyen', salary: 20000000 } }],
      readableFields: ['fullName', 'salary'],
    })
    render(<FieldTable page={withSalary} columnOrder={EMPLOYEE_COLUMN_ORDER} />)
    const cell = document.querySelector('[data-field="salary"]')
    expect(cell?.textContent).toMatch(/20[.,]000[.,]000/)
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

  it('explains an empty result instead of showing a blank table', () => {
    render(<FieldTable page={page({ content: [], totalElements: 0 })} emptyHint="Ngoài phạm vi." />)
    expect(screen.getByText(/Không có dữ liệu trong phạm vi của bạn/)).toBeInTheDocument()
    expect(screen.getByText('Ngoài phạm vi.')).toBeInTheDocument()
  })
})
