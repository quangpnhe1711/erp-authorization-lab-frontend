import type { ReactNode } from 'react'
import {
  FIELD_GROUP_LABELS,
  FIELD_GROUP_OF,
  FIELD_LABELS,
  SENSITIVE_FIELD_GROUPS,
} from '@/shared/permissions/screens'
import { formatFieldValue } from '@/shared/format'
import { Badge, EmptyState, KeyValue } from '@/shared/ui/primitives'

/**
 * Groups whatever fields came back into their field groups (spec §9). A group the caller cannot
 * read simply has no fields in the response, so it is not rendered at all — no greyed-out ghosts.
 */
export function FieldSections({
  fields,
  order,
  footer,
}: {
  fields: Record<string, unknown>
  order: string[]
  footer?: ReactNode
}) {
  const present = order.filter((field) => field in fields)
  const groups = new Map<string, string[]>()
  for (const field of present) {
    const group = FIELD_GROUP_OF[field] ?? 'OTHER'
    const list = groups.get(group) ?? []
    list.push(field)
    groups.set(group, list)
  }

  if (groups.size === 0) {
    return (
      <EmptyState
        title="Không có trường nào bạn được phép đọc"
        hint="Field group readable của màn hình này đang rỗng — kiểm tra role_field_group_permissions."
      />
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[...groups.entries()].map(([group, groupFields]) => (
        <section key={group} className="border border-line p-5" data-testid={`field-group-${group}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="eyebrow">{FIELD_GROUP_LABELS[group] ?? group}</p>
            {SENSITIVE_FIELD_GROUPS.has(group) && <Badge tone="brand">Nhạy cảm</Badge>}
          </div>
          <dl>
            {groupFields.map((field) => (
              <KeyValue key={field} label={FIELD_LABELS[field] ?? field}>
                <span data-field={field}>{formatFieldValue(field, fields[field])}</span>
              </KeyValue>
            ))}
          </dl>
        </section>
      ))}
      {footer}
    </div>
  )
}
