import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { organizationApi } from '@/shared/api/endpoints'
import type { OrganizationOptions } from '@/shared/api/types'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { FIELD_GROUP_LABELS, FIELD_GROUP_OF, FIELD_LABELS } from '@/shared/permissions/screens'
import { Button, Input, Label, Select } from '@/shared/ui/primitives'
import { ApiErrorPanel } from '@/shared/ui/feedback'
import { EMPLOYEE_COLUMN_ORDER } from '@/shared/ui/FieldTable'

const ID_FIELDS = new Set(['department', 'team', 'manager'])
const ENUM_OPTIONS: Record<string, string[]> = {
  status: ['ACTIVE', 'INACTIVE'],
  contractType: ['FULLTIME', 'PARTTIME', 'CONTRACT'],
}

export type FormMode = 'update' | 'create'

/**
 * Renders exactly the fields the server says are writable on this screen
 * ({@code updatableFields} / {@code creatableFields}) and submits only what changed.
 * A field the backend would reject is never rendered — but the backend still rejects it.
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
  const needsOptions = writable.some((f) => ID_FIELDS.has(f))
  const { data: options } = useQuery<OrganizationOptions>({
    queryKey: ['org-options', screen.screenCode],
    queryFn: () => organizationApi.options(screen),
    enabled: needsOptions,
    staleTime: 300_000,
  })

  const [values, setValues] = useState<Record<string, string>>(() => seed(writable, initial, options))
  const [touched, setTouched] = useState<Set<string>>(new Set())

  // Options arrive after the first render; re-seed the id fields once they do.
  const seeded = useMemo(() => seed(writable, initial, options), [writable, initial, options])
  const effective = (field: string) => (touched.has(field) ? (values[field] ?? '') : (seeded[field] ?? ''))

  const setField = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => new Set(prev).add(field))
  }

  if (writable.length === 0) {
    return (
      <p className="border border-dashed border-line-strong bg-surface-raised px-4 py-6 text-center text-[13px] text-ink-faint">
        Màn hình này không cho phép bạn ghi trường nào.
      </p>
    )
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const payload: Record<string, unknown> = {}
    for (const field of writable) {
      const raw = effective(field)
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
        <fieldset key={group} className="border border-line p-5">
          <legend className="eyebrow px-2">{FIELD_GROUP_LABELS[group] ?? group}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field}>
                <Label htmlFor={`field-${field}`}>{FIELD_LABELS[field] ?? field}</Label>
                {renderControl(field, effective(field), (v) => setField(field, v), options)}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      {error != null && <ApiErrorPanel error={error} />}

      <div className="flex gap-2">
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
) {
  const id = `field-${field}`
  if (ID_FIELDS.has(field)) {
    const list =
      field === 'department' ? options?.departments : field === 'team' ? options?.teams : options?.managers
    return (
      <Select id={id} name={field} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Không chọn —</option>
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
      <Select id={id} name={field} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Không chọn —</option>
        {ENUM_OPTIONS[field]!.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    )
  }
  const type = field === 'dateOfBirth' ? 'date' : field === 'salary' ? 'number' : 'text'
  return <Input id={id} name={field} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
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
      // The read projection carries names; the write path wants ids.
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
