import { Link } from 'react-router-dom'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { Badge, Card, PageHeader, Spinner, Table, Td, Th } from '@/shared/ui/primitives'
import { ApiErrorPanel } from '@/shared/ui/feedback'
import { useAdminMetadata } from './hooks'

/**
 * Read-only catalogue screens. They render the very tables the permission engine reads at runtime,
 * so "what the engine sees" and "what the admin sees" are the same rows.
 */

export function UserManagementPage() {
  const { screen } = useActiveScreen()
  const { data, isLoading, error } = useAdminMetadata(screen)
  return (
    <AdminPage
      eyebrow="Administration"
      title="Quản lý người dùng"
      description="Tài khoản, nhân viên liên kết và role đang hiệu lực."
      isLoading={isLoading}
      error={error}
    >
      <Table data-testid="user-table">
        <thead>
          <tr>
            <Th>Username</Th>
            <Th>Nhân viên</Th>
            <Th>Trạng thái</Th>
            <Th>Roles</Th>
          </tr>
        </thead>
        <tbody>
          {(data?.users ?? []).map((user) => (
            <tr key={user.id}>
              <Td className="font-mono text-[12px]">{user.username}</Td>
              <Td>{user.employeeName ?? '—'}</Td>
              <Td>
                <Badge tone={user.active ? 'success' : 'muted'}>{user.active ? 'ACTIVE' : 'INACTIVE'}</Badge>
              </Td>
              <Td>
                <span className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <Badge key={role.id} tone="brand">
                      {role.roleCode}
                    </Badge>
                  ))}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminPage>
  )
}

export function RoleManagementPage() {
  const { screen } = useActiveScreen()
  const { data, isLoading, error } = useAdminMetadata(screen)
  return (
    <AdminPage
      eyebrow="Administration"
      title="Quản lý role"
      description="Role chức năng (func) và role vị trí (pos). Quyền thực tế nằm ở ma trận role × screen."
      isLoading={isLoading}
      error={error}
    >
      <Table data-testid="role-table">
        <thead>
          <tr>
            <Th>Mã</Th>
            <Th>Tên</Th>
            <Th>Loại</Th>
            <Th>Hệ thống</Th>
            <Th>Số user</Th>
            <Th>&nbsp;</Th>
          </tr>
        </thead>
        <tbody>
          {(data?.roles ?? []).map((role) => (
            <tr key={role.id}>
              <Td className="font-mono text-[12px]">{role.code}</Td>
              <Td>{role.name}</Td>
              <Td>
                <Badge tone={role.kind === 'pos' ? 'brand' : 'neutral'}>{role.kind}</Badge>
              </Td>
              <Td>{role.system ? 'Có' : '—'}</Td>
              <Td>{role.userCount}</Td>
              <Td>
                <Link
                  to="/admin/screen-permissions"
                  className="font-display text-[10px] font-semibold uppercase tracking-label text-brand-500 hover:underline"
                >
                  Cấu hình quyền
                </Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminPage>
  )
}

export function ModuleManagementPage() {
  const { screen } = useActiveScreen()
  const { data, isLoading, error } = useAdminMetadata(screen)
  return (
    <AdminPage
      eyebrow="Administration"
      title="Quản lý module"
      description="Module là cấp cao nhất của screen context (header X-Module-Key)."
      isLoading={isLoading}
      error={error}
    >
      <Table data-testid="module-table">
        <thead>
          <tr>
            <Th>Key</Th>
            <Th>Tên</Th>
            <Th>Thứ tự</Th>
            <Th>Số submodule</Th>
            <Th>Trạng thái</Th>
          </tr>
        </thead>
        <tbody>
          {(data?.modules ?? []).map((mod) => (
            <tr key={mod.id}>
              <Td className="font-mono text-[12px]">{mod.moduleKey}</Td>
              <Td>{mod.name}</Td>
              <Td>{mod.ord}</Td>
              <Td>{(data?.submodules ?? []).filter((s) => s.moduleKey === mod.moduleKey).length}</Td>
              <Td>
                <Badge tone={mod.active ? 'success' : 'muted'}>{mod.active ? 'ACTIVE' : 'INACTIVE'}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminPage>
  )
}

export function SubmoduleManagementPage() {
  const { screen } = useActiveScreen()
  const { data, isLoading, error } = useAdminMetadata(screen)
  return (
    <AdminPage
      eyebrow="Administration"
      title="Quản lý submodule"
      description="Submodule là tuỳ chọn — screen có thể thuộc trực tiếp module (ví dụ DASHBOARD)."
      isLoading={isLoading}
      error={error}
    >
      <Table data-testid="submodule-table">
        <thead>
          <tr>
            <Th>Module</Th>
            <Th>Key</Th>
            <Th>Tên</Th>
            <Th>Thứ tự</Th>
            <Th>Trạng thái</Th>
          </tr>
        </thead>
        <tbody>
          {(data?.submodules ?? []).map((sub) => (
            <tr key={sub.id}>
              <Td className="font-mono text-[12px]">{sub.moduleKey}</Td>
              <Td className="font-mono text-[12px]">{sub.submoduleKey}</Td>
              <Td>{sub.name}</Td>
              <Td>{sub.ord}</Td>
              <Td>
                <Badge tone={sub.active ? 'success' : 'muted'}>{sub.active ? 'ACTIVE' : 'INACTIVE'}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminPage>
  )
}

export function ScreenManagementPage() {
  const { screen } = useActiveScreen()
  const { data, isLoading, error } = useAdminMetadata(screen)
  const apisFor = (screenCode: string) =>
    (data?.screenApiMappings ?? []).filter((m) => m.screenCode === screenCode).map((m) => m.apiCode)

  return (
    <AdminPage
      eyebrow="Administration"
      title="Quản lý màn hình"
      description="screen_api_mappings quyết định màn hình nào được gọi use-case nào — sai mapping trả SCREEN_API_MAPPING_DENIED."
      isLoading={isLoading}
      error={error}
    >
      <Table data-testid="screen-table">
        <thead>
          <tr>
            <Th>Module</Th>
            <Th>Submodule</Th>
            <Th>Screen code</Th>
            <Th>Route</Th>
            <Th>API use-case được phép</Th>
          </tr>
        </thead>
        <tbody>
          {(data?.screens ?? []).map((row) => (
            <tr key={row.id}>
              <Td className="font-mono text-[12px]">{row.moduleKey}</Td>
              <Td className="font-mono text-[12px]">{row.submoduleKey ?? '—'}</Td>
              <Td className="font-mono text-[12px]">{row.screenCode}</Td>
              <Td className="font-mono text-[12px]">{row.routePath ?? '—'}</Td>
              <Td>
                <span className="flex flex-wrap gap-1">
                  {apisFor(row.screenCode).map((api) => (
                    <Badge key={api}>{api}</Badge>
                  ))}
                  {apisFor(row.screenCode).length === 0 && <span className="text-ink-faint">—</span>}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminPage>
  )
}

export function FieldGroupConfigPage() {
  const { screen } = useActiveScreen()
  const { data, isLoading, error } = useAdminMetadata(screen)
  return (
    <AdminPage
      eyebrow="Administration"
      title="Cấu hình field group"
      description="Field group là đơn vị cấp quyền đọc/ghi ở mức trường. Một trường chỉ thuộc đúng một group."
      isLoading={isLoading}
      error={error}
    >
      <div className="grid gap-4 md:grid-cols-2" data-testid="field-group-list">
        {(data?.fieldGroups ?? []).map((group) => (
          <section key={group.id} className="border border-line p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">{group.code}</p>
              <Badge tone={group.active ? 'success' : 'muted'}>{group.fields.length} trường</Badge>
            </div>
            <p className="mb-3 text-[13px] text-ink-faint">{group.description ?? group.name}</p>
            <ul className="space-y-1 text-[13px]">
              {group.fields.map((field) => (
                <li key={field.id} className="flex items-center justify-between gap-2 border-b border-line py-1">
                  <span className="font-mono text-[12px]">{field.fieldName}</span>
                  <span className="flex items-center gap-2 text-ink-faint">
                    {field.displayLabel}
                    {field.sensitive && <Badge tone="brand">🔒</Badge>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AdminPage>
  )
}

export function AdminPage({
  eyebrow,
  title,
  description,
  isLoading,
  error,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  isLoading?: boolean
  error?: unknown
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      <Card>
        {isLoading && <Spinner />}
        {error != null && <ApiErrorPanel error={error} />}
        {!isLoading && error == null && children}
      </Card>
    </>
  )
}
