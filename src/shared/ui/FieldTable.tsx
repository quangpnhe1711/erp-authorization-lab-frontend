import type { ReactNode } from 'react'
import type { FieldPage } from '@/shared/api/types'
import { FIELD_GROUP_OF, FIELD_LABELS, SENSITIVE_FIELD_GROUPS } from '@/shared/permissions/screens'
import { formatFieldValue } from '@/shared/format'
import { EmptyState, Table, Td, Th } from './primitives'

/**
 * Renders whatever the backend allowed. Columns come from {@code readableFields} in the response —
 * the UI never decides which fields exist, it only lays out what it was given (spec §20).
 */
export function FieldTable({
  page,
  columnOrder,
  emptyTitle = 'Không có dữ liệu trong phạm vi của bạn',
  emptyHint,
  rowHref,
  testId,
}: {
  page: FieldPage
  columnOrder?: string[]
  emptyTitle?: string
  emptyHint?: ReactNode
  rowHref?: (id: number) => ReactNode
  testId?: string
}) {
  const columns = orderColumns(page.readableFields, columnOrder, page)

  if (page.content.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />
  }

  return (
    <Table data-testid={testId}>
      <thead>
        <tr>
          {columns.map((field) => (
            <Th key={field}>
              <span className="flex items-center gap-1">
                {FIELD_LABELS[field] ?? field}
                {SENSITIVE_FIELD_GROUPS.has(FIELD_GROUP_OF[field] ?? '') && (
                  <span title="Trường nhạy cảm" aria-label="Trường nhạy cảm">
                    🔒
                  </span>
                )}
              </span>
            </Th>
          ))}
          {rowHref && <Th className="w-24 text-right">&nbsp;</Th>}
        </tr>
      </thead>
      <tbody>
        {page.content.map((row) => (
          <tr key={row.id} data-testid="field-row" data-row-id={row.id} className="hover:bg-surface-sunken">
            {columns.map((field) => (
              <Td key={field} data-field={field}>
                {formatFieldValue(field, row.fields[field])}
              </Td>
            ))}
            {rowHref && <Td className="text-right">{rowHref(row.id)}</Td>}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

/**
 * readableFields is the screen's whole readable set; a row may legitimately not carry every one of
 * them (a member row has no projectStatus). Only show columns at least one row actually returned.
 */
function orderColumns(readableFields: string[], preferred: string[] | undefined, page: FieldPage): string[] {
  const present = new Set<string>()
  for (const row of page.content) {
    for (const key of Object.keys(row.fields)) present.add(key)
  }
  const usable = page.content.length === 0 ? readableFields : readableFields.filter((f) => present.has(f))
  if (!preferred) return usable
  const ranked = [...usable].sort((a, b) => rank(preferred, a) - rank(preferred, b))
  return ranked
}

function rank(order: string[], field: string): number {
  const index = order.indexOf(field)
  return index === -1 ? order.length + 1 : index
}

/** Stable, human column order for employee-shaped rows. */
export const EMPLOYEE_COLUMN_ORDER = [
  'employeeCode',
  'fullName',
  'jobTitle',
  'companyEmail',
  'personalEmail',
  'phoneNumber',
  'dateOfBirth',
  'department',
  'team',
  'manager',
  'contractType',
  'status',
  'projectName',
  'roleInProject',
  'salary',
  'bankAccount',
]

export const PROJECT_COLUMN_ORDER = ['projectCode', 'projectName', 'projectStatus', 'projectDepartment']
