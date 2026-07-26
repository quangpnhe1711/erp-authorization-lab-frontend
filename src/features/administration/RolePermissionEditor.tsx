import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/shared/api/endpoints'
import type { FieldGroupPermission, ScreenPermissionRow } from '@/shared/api/types'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { FIELD_GROUP_LABELS } from '@/shared/permissions/screens'
import { Badge, Button, PageHeader, Select, Spinner, Table, Td, Th } from '@/shared/ui/primitives'
import { Alert, ApiErrorPanel } from '@/shared/ui/feedback'
import { Card } from '@/shared/ui/primitives'
import { useAdminMetadata, useRolePermissions } from './hooks'

const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE']
const SCOPES = ['NONE', 'SELF', 'TEAM', 'DEPARTMENT', 'RESPONSIBILITY', 'ALL']

export type EditorMode = 'access' | 'scope' | 'fieldGroups'

/**
 * One editor, three admin screens. All three edit the same (role × screen) row — screen access +
 * actions, record scopes, or field-group CRUD — and save through the same PUT, so a change made on
 * any of them is immediately visible to the permission engine.
 */
export function RolePermissionEditor({
  mode,
  title,
  description,
}: {
  mode: EditorMode
  title: string
  description: string
}) {
  const { screen } = useActiveScreen()
  const queryClient = useQueryClient()
  const metadata = useAdminMetadata(screen)
  const [roleId, setRoleId] = useState<number | null>(null)
  const [draft, setDraft] = useState<ScreenPermissionRow[]>([])
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

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
      setSaved(true)
      // The engine reads these tables on every request; drop cached permission answers.
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] })
      queryClient.invalidateQueries({ queryKey: ['screen-permission'] })
      queryClient.invalidateQueries({ queryKey: ['navigation'] })
    },
  })

  const patch = (screenId: number, change: Partial<ScreenPermissionRow>) => {
    setDraft((rows) => rows.map((row) => (row.screenId === screenId ? { ...row, ...change } : row)))
    setDirty(true)
    setSaved(false)
  }

  const toggleInList = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const patchFieldGroup = (screenId: number, code: string, key: keyof FieldGroupPermission, value: boolean) => {
    setDraft((rows) =>
      rows.map((row) => {
        if (row.screenId !== screenId) return row
        const existing = row.fieldGroups.find((g) => g.fieldGroupCode === code)
        const next: FieldGroupPermission = existing
          ? { ...existing, [key]: value }
          : { fieldGroupCode: code, canRead: false, canCreate: false, canUpdate: false, [key]: value }
        return {
          ...row,
          fieldGroups: [...row.fieldGroups.filter((g) => g.fieldGroupCode !== code), next].sort((a, b) =>
            a.fieldGroupCode.localeCompare(b.fieldGroupCode),
          ),
        }
      }),
    )
    setDirty(true)
    setSaved(false)
  }

  const grouped = useMemo(() => {
    const map = new Map<string, ScreenPermissionRow[]>()
    for (const row of draft) {
      const key = row.submoduleKey ? `${row.moduleKey} · ${row.submoduleKey}` : row.moduleKey
      map.set(key, [...(map.get(key) ?? []), row])
    }
    return map
  }, [draft])

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title={title}
        description={description}
        actions={
          <>
            <Select
              value={roleId ?? ''}
              onChange={(e) => setRoleId(Number(e.target.value))}
              aria-label="Chọn role"
              data-testid="role-select"
              className="w-56"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.code}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              disabled={!dirty || save.isPending}
              onClick={() => save.mutate()}
              data-testid="save-permissions"
            >
              {save.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </>
        }
      />

      {metadata.error != null && <ApiErrorPanel error={metadata.error} className="mb-4" />}
      {matrix.error != null && <ApiErrorPanel error={matrix.error} className="mb-4" />}
      {save.error != null && <ApiErrorPanel error={save.error} className="mb-4" />}
      {saved && (
        <Alert tone="success" className="mb-4" title="Đã lưu">
          Cấu hình quyền đã được ghi. Người dùng mang role này sẽ thấy hiệu lực ở request kế tiếp.
        </Alert>
      )}

      <Card padded={false}>
        {(metadata.isLoading || matrix.isLoading) && (
          <div className="px-6">
            <Spinner />
          </div>
        )}
        {[...grouped.entries()].map(([group, rows]) => (
          <div key={group}>
            <p className="border-b border-line bg-surface-sunken px-4 py-2 font-display text-[10px] font-bold uppercase tracking-label text-ink-faint">
              {group}
            </p>
            <Table data-testid={`matrix-${mode}`}>
              <thead>
                <tr>
                  <Th className="w-72">Màn hình</Th>
                  {mode === 'access' && (
                    <>
                      <Th className="w-28">Truy cập</Th>
                      <Th>Hành động</Th>
                    </>
                  )}
                  {mode === 'scope' && <Th>Record scope (hợp của các dòng)</Th>}
                  {mode === 'fieldGroups' && <Th>Field group · R / C / U</Th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.screenId} data-testid={`matrix-row-${row.screenCode}`}>
                    <Td>
                      <span className="block font-mono text-[12px] text-ink">{row.screenCode}</span>
                      <span className="block text-[12px] text-ink-faint">{row.screenName}</span>
                    </Td>

                    {mode === 'access' && (
                      <>
                        <Td>
                          <label className="inline-flex items-center gap-2 text-[12px]">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#ce181e]"
                              checked={row.canAccess}
                              onChange={(e) => patch(row.screenId, { canAccess: e.target.checked })}
                              data-testid={`access-${row.screenCode}`}
                            />
                            {row.canAccess ? 'Cho phép' : 'Chặn'}
                          </label>
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-3">
                            {ACTIONS.map((action) => (
                              <label key={action} className="inline-flex items-center gap-1.5 text-[12px]">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-[#ce181e]"
                                  checked={row.actions.includes(action)}
                                  onChange={() => patch(row.screenId, { actions: toggleInList(row.actions, action) })}
                                  data-testid={`action-${row.screenCode}-${action}`}
                                />
                                {action}
                              </label>
                            ))}
                          </div>
                        </Td>
                      </>
                    )}

                    {mode === 'scope' && (
                      <Td>
                        <div className="flex flex-wrap gap-3">
                          {SCOPES.map((scope) => (
                            <label key={scope} className="inline-flex items-center gap-1.5 text-[12px]">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-[#ce181e]"
                                checked={row.recordScopes.includes(scope)}
                                onChange={() =>
                                  patch(row.screenId, { recordScopes: toggleInList(row.recordScopes, scope) })
                                }
                                data-testid={`scope-${row.screenCode}-${scope}`}
                              />
                              {scope}
                            </label>
                          ))}
                        </div>
                      </Td>
                    )}

                    {mode === 'fieldGroups' && (
                      <Td>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {fieldGroups.map((group) => {
                            const perm = row.fieldGroups.find((g) => g.fieldGroupCode === group.code)
                            return (
                              <div key={group.code} className="flex items-center justify-between gap-3 text-[12px]">
                                <span className="truncate" title={group.code}>
                                  {FIELD_GROUP_LABELS[group.code] ?? group.code}
                                </span>
                                <span className="flex shrink-0 gap-2">
                                  {(['canRead', 'canCreate', 'canUpdate'] as const).map((key) => (
                                    <label key={key} className="inline-flex items-center gap-1">
                                      <input
                                        type="checkbox"
                                        className="h-3.5 w-3.5 accent-[#ce181e]"
                                        checked={Boolean(perm?.[key])}
                                        onChange={(e) =>
                                          patchFieldGroup(row.screenId, group.code, key, e.target.checked)
                                        }
                                        data-testid={`fg-${row.screenCode}-${group.code}-${key}`}
                                      />
                                      {key === 'canRead' ? 'R' : key === 'canCreate' ? 'C' : 'U'}
                                    </label>
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

      <p className="mt-4 text-[12px] text-ink-faint">
        <Badge tone="muted">Lưu ý</Badge> Ghi bằng <span className="font-mono">PUT /api/admin/role-permissions</span>{' '}
        thay thế toàn bộ cấu hình của các màn hình gửi lên. Dòng field group không có quyền nào sẽ bị xoá — sparse
        row nghĩa là deny.
      </p>
    </>
  )
}

export function ScreenPermissionConfigPage() {
  return (
    <RolePermissionEditor
      mode="access"
      title="Cấu hình quyền màn hình"
      description="role_screen_permissions + role_screen_actions. Không có quyền truy cập thì mọi API gọi từ màn hình đó đều trả SCREEN_ACCESS_DENIED."
    />
  )
}

export function RecordScopeConfigPage() {
  return (
    <RolePermissionEditor
      mode="scope"
      title="Cấu hình record scope"
      description="Nhiều dòng scope cho cùng (role, screen) là hợp lệ — kết quả là HỢP của các phạm vi, không phải scope lớn nhất."
    />
  )
}

export function FieldGroupPermissionConfigPage() {
  return (
    <RolePermissionEditor
      mode="fieldGroups"
      title="Cấu hình quyền field group"
      description="R = đọc, C = tạo, U = sửa. Trường không có quyền đọc sẽ bị loại khỏi response, không trả null."
    />
  )
}
