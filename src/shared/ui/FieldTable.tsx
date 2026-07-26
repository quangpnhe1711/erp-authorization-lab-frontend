import type { ReactNode } from 'react'
import clsx from 'clsx'
import { ChevronRight, Users } from 'lucide-react'
import type { FieldPage } from '@/shared/api/types'
import { FIELD_LABELS } from '@/shared/permissions/screens'
import { formatFieldValue } from '@/shared/format'
import { EmptyState } from './feedback'
import { Avatar, Badge, Table, Td, Th, type BadgeTone } from './primitives'

const NUMERIC_FIELDS = new Set(['salary'])
const CODE_FIELDS = new Set(['employeeCode', 'projectCode'])
const BADGE_FIELDS = new Set(['status', 'projectStatus', 'contractType', 'roleInProject'])

const VALUE_TONES: Record<string, BadgeTone> = {
  ACTIVE: 'positive',
  INACTIVE: 'caution',
  FULLTIME: 'neutral',
  PARTTIME: 'neutral',
  CONTRACT: 'neutral',
  MANAGER: 'brand',
  MEMBER: 'neutral',
}

/**
 * Renders the rows the server returned, with the columns the server allowed.
 *
 * Which fields exist is not a front-end decision: a value the person may not read never arrives in
 * the payload, so it can never reach the screen. This component only decides how the values it was
 * given should look — names get avatars, money right-aligns, statuses become badges.
 */
export function FieldTable({
  page,
  columnOrder,
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription,
  emptyAction,
  onRowClick,
  rowAction,
  testId,
}: {
  page: FieldPage
  columnOrder?: string[]
  emptyTitle?: string
  emptyDescription?: ReactNode
  emptyAction?: ReactNode
  onRowClick?: (id: number) => void
  rowAction?: (id: number) => ReactNode
  testId?: string
}) {
  const columns = orderColumns(page.readableFields, columnOrder, page)

  if (page.content.length === 0) {
    return <EmptyState icon={Users} title={emptyTitle} description={emptyDescription} action={emptyAction} />
  }

  return (
    <Table data-testid={testId}>
      <thead>
        <tr>
          {columns.map((field) => (
            <Th key={field} className={NUMERIC_FIELDS.has(field) ? 'text-right' : undefined}>
              {FIELD_LABELS[field] ?? field}
            </Th>
          ))}
          {(rowAction || onRowClick) && <Th className="w-16 text-right">&nbsp;</Th>}
        </tr>
      </thead>
      <tbody>
        {page.content.map((row) => (
          <tr
            key={row.id}
            data-testid="field-row"
            data-row-id={row.id}
            onClick={onRowClick ? () => onRowClick(row.id) : undefined}
            className={clsx(
              'transition-colors last:[&>td]:border-b-0',
              onRowClick && 'cursor-pointer hover:bg-surface-muted',
            )}
          >
            {columns.map((field) => (
              <Td
                key={field}
                data-field={field}
                // One line per record: a data grid scrolls sideways, it does not reflow into paragraphs.
                className={clsx('whitespace-nowrap', NUMERIC_FIELDS.has(field) && 'text-right font-medium text-ink')}
              >
                {renderCell(field, row.fields[field])}
              </Td>
            ))}
            {(rowAction || onRowClick) && (
              <Td className="text-right">
                {rowAction ? (
                  rowAction(row.id)
                ) : (
                  <ChevronRight size={16} strokeWidth={2} aria-hidden className="ml-auto text-ink-subtle" />
                )}
              </Td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

function renderCell(field: string, value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return <span className="text-ink-subtle">—</span>

  if (field === 'fullName') {
    const name = String(value)
    return (
      <span className="flex items-center gap-2.5">
        <Avatar name={name} size="sm" />
        <span className="font-medium text-ink">{name}</span>
      </span>
    )
  }

  if (CODE_FIELDS.has(field)) {
    return <span className="font-mono text-sm text-ink-muted">{String(value)}</span>
  }

  if (BADGE_FIELDS.has(field)) {
    const raw = String(value)
    return <Badge tone={VALUE_TONES[raw] ?? 'neutral'}>{humanizeValue(field, raw)}</Badge>
  }

  return formatFieldValue(field, value)
}

const VALUE_LABELS: Record<string, string> = {
  ACTIVE: 'Đang làm việc',
  INACTIVE: 'Đã nghỉ',
  FULLTIME: 'Toàn thời gian',
  PARTTIME: 'Bán thời gian',
  CONTRACT: 'Hợp đồng',
  MANAGER: 'Quản lý',
  MEMBER: 'Thành viên',
}

export function humanizeValue(field: string, value: string): string {
  if (field === 'projectStatus' && value === 'ACTIVE') return 'Đang chạy'
  return VALUE_LABELS[value] ?? value
}

/**
 * `readableFields` is the whole set the screen allows; an individual row may legitimately not carry
 * every one of them. Only show a column at least one row actually returned.
 */
function orderColumns(readableFields: string[], preferred: string[] | undefined, page: FieldPage): string[] {
  const present = new Set<string>()
  for (const row of page.content) for (const key of Object.keys(row.fields)) present.add(key)
  const usable = page.content.length === 0 ? readableFields : readableFields.filter((f) => present.has(f))
  if (!preferred) return usable
  return [...usable].sort((a, b) => rank(preferred, a) - rank(preferred, b))
}

function rank(order: string[], field: string): number {
  const index = order.indexOf(field)
  return index === -1 ? order.length + 1 : index
}

export const EMPLOYEE_COLUMN_ORDER = [
  'fullName',
  'employeeCode',
  'jobTitle',
  'department',
  'team',
  'manager',
  'companyEmail',
  'personalEmail',
  'phoneNumber',
  'dateOfBirth',
  'contractType',
  'status',
  'projectName',
  'roleInProject',
  'salary',
  'bankAccount',
]

export const PROJECT_COLUMN_ORDER = ['projectName', 'projectCode', 'projectDepartment', 'projectStatus']
