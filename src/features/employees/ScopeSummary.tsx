import type { ScreenPermission } from '@/shared/api/types'
import { FIELD_GROUP_LABELS } from '@/shared/permissions/screens'
import { Badge } from '@/shared/ui/primitives'

const SCOPE_HINTS: Record<string, string> = {
  NONE: 'Không thấy bản ghi nào',
  SELF: 'Chỉ bản ghi của chính mình',
  TEAM: 'Nhóm của mình (bao gồm bản thân)',
  DEPARTMENT: 'Phòng ban của mình (bao gồm bản thân)',
  RESPONSIBILITY: 'Phạm vi được phân công phụ trách',
  ALL: 'Toàn bộ bản ghi',
}

/** Explains, on-screen, why the list looks the way it does — the lab's whole teaching point. */
export function ScopeSummary({
  permission,
  rowCount,
}: {
  permission: ScreenPermission | undefined
  rowCount?: number
}) {
  if (!permission) return null
  return (
    <div className="grid gap-3 border border-line bg-white p-4 md:grid-cols-3" data-testid="scope-summary">
      <div>
        <p className="eyebrow mb-2">Record scope</p>
        <div className="flex flex-wrap gap-1" data-testid="scope-list">
          {permission.recordScopes.length === 0 && <Badge tone="muted">—</Badge>}
          {permission.recordScopes.map((scope) => (
            <Badge key={scope} tone="brand" title={SCOPE_HINTS[scope]}>
              {scope}
            </Badge>
          ))}
        </div>
        {typeof rowCount === 'number' && (
          <p className="mt-2 text-[12px] text-ink-faint">{rowCount} bản ghi nằm trong phạm vi.</p>
        )}
      </div>

      <div>
        <p className="eyebrow mb-2">Field group đọc được</p>
        <div className="flex flex-wrap gap-1">
          {permission.readableFieldGroups.length === 0 && <Badge tone="muted">—</Badge>}
          {permission.readableFieldGroups.map((group) => (
            <Badge key={group}>{FIELD_GROUP_LABELS[group] ?? group}</Badge>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2">Role đóng góp quyền</p>
        <div className="flex flex-wrap gap-1">
          {permission.sourceRoles.map((role) => (
            <Badge key={role} tone="muted">
              {role}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-ink-faint">Hành động: {permission.allowedActions.join(', ') || '—'}</p>
      </div>
    </div>
  )
}
