import { useMemo } from 'react'
import { Badge, Card, CardHeader, Table, Td, Th } from '@/shared/ui/primitives'
import { SCOPE_LABELS, type Lattice } from './labVocabulary'
import type { ActionName, GroupPermissionView, ScopeCode } from './types'

interface FieldRow {
  fieldName: string
  groups: string[]
  read: ScopeCode[]
  update: ScopeCode[]
  unmask: ScopeCode[]
}

/**
 * Live preview of what the draft resolves to, per field. It exists because the matrix above shows
 * <em>source</em> configuration: a field in two groups has a different effective scope from either
 * row, and per the model that difference is per action.
 *
 * The union here mirrors the server resolver (union per action, then update/unmask ∩ read), so the
 * screen never suggests a right the backend would refuse.
 */
export function EffectivePreview({
  groups,
  lattice,
}: {
  groups: GroupPermissionView[]
  lattice: Lattice
}) {
  const rows = useMemo<FieldRow[]>(() => {
    // Only fields that appear in more than one group are interesting here; the rest read straight
    // off their single row.
    const byField = new Map<string, FieldRow>()
    for (const group of groups) {
      for (const fieldName of group.multiGroupFields) {
        const row = byField.get(fieldName) ?? {
          fieldName,
          groups: [],
          read: [],
          update: [],
          unmask: [],
        }
        row.groups.push(group.groupCode)
        for (const action of ['read', 'update', 'unmask'] as ActionName[]) {
          const permission = group[action]
          if (permission.enabled && permission.scope && permission.scope !== 'NONE') {
            row[action] = [...new Set([...row[action], permission.scope])]
          }
        }
        byField.set(fieldName, row)
      }
    }

    const maximal = (scopes: ScopeCode[]) =>
      scopes.filter((s) => !scopes.some((o) => o !== s && lattice.isProvablyWithin(s, o)))
    const withinRead = (scopes: ScopeCode[], read: ScopeCode[]) =>
      scopes.filter((s) => read.some((r) => lattice.isProvablyWithin(s, r)))

    return [...byField.values()]
      .map((row) => ({
        ...row,
        groups: row.groups.sort(),
        read: maximal(row.read),
        update: maximal(withinRead(row.update, row.read)),
        unmask: maximal(withinRead(row.unmask, row.read)),
      }))
      .sort((a, b) => a.fieldName.localeCompare(b.fieldName))
  }, [groups, lattice])

  if (rows.length === 0) return null

  return (
    <Card padded={false} data-testid="effective-preview">
      <CardHeader
        className="m-0 px-5 pt-5"
        title="Quyền hiệu lực của field thuộc nhiều nhóm"
        description="Hợp quyền theo từng hành động. Phạm vi xem rộng hơn không kéo theo phạm vi sửa hoặc xem thật."
      />
      <Table>
        <thead>
          <tr>
            <Th className="w-56">Field</Th>
            <Th className="w-56">Thuộc nhóm</Th>
            <Th>Xem</Th>
            <Th>Sửa</Th>
            <Th>Xem thật</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.fieldName} data-testid={`preview-${row.fieldName}`}>
              <Td>
                <span className="font-medium text-ink">{row.fieldName}</span>
              </Td>
              <Td>
                <span className="text-xs text-ink-muted">{row.groups.join(', ')}</span>
              </Td>
              <ScopeCell scopes={row.read} testid={`preview-${row.fieldName}-read`} />
              <ScopeCell scopes={row.update} testid={`preview-${row.fieldName}-update`} />
              <ScopeCell scopes={row.unmask} testid={`preview-${row.fieldName}-unmask`} />
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

function ScopeCell({ scopes, testid }: { scopes: ScopeCode[]; testid: string }) {
  return (
    <Td>
      <span className="flex flex-wrap gap-1" data-testid={testid}>
        {scopes.length === 0 ? (
          <span className="text-ink-subtle">—</span>
        ) : (
          scopes.map((scope) => (
            <Badge key={scope} tone="info" title={scope}>
              {SCOPE_LABELS[scope]}
            </Badge>
          ))
        )}
      </span>
    </Td>
  )
}
