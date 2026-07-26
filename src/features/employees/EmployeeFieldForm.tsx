import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { organizationApi } from '@/shared/api/endpoints'
import type { OrganizationOptions } from '@/shared/api/types'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { FIELD_GROUP_LABELS, FIELD_GROUP_OF, FIELD_LABELS } from '@/shared/permissions/screens'
import { Button, Input, Label, Select } from '@/shared/ui/primitives'
import { EmptyState, ErrorNotice } from '@/shared/ui/feedback'
import { EMPLOYEE_COLUMN_ORDER } from '@/shared/ui/FieldTable'

const ID_FIELDS = new Set(['department', 'team', 'manager'])
const ENUM_OPTIONS: Record<string, { value: string; label: string }[]> = {
  status: [
    { value: 'ACTIVE', label: 'Đang làm việc' },
    { value: 'INACTIVE', label: 'Đã nghỉ' },
  ],
  contractType: [
    { value: 'FULLTIME', label: 'Toàn thời gian' },
    { value: 'PARTTIME', label: 'Bán thời gian' },
    { value: 'CONTRACT', label: 'Hợp đồng' },
  ],
}

const REQUIRED_ON_CREATE = new Set(['employeeCode', 'fullName'])

export type FormMode = 'update' | 'create'

/**
 * The form shows the fields this person can actually write, and submits only what they changed.
 *
 * It is not a security boundary — the API checks the same thing again — but it is the difference
 * between a form that works and a form that offers inputs which will be rejected on save.
 */
export function EmployeeFieldForm({
  mode,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  pending,
  error,
}: {
  mode: FormMode
  initial: Record<string, unknown>
  submitLabel: string
  onSubmit: (values: Record<string, unknown>) => void
  onCancel?: () => void
  pending?: boolean
  error?: unknown
}) {
  const { screen, permission } = useActiveScreen()
  const writable = useMemo(
    () => orderFields(mode === 'create' ? permission?.creatableFields : permission?.updatableFields),
    [mode, permission],
  )
  const needsOptions = writable.some((field) => ID_FIELDS.has(field))
  const { data: options } = useQuery<OrganizationOptions>({
    queryKey: ['org-options', screen.screenCode],
    queryFn: () => organizationApi.options(screen),
    enabled: needsOptions,
    staleTime: 300_000,
  })

  const [values, setValues] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  // Options land after the first render, so the id fields re-seed once they arrive.
  const seeded = useMemo(() => seed(writable, initial, options), [writable, initial, options])
  const valueOf = (field: string) => (touched.has(field) ? (values[field] ?? '') : (seeded[field] ?? ''))

  const setField = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => new Set(prev).add(field))
  }

  if (writable.length === 0) {
    return (
      <EmptyState
        icon={Lock}
        title="Bạn chỉ có quyền xem hồ sơ này"
        description="Liên hệ quản trị viên nếu bạn cần chỉnh sửa thông tin."
      />
    )
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const payload: Record<string, unknown> = {}
    for (const field of writable) {
      const raw = valueOf(field)
      if (mode === 'create') {
        if (raw !== '') payload[field] = normalize(field, raw)
      } else if (raw !== (seeded[field] ?? '')) {
        payload[field] = normalize(field, raw)
      }
    }
    onSubmit(payload)
  }

  const groups = groupBy(writable)

  return (
    <form onSubmit={submit} className="space-y-6" data-testid="employee-field-form">
      {[...groups.entries()].map(([group, fields]) => (
        <section key={group}>
          <h3 className="mb-3 text-sm font-semibold text-ink">{FIELD_GROUP_LABELS[group] ?? group}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field}>
                <Label htmlFor={`field-${field}`} hint={mode === 'create' && REQUIRED_ON_CREATE.has(field) ? 'bắt buộc' : undefined}>
                  {FIELD_LABELS[field] ?? field}
                </Label>
                {renderControl(field, valueOf(field), (next) => setField(field, next), options, mode)}
              </div>
            ))}
          </div>
        </section>
      ))}

      <ErrorNotice error={error} />

      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <Button type="submit" disabled={pending} data-testid="field-form-submit">
          {pending ? 'Đang lưu…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Huỷ
          </Button>
        )}
      </div>
    </form>
  )
}

function renderControl(
  field: string,
  value: string,
  onChange: (value: string) => void,
  options: OrganizationOptions | undefined,
  mode: FormMode,
) {
  const id = `field-${field}`
  const required = mode === 'create' && REQUIRED_ON_CREATE.has(field)

  if (ID_FIELDS.has(field)) {
    const list =
      field === 'department' ? options?.departments : field === 'team' ? options?.teams : options?.managers
    return (
      <Select id={id} name={field} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Chưa chọn</option>
        {(list ?? []).map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.name}
          </option>
        ))}
      </Select>
    )
  }

  if (ENUM_OPTIONS[field]) {
    return (
      <Select id={id} name={field} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Chưa chọn</option>
        {ENUM_OPTIONS[field]!.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    )
  }

  const type = field === 'dateOfBirth' ? 'date' : field === 'salary' ? 'number' : 'text'
  return (
    <Input
      id={id}
      name={field}
      type={type}
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function seed(
  fields: string[],
  initial: Record<string, unknown>,
  options: OrganizationOptions | undefined,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const field of fields) {
    const raw = initial[field]
    if (ID_FIELDS.has(field)) {
      // Records read back a department *name*; saving one needs its id.
      const list =
        field === 'department' ? options?.departments : field === 'team' ? options?.teams : options?.managers
      const match = (list ?? []).find((option) => option.name === raw)
      out[field] = match ? String(match.id) : ''
    } else {
      out[field] = raw === null || raw === undefined ? '' : String(raw)
    }
  }
  return out
}

function normalize(field: string, raw: string): unknown {
  if (raw === '') return null
  if (field === 'salary') return Number(raw)
  return raw
}

function orderFields(fields: string[] | undefined): string[] {
  if (!fields) return []
  return [...fields].sort((a, b) => rank(a) - rank(b))
}

function rank(field: string): number {
  const index = EMPLOYEE_COLUMN_ORDER.indexOf(field)
  return index === -1 ? EMPLOYEE_COLUMN_ORDER.length : index
}

function groupBy(fields: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  for (const field of fields) {
    const group = FIELD_GROUP_OF[field] ?? 'OTHER'
    groups.set(group, [...(groups.get(group) ?? []), field])
  }
  return groups
}
