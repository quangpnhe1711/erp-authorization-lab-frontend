import clsx from 'clsx'
import { AlertTriangle, Link2Off } from 'lucide-react'
import { Badge, Checkbox, Select, Table, Td, Th } from '@/shared/ui/primitives'
import { ACTION_LABELS, SCOPE_LABELS, type Lattice } from './labVocabulary'
import type { ActionName, ActionPermission, GroupPermissionView, ScopeCode } from './types'

export interface MatrixRow extends GroupPermissionView {}

/**
 * The field-group permission matrix. Every cell edits ONE action of ONE group, and the scope select
 * of an action offers only the scopes that action may legally hold:
 *
 *  - read is bounded by the screen's maximum record scope;
 *  - update and unmask are bounded by the read scope of the same row.
 *
 * The bound is applied by disabling the illegal options rather than by silently substituting a value,
 * so the reason a scope is unavailable stays visible. Nothing here copies one action's scope into
 * another action except the documented defaults on first enable.
 */
export function PermissionMatrix({
  rows,
  scopes,
  lattice,
  maxRecordScope,
  disabled,
  onChange,
}: {
  rows: MatrixRow[]
  scopes: ScopeCode[]
  lattice: Lattice
  maxRecordScope: ScopeCode | null
  disabled?: boolean
  onChange: (groupCode: string, action: ActionName, next: ActionPermission) => void
}) {
  const allowedFor = (action: ActionName, row: MatrixRow): ScopeCode[] => {
    const ceiling = action === 'read' ? maxRecordScope : (row.read.scope ?? null)
    if (!ceiling) return scopes
    return scopes.filter((scope) => lattice.isProvablyWithin(scope, ceiling))
  }

  return (
    <Table data-testid="permission-matrix">
      <thead className="sticky top-0 z-10 bg-surface">
        <tr>
          <Th className="sticky left-0 z-20 w-72 bg-surface">Nhóm thông tin</Th>
          <Th className="w-24">{ACTION_LABELS.read}</Th>
          <Th className="w-52">Phạm vi xem</Th>
          <Th className="w-24">{ACTION_LABELS.update}</Th>
          <Th className="w-52">Phạm vi sửa</Th>
          <Th className="w-32">{ACTION_LABELS.unmask}</Th>
          <Th className="w-52">Phạm vi xem thật</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.groupCode} data-testid={`matrix-row-${row.groupCode}`} className="hover:bg-surface-muted">
            <Td className="sticky left-0 bg-surface">
              <span className="flex items-center gap-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink" title={row.groupCode}>
                    {row.groupName}
                  </span>
                  <span className="block truncate text-xs text-ink-subtle">{row.groupCode}</span>
                </span>
                {row.multiGroupFields.length > 0 && (
                  <span
                    title={`Field thuộc nhiều nhóm: ${row.multiGroupFields.join(', ')}`}
                    data-testid={`multi-group-warning-${row.groupCode}`}
                  >
                    <AlertTriangle size={15} className="shrink-0 text-caution-500" aria-hidden />
                  </span>
                )}
                {!row.attachedToScreen && (
                  <span title="Nhóm chưa được gắn vào màn hình này" data-testid={`unattached-${row.groupCode}`}>
                    <Link2Off size={15} className="shrink-0 text-brand-500" aria-hidden />
                  </span>
                )}
              </span>
            </Td>

            <ActionCells
              row={row}
              action="read"
              allowed={allowedFor('read', row)}
              disabled={disabled}
              onChange={onChange}
            />
            <ActionCells
              row={row}
              action="update"
              allowed={allowedFor('update', row)}
              disabled={disabled || !row.read.enabled}
              onChange={onChange}
            />
            {row.containsPii ? (
              <ActionCells
                row={row}
                action="unmask"
                allowed={allowedFor('unmask', row)}
                disabled={disabled || !row.read.enabled}
                onChange={onChange}
              />
            ) : (
              <>
                <Td>
                  <Badge tone="neutral" title="Nhóm không chứa field nhạy cảm">
                    Không áp dụng
                  </Badge>
                </Td>
                <Td>—</Td>
              </>
            )}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <Td className="text-sm text-ink-muted">Không có nhóm nào khớp bộ lọc.</Td>
          </tr>
        )}
      </tbody>
    </Table>
  )
}

function ActionCells({
  row,
  action,
  allowed,
  disabled,
  onChange,
}: {
  row: MatrixRow
  action: ActionName
  allowed: ScopeCode[]
  disabled?: boolean
  onChange: (groupCode: string, action: ActionName, next: ActionPermission) => void
}) {
  const permission = row[action]

  /**
   * Defaults on first enable (spec §7.6): update starts at the read scope, unmask starts at SELF.
   * These are starting points for the editor, never a derivation — the resolver reads the stored
   * value and nothing else.
   */
  const defaultScope = (): ScopeCode | null => {
    if (action === 'read') return row.read.scope ?? 'SELF'
    if (action === 'update') return row.read.scope ?? 'SELF'
    return 'SELF'
  }

  return (
    <>
      <Td>
        <Checkbox
          checked={permission.enabled}
          disabled={disabled}
          data-testid={`cell-${row.groupCode}-${action}`}
          label={permission.enabled ? 'Có' : 'Không'}
          onChange={(event) =>
            onChange(row.groupCode, action, {
              enabled: event.target.checked,
              scope: event.target.checked ? defaultScope() : null,
            })
          }
        />
      </Td>
      <Td>
        <Select
          value={permission.scope ?? ''}
          disabled={disabled || !permission.enabled}
          aria-label={`Phạm vi ${ACTION_LABELS[action]} của ${row.groupName}`}
          data-testid={`scope-${row.groupCode}-${action}`}
          onChange={(event) =>
            onChange(row.groupCode, action, {
              enabled: permission.enabled,
              scope: (event.target.value || null) as ScopeCode | null,
            })
          }
          className={clsx(!permission.enabled && 'opacity-50')}
        >
          <option value="">—</option>
          {allowed.map((scope) => (
            <option key={scope} value={scope}>
              {SCOPE_LABELS[scope]}
            </option>
          ))}
          {/* A stored scope that is no longer legal stays visible rather than disappearing silently. */}
          {permission.scope && !allowed.includes(permission.scope) && (
            <option value={permission.scope}>{SCOPE_LABELS[permission.scope]} (ngoài giới hạn)</option>
          )}
        </Select>
      </Td>
    </>
  )
}
