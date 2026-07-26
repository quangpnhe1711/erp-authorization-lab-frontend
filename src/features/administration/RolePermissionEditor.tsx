import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { adminApi } from '@/shared/api/endpoints'
import type { FieldGroupPermission, ScreenPermissionRow } from '@/shared/api/types'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { FIELD_GROUP_LABELS } from '@/shared/permissions/screens'
import {
  ACTION_LABELS,
  MODULE_LABELS,
  SCOPE_LABELS,
  SCREEN_LABELS,
} from '@/shared/navigation/businessNav'
import { Button, Card, Checkbox, Label, Select, SkeletonRows, Table, Td, Th } from '@/shared/ui/primitives'
import { ErrorState, Toast } from '@/shared/ui/feedback'
import { useAdminMetadata, useRolePermissions } from './hooks'

const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE']
const SCOPES = ['NONE', 'SELF', 'TEAM', 'DEPARTMENT', 'RESPONSIBILITY', 'ALL']

export type EditorMode = 'access' | 'scope' | 'fieldGroups'

/**
 * The same (role × area) row, edited three ways: where a role may go, whose records it may see, and
 * which information it may read or change. Everything is phrased as a question an HR manager would
 * ask, and every change takes effect on the next request — there is no publish step.
 */
export function RolePermissionEditor({ mode, description }: { mode: EditorMode; description: string }) {
  const { screen } = useActiveScreen()
  const queryClient = useQueryClient()
  const metadata = useAdminMetadata(screen)
  const [roleId, setRoleId] = useState<number | null>(null)
  const [draft, setDraft] = useState<ScreenPermissionRow[]>([])
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const roles = metadata.data?.roles ?? []
  useEffect(() => {
    if (roleId == null && roles.length > 0) setRoleId(roles[0]!.id)
  }, [roleId, roles])

  const matrix = useRolePermissions(screen, roleId)
  useEffect(() => {
    if (matrix.data) {
      setDraft(matrix.data.screens)
      setDirty(false)
    }
  }, [matrix.data])

  const fieldGroups = metadata.data?.fieldGroups ?? []

  const save = useMutation({
    mutationFn: () => adminApi.saveRolePermissions(screen, roleId!, draft),
    onSuccess: (result) => {
      setDraft(result.screens)
      setDirty(false)
      setToast('Đã lưu thay đổi quyền')
      // The engine reads these tables on every request; drop anything cached from before.
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] })
      queryClient.invalidateQueries({ queryKey: ['screen-permission'] })
      queryClient.invalidateQueries({ queryKey: ['navigation'] })
    },
  })

  const patch = (screenId: number, change: Partial<ScreenPermissionRow>) => {
    setDraft((rows) => rows.map((row) => (row.screenId === screenId ? { ...row, ...change } : row)))
    setDirty(true)
  }

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

  const patchFieldGroup = (screenId: number, code: string, key: keyof FieldGroupPermission, value: boolean) => {
    setDraft((rows) =>
      rows.map((row) => {
        if (row.screenId !== screenId) return row
        const existing = row.fieldGroups.find((group) => group.fieldGroupCode === code)
        const next: FieldGroupPermission = existing
          ? { ...existing, [key]: value }
          : { fieldGroupCode: code, canRead: false, canCreate: false, canUpdate: false, [key]: value }
        return {
          ...row,
          fieldGroups: [...row.fieldGroups.filter((group) => group.fieldGroupCode !== code), next].sort((a, b) =>
            a.fieldGroupCode.localeCompare(b.fieldGroupCode),
          ),
        }
      }),
    )
    setDirty(true)
  }

  const grouped = useMemo(() => {
    const map = new Map<string, ScreenPermissionRow[]>()
    for (const row of draft) {
      const key = MODULE_LABELS[row.moduleKey] ?? row.moduleKey
      map.set(key, [...(map.get(key) ?? []), row])
    }
    return map
  }, [draft])

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-xs">
          <Label htmlFor="role-select">Vai trò</Label>
          <Select
            id="role-select"
            value={roleId ?? ''}
            onChange={(event) => setRoleId(Number(event.target.value))}
            data-testid="role-select"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </div>
        <p className="min-w-0 flex-1 text-sm text-ink-muted">{description}</p>
        <Button
          icon={Save}
          disabled={!dirty || save.isPending}
          onClick={() => save.mutate()}
          data-testid="save-permissions"
        >
          {save.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </Card>

      {metadata.error != null && <ErrorState error={metadata.error} />}
      {matrix.error != null && <ErrorState error={matrix.error} />}
      {save.error != null && <ErrorState error={save.error} />}

      <Card padded={false}>
        {(metadata.isLoading || matrix.isLoading) && <SkeletonRows rows={6} columns={3} />}
        {[...grouped.entries()].map(([group, rows], groupIndex) => (
          <div key={group}>
            <p
              className={clsx(
                'border-b border-line bg-surface-muted px-4 py-2 text-xs font-semibold text-ink-secondary',
                groupIndex > 0 && 'border-t',
              )}
            >
              {group}
            </p>
            <Table data-testid={`matrix-${mode}`}>
              {/* Column titles once, at the top — repeating them per group is noise. */}
              {groupIndex === 0 && (
                <thead>
                  <tr>
                    <Th className="w-64">Khu vực</Th>
                    {mode === 'access' && (
                      <>
                        <Th className="w-32">Được vào</Th>
                        <Th>Được làm gì</Th>
                      </>
                    )}
                    {mode === 'scope' && <Th>Nhìn thấy dữ liệu của ai</Th>}
                    {mode === 'fieldGroups' && <Th>Thông tin xem được · thêm · sửa</Th>}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row) => (
                  <tr key={row.screenId} data-testid={`matrix-row-${row.screenCode}`} className="hover:bg-surface-muted">
                    <Td>
                      <span className="font-medium text-ink">
                        {SCREEN_LABELS[row.screenCode] ?? row.screenName}
                      </span>
                    </Td>

                    {mode === 'access' && (
                      <>
                        <Td>
                          <Checkbox
                            checked={row.canAccess}
                            onChange={(event) => patch(row.screenId, { canAccess: event.target.checked })}
                            data-testid={`access-${row.screenCode}`}
                            label={row.canAccess ? 'Có' : 'Không'}
                          />
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {ACTIONS.map((action) => (
                              <Checkbox
                                key={action}
                                checked={row.actions.includes(action)}
                                onChange={() => patch(row.screenId, { actions: toggle(row.actions, action) })}
                                data-testid={`action-${row.screenCode}-${action}`}
                                label={ACTION_LABELS[action] ?? action}
                              />
                            ))}
                          </div>
                        </Td>
                      </>
                    )}

                    {mode === 'scope' && (
                      <Td>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          {SCOPES.map((scope) => (
                            <span key={scope} title={SCOPE_LABELS[scope]?.hint}>
                              <Checkbox
                                checked={row.recordScopes.includes(scope)}
                                onChange={() => patch(row.screenId, { recordScopes: toggle(row.recordScopes, scope) })}
                                data-testid={`scope-${row.screenCode}-${scope}`}
                                label={SCOPE_LABELS[scope]?.label ?? scope}
                              />
                            </span>
                          ))}
                        </div>
                      </Td>
                    )}

                    {mode === 'fieldGroups' && (
                      <Td>
                        <div className="grid gap-1.5 lg:grid-cols-2">
                          {fieldGroups.map((group) => {
                            const perm = row.fieldGroups.find((item) => item.fieldGroupCode === group.code)
                            return (
                              <div key={group.code} className="flex items-center justify-between gap-3">
                                <span className="truncate text-sm text-ink-secondary">
                                  {FIELD_GROUP_LABELS[group.code] ?? group.name}
                                </span>
                                <span className="flex shrink-0 gap-2.5">
                                  {(['canRead', 'canCreate', 'canUpdate'] as const).map((key) => (
                                    <Checkbox
                                      key={key}
                                      checked={Boolean(perm?.[key])}
                                      onChange={(event) =>
                                        patchFieldGroup(row.screenId, group.code, key, event.target.checked)
                                      }
                                      data-testid={`fg-${row.screenCode}-${group.code}-${key}`}
                                      label={key === 'canRead' ? 'Xem' : key === 'canCreate' ? 'Thêm' : 'Sửa'}
                                      className="text-xs"
                                    />
                                  ))}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))}
      </Card>

      <Toast open={toast != null} message={toast ?? ''} onClose={() => setToast(null)} />
    </div>
  )
}
