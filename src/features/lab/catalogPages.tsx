import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Copy, EyeOff, Search } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Input,
  Label,
  PageHeader,
  SearchInput,
  Select,
  SkeletonRows,
  Table,
  Td,
  Th,
} from '@/shared/ui/primitives'
import { ErrorNotice, Modal, Toast } from '@/shared/ui/feedback'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { labApi } from './api'
import { useLabFieldGroups, useLabFields, useLabModules, useLabRoles, useLabUsers } from './hooks'
import { PII_LABELS } from './labVocabulary'
import { PayloadInspector, type PayloadEntry } from './PayloadInspector'
import type { FieldGroupSummary } from './types'

/* ------------------------------------------------------------------ roles */

/** Roles as configuration: which modules they serve, how many users hold them, how far they reach. */
export function LabRolesPage() {
  const roles = useLabRoles()
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (roles.data ?? []).filter(
      (role) =>
        !term ||
        role.code.toLowerCase().includes(term) ||
        role.name.toLowerCase().includes(term) ||
        role.modules.some((m) => m.toLowerCase().includes(term)),
    )
  }, [roles.data, search])

  return (
    <div className="space-y-5">
      <PageHeader title="Vai trò" description="Mọi quyền đều đi qua vai trò — không cấp trực tiếp cho user." />
      {roles.error != null && <ErrorNotice error={roles.error} />}
      <Card padded={false}>
        <CardHeader
          className="m-0 px-5 pt-5"
          title={`${rows.length} vai trò`}
          actions={
            <SearchInput
              icon={Search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm vai trò hoặc module"
              aria-label="Tìm vai trò"
              className="h-9 w-56"
            />
          }
        />
        {roles.isLoading ? (
          <SkeletonRows rows={6} columns={6} />
        ) : (
          <Table data-testid="roles-table">
            <thead>
              <tr>
                <Th className="w-56">Vai trò</Th>
                <Th className="w-32">Loại</Th>
                <Th>Module áp dụng</Th>
                <Th className="w-24">User</Th>
                <Th className="w-28">Màn hình</Th>
                <Th className="w-32">Trạng thái</Th>
                <Th className="w-32">Hành động</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((role) => (
                <tr key={role.code} data-testid={`role-${role.code}`}>
                  <Td>
                    <span className="block font-medium text-ink">{role.name}</span>
                    <span className="block text-xs text-ink-subtle">{role.code}</span>
                  </Td>
                  <Td>{role.kind === 'pos' ? 'Theo vị trí' : 'Theo chức năng'}</Td>
                  <Td>
                    {role.modules.length === 0 ? (
                      <Badge tone="brand">Chưa áp dụng module nào</Badge>
                    ) : (
                      <span className="flex flex-wrap gap-1">
                        {role.modules.map((module) => (
                          <Badge key={module} tone="neutral">
                            {module}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span data-numeric>{role.userCount}</span>
                  </Td>
                  <Td>
                    <span data-numeric>{role.screenCount}</span>
                  </Td>
                  <Td>
                    {role.active ? <Badge tone="positive">Đang dùng</Badge> : <Badge tone="neutral">Tắt</Badge>}
                  </Td>
                  <Td>
                    <Link
                      to={`/lab/permissions?role=${role.code}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Cấu hình quyền
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

/* --------------------------------------------------------- modules & screens */

export function LabModulesPage() {
  const modules = useLabModules()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Module & màn hình"
        description="Cây điều hướng, resource chính của từng màn và các nhóm field được gắn vào."
      />
      {modules.error != null && <ErrorNotice error={modules.error} />}
      {modules.isLoading && <SkeletonRows rows={8} columns={5} />}
      {(modules.data ?? []).map((module) => (
        <Card key={module.moduleKey} padded={false} data-testid={`module-${module.moduleKey}`}>
          <CardHeader
            className="m-0 px-5 pt-5"
            title={`${module.name} · ${module.moduleKey}`}
            description={module.description ?? undefined}
            actions={module.active ? <Badge tone="positive">Active</Badge> : <Badge tone="neutral">Tắt</Badge>}
          />
          <Table>
            <thead>
              <tr>
                <Th className="w-64">Màn hình</Th>
                <Th className="w-40">Submodule</Th>
                <Th className="w-40">Resource chính</Th>
                <Th className="w-56">Route</Th>
                <Th>Nhóm field</Th>
              </tr>
            </thead>
            <tbody>
              {module.screens.map((screen) => (
                <tr key={screen.screenCode}>
                  <Td>
                    <span className="block font-medium text-ink">{screen.name}</span>
                    <span className="block text-xs text-ink-subtle">{screen.screenCode}</span>
                  </Td>
                  <Td>{screen.submoduleKey ?? '—'}</Td>
                  <Td>{screen.resourceCode ?? '—'}</Td>
                  <Td>
                    <span className="font-mono text-xs text-ink-muted">{screen.routePath ?? '—'}</span>
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {screen.fieldGroups.length === 0 ? (
                        <span className="text-ink-subtle">—</span>
                      ) : (
                        screen.fieldGroups.map((group) => (
                          <Badge key={group} tone="neutral">
                            {group}
                          </Badge>
                        ))
                      )}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------ field catalogue */

export function LabFieldsPage() {
  const fields = useLabFields()
  const [search, setSearch] = useState('')
  const [piiOnly, setPiiOnly] = useState(false)
  const [multiOnly, setMultiOnly] = useState(false)

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (fields.data ?? []).filter((field) => {
      if (piiOnly && !field.sensitive) return false
      if (multiOnly && field.groups.length < 2) return false
      if (!term) return true
      return (
        field.fieldName.toLowerCase().includes(term) ||
        field.displayName.toLowerCase().includes(term) ||
        (field.tableName ?? '').toLowerCase().includes(term) ||
        (field.resourceCode ?? '').toLowerCase().includes(term)
      )
    })
  }, [fields.data, search, piiOnly, multiOnly])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Danh mục field"
        description="Mỗi field có một phân loại PII, và có thể thuộc nhiều nhóm — đó là nguồn của hợp quyền."
      />
      {fields.error != null && <ErrorNotice error={fields.error} />}
      <Card padded={false}>
        <CardHeader
          className="m-0 flex-wrap px-5 pt-5"
          title={`${rows.length} field`}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                icon={Search}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm field, bảng, resource"
                aria-label="Tìm field"
                className="h-9 w-56"
                data-testid="field-search"
              />
              <Checkbox
                checked={piiOnly}
                onChange={(event) => setPiiOnly(event.target.checked)}
                label="Chỉ field nhạy cảm"
                data-testid="filter-pii-fields"
              />
              <Checkbox
                checked={multiOnly}
                onChange={(event) => setMultiOnly(event.target.checked)}
                label="Chỉ field thuộc nhiều nhóm"
                data-testid="filter-multi-group"
              />
            </div>
          }
        />
        {fields.isLoading ? (
          <SkeletonRows rows={8} columns={7} />
        ) : (
          <Table data-testid="fields-table">
            <thead>
              <tr>
                <Th className="w-56">Field</Th>
                <Th className="w-36">Service</Th>
                <Th className="w-44">Bảng · cột</Th>
                <Th className="w-28">Kiểu</Th>
                <Th className="w-32">Phân loại</Th>
                <Th>Nhóm chứa field</Th>
                <Th>Màn hình dùng</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((field) => (
                <tr key={field.id} data-testid={`field-${field.fieldName}`}>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{field.displayName}</span>
                        <span className="block truncate text-xs text-ink-subtle">{field.fieldName}</span>
                      </span>
                      {field.groups.length > 1 && (
                        <span title={`Thuộc ${field.groups.length} nhóm: ${field.groups.join(', ')}`}>
                          <Copy size={14} className="shrink-0 text-caution-500" aria-hidden />
                        </span>
                      )}
                      {field.sensitive && (
                        <span title="Field nhạy cảm — cần Unmask để xem giá trị thật">
                          <EyeOff size={14} className="shrink-0 text-ink-subtle" aria-hidden />
                        </span>
                      )}
                    </span>
                  </Td>
                  <Td>{field.serviceName}</Td>
                  <Td>
                    <span className="font-mono text-xs text-ink-muted">
                      {field.tableName ?? '—'}
                      {field.columnName ? ` · ${field.columnName}` : ''}
                    </span>
                  </Td>
                  <Td>{field.dataType}</Td>
                  <Td>
                    <Badge tone={field.sensitive ? 'caution' : 'neutral'} title={field.piiClass}>
                      {PII_LABELS[field.piiClass]}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="text-xs text-ink-muted">{field.groups.join(', ') || '—'}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-ink-muted">{field.screens.join(', ') || '—'}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

/* --------------------------------------------------------------- field groups */

export function LabFieldGroupsPage() {
  const queryClient = useQueryClient()
  const groups = useLabFieldGroups()
  const [cloneOf, setCloneOf] = useState<FieldGroupSummary | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [history, setHistory] = useState<PayloadEntry[]>([])

  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [copyPermissions, setCopyPermissions] = useState(false)
  const [attachToSourceScreens, setAttachToSourceScreens] = useState(false)

  const clonePayload = {
    newCode,
    newName,
    copyPermissions,
    attachToSourceScreens,
    screenCodes: [] as string[],
  }

  const clone = useMutation({
    mutationFn: () => labApi.cloneFieldGroup(cloneOf!.code, clonePayload),
    onSuccess: (result) => {
      setToast(
        copyPermissions
          ? 'Đã clone nhóm kèm cấu hình quyền'
          : 'Đã clone nhóm — chưa sao chép quyền nên không user nào đổi quyền',
      )
      setHistory((entries) => [
        { at: new Date().toLocaleTimeString(), label: `Clone ${cloneOf?.code}`, request: clonePayload, response: result },
        ...entries,
      ])
      setCloneOf(null)
      queryClient.invalidateQueries({ queryKey: ['lab'] })
    },
  })

  const openClone = (group: FieldGroupSummary) => {
    setCloneOf(group)
    setNewCode(`${group.code}_COPY`)
    setNewName(`${group.name} (bản sao)`)
    // Both flags start off — a clone must not change anybody's rights by accident (spec §7.5).
    setCopyPermissions(false)
    setAttachToSourceScreens(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nhóm field"
        description="Nhóm là đơn vị cấp quyền. Một field có thể nằm trong nhiều nhóm, và khi đó quyền được hợp theo từng hành động."
      />
      {groups.error != null && <ErrorNotice error={groups.error} />}
      {clone.error != null && <ErrorNotice error={clone.error} />}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          {groups.isLoading && <SkeletonRows rows={8} columns={5} />}
          {(groups.data ?? []).map((group) => (
            <Card key={group.code} data-testid={`group-${group.code}`}>
              <CardHeader
                title={`${group.name} · ${group.code}`}
                description={group.description ?? undefined}
                actions={
                  <Button size="sm" variant="secondary" onClick={() => openClone(group)} data-testid={`clone-${group.code}`}>
                    Clone
                  </Button>
                }
              />
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="section-label">Field trong nhóm</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {group.fields.map((field) => (
                      <Badge
                        key={field.id}
                        tone={field.sensitive ? 'caution' : 'neutral'}
                        title={`${field.fieldName} · ${field.piiClass}`}
                      >
                        {field.displayName}
                      </Badge>
                    ))}
                    {group.fields.length === 0 && <span className="text-sm text-ink-subtle">Chưa có field</span>}
                  </dd>
                </div>
                <div>
                  <dt className="section-label">Gắn vào màn hình</dt>
                  <dd className="mt-1 text-sm text-ink-muted">{group.screens.join(', ') || '—'}</dd>
                  <dt className="section-label mt-3">Vai trò đang được cấp quyền</dt>
                  <dd className="mt-1 text-sm text-ink-muted">{group.grantedRoles.join(', ') || '—'}</dd>
                </div>
              </dl>
              {group.overlappingGroups.length > 0 && (
                <p className="mt-3 flex items-start gap-2 text-sm text-caution-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
                  Field trùng với nhóm: {group.overlappingGroups.join(', ')}
                </p>
              )}
            </Card>
          ))}
        </div>

        <PayloadInspector request={clonePayload} response={clone.data} error={clone.error} history={history} />
      </div>

      <Modal
        open={cloneOf != null}
        title={`Clone nhóm ${cloneOf?.code ?? ''}`}
        description="Danh sách field luôn được sao chép. Quyền và màn hình chỉ sao chép khi bạn chọn rõ."
        onClose={() => setCloneOf(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCloneOf(null)}>
              Huỷ
            </Button>
            <Button onClick={() => clone.mutate()} disabled={clone.isPending} data-testid="confirm-clone">
              {clone.isPending ? 'Đang clone…' : 'Clone'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="clone-code">Mã nhóm mới</Label>
            <Input id="clone-code" value={newCode} onChange={(event) => setNewCode(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="clone-name">Tên nhóm mới</Label>
            <Input id="clone-name" value={newName} onChange={(event) => setNewName(event.target.value)} />
          </div>
          <Checkbox
            checked={copyPermissions}
            onChange={(event) => setCopyPermissions(event.target.checked)}
            label="Sao chép cấu hình permission"
            data-testid="clone-copy-permissions"
          />
          <Checkbox
            checked={attachToSourceScreens}
            onChange={(event) => setAttachToSourceScreens(event.target.checked)}
            label="Gắn vào các màn của nhóm gốc"
            data-testid="clone-attach-screens"
          />
          {cloneOf?.fields.some((f) => f.sensitive) && (
            <p className="text-sm text-caution-700">
              Nhóm gốc chứa field nhạy cảm:{' '}
              {cloneOf.fields.filter((f) => f.sensitive).map((f) => f.fieldName).join(', ')}
            </p>
          )}
        </div>
      </Modal>

      <Toast open={toast != null} message={toast ?? ''} onClose={() => setToast(null)} />
    </div>
  )
}

/* ---------------------------------------------------------------- user roles */

export function LabUsersPage() {
  const queryClient = useQueryClient()
  const users = useLabUsers()
  const roles = useLabRoles()
  const [userId, setUserId] = useState<number | null>(null)
  const [roleCode, setRoleCode] = useState<string>('')
  const [toast, setToast] = useState<string | null>(null)

  const payload = { userId: userId ?? 0, roleCode }

  const assign = useMutation({
    mutationFn: () => labApi.assignRole(payload),
    onSuccess: () => {
      setToast('Đã gán vai trò')
      queryClient.invalidateQueries({ queryKey: ['lab'] })
    },
  })
  const revoke = useMutation({
    mutationFn: (id: number) => labApi.revokeRole(id),
    onSuccess: () => {
      setToast('Đã thu hồi vai trò')
      queryClient.invalidateQueries({ queryKey: ['lab'] })
    },
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Người dùng & vai trò" description="Một user có thể giữ nhiều vai trò; quyền cuối cùng là hợp quyền." />
      {users.error != null && <ErrorNotice error={users.error} />}
      {assign.error != null && <ErrorNotice error={assign.error} />}

      <Card>
        <CardHeader title="Gán vai trò" description="Hiệu lực ngay ở request tiếp theo của user đó." />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-64">
            <Label htmlFor="assign-user">User</Label>
            <Select
              id="assign-user"
              value={userId ?? ''}
              onChange={(event) => setUserId(Number(event.target.value))}
              data-testid="assign-user"
            >
              <option value="">—</option>
              {(users.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.employeeName ?? user.username}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-64">
            <Label htmlFor="assign-role">Vai trò</Label>
            <Select
              id="assign-role"
              value={roleCode}
              onChange={(event) => setRoleCode(event.target.value)}
              data-testid="assign-role"
            >
              <option value="">—</option>
              {(roles.data ?? []).map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={() => assign.mutate()}
            disabled={!userId || !roleCode || assign.isPending}
            data-testid="assign-submit"
          >
            Gán vai trò
          </Button>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader className="m-0 px-5 pt-5" title={`${users.data?.length ?? 0} người dùng`} />
        {users.isLoading ? (
          <SkeletonRows rows={8} columns={4} />
        ) : (
          <Table data-testid="users-table">
            <thead>
              <tr>
                <Th className="w-64">Người dùng</Th>
                <Th className="w-44">Phòng ban</Th>
                <Th>Vai trò · hiệu lực</Th>
                <Th className="w-28">Trạng thái</Th>
              </tr>
            </thead>
            <tbody>
              {(users.data ?? []).map((user) => (
                <tr key={user.id} data-testid={`user-${user.id}`}>
                  <Td>
                    <span className="block font-medium text-ink">{user.employeeName ?? '—'}</span>
                    <span className="block text-xs text-ink-subtle">{user.username}</span>
                  </Td>
                  <Td>{user.departmentName ?? '—'}</Td>
                  <Td>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {user.roles.length === 0 && <span className="text-ink-subtle">Chưa có vai trò</span>}
                      {user.roles.map((assignment) => (
                        <span key={assignment.id} className="flex items-center gap-1">
                          <Badge
                            tone={assignment.active ? 'info' : 'neutral'}
                            title={`Từ ${assignment.validFrom ?? '—'}${
                              assignment.validTo ? ` đến ${assignment.validTo}` : ' (không giới hạn)'
                            }`}
                          >
                            {assignment.roleCode}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => revoke.mutate(assignment.id)}
                            className="text-xs text-ink-subtle hover:text-brand-600"
                            data-testid={`revoke-${assignment.id}`}
                          >
                            thu hồi
                          </button>
                        </span>
                      ))}
                    </span>
                  </Td>
                  <Td>{user.active ? <Badge tone="positive">Active</Badge> : <Badge tone="neutral">Tắt</Badge>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Toast open={toast != null} message={toast ?? ''} onClose={() => setToast(null)} />
    </div>
  )
}
