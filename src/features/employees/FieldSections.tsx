import { Banknote, Briefcase, Building2, FolderKanban, Landmark, Phone, User, type LucideIcon } from 'lucide-react'
import { FIELD_GROUP_LABELS, FIELD_GROUP_OF, FIELD_LABELS } from '@/shared/permissions/screens'
import { formatFieldValue } from '@/shared/format'
import { humanizeValue } from '@/shared/ui/FieldTable'
import { Card, KeyValue } from '@/shared/ui/primitives'
import { EmptyState } from '@/shared/ui/feedback'

const GROUP_ICONS: Record<string, LucideIcon> = {
  PUBLIC_INFORMATION: User,
  CONTACT_INFORMATION: Phone,
  PERSONAL_INFORMATION: User,
  ORGANIZATION_INFORMATION: Building2,
  CONTRACT_INFORMATION: Briefcase,
  SALARY_INFORMATION: Banknote,
  BANK_INFORMATION: Landmark,
  PROJECT_INFORMATION: FolderKanban,
}

const BADGE_VALUE_FIELDS = new Set(['status', 'contractType', 'projectStatus', 'roleInProject'])

/**
 * A record shown as the sections a person would expect on a profile: contact, organisation,
 * contract. Sections the caller may not read simply are not in the payload, so they are not drawn
 * — no locked rows, no greyed placeholders, nothing to wonder about.
 */
export function FieldSections({ fields, order }: { fields: Record<string, unknown>; order: string[] }) {
  const present = order.filter((field) => field in fields)
  const groups = new Map<string, string[]>()
  for (const field of present) {
    const group = FIELD_GROUP_OF[field] ?? 'OTHER'
    groups.set(group, [...(groups.get(group) ?? []), field])
  }

  if (groups.size === 0) {
    return (
      <EmptyState
        title="Không có thông tin nào để hiển thị"
        description="Bạn chưa được cấp quyền xem chi tiết của hồ sơ này."
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...groups.entries()].map(([group, groupFields]) => {
        const Icon = GROUP_ICONS[group] ?? User
        return (
          <Card key={group} data-testid={`field-group-${group}`}>
            <div className="mb-2 flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-control bg-canvas text-ink-muted">
                <Icon size={15} strokeWidth={1.9} aria-hidden />
              </span>
              <h3 className="text-sm font-semibold text-ink">{FIELD_GROUP_LABELS[group] ?? group}</h3>
            </div>
            <dl className="divide-y divide-line">
              {groupFields.map((field) => (
                <KeyValue key={field} label={FIELD_LABELS[field] ?? field}>
                  <span data-field={field}>
                    {BADGE_VALUE_FIELDS.has(field) && typeof fields[field] === 'string'
                      ? humanizeValue(field, String(fields[field]))
                      : formatFieldValue(field, fields[field])}
                  </span>
                </KeyValue>
              ))}
            </dl>
          </Card>
        )
      })}
    </div>
  )
}
