import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { ScreenGuard } from '@/shared/permissions/ScreenGuard'
import { SCREENS, FIELD_GROUP_LABELS, type ScreenKey } from '@/shared/permissions/screens'
import { MODULE_LABELS, SCREEN_LABELS } from '@/shared/navigation/businessNav'
import { Badge, Card, PageHeader, SkeletonRows, Table, Tabs, Td, Th } from '@/shared/ui/primitives'
import { ErrorState } from '@/shared/ui/feedback'
import { useAdminMetadata } from './hooks'
import { RolePermissionEditor } from './RolePermissionEditor'

/* ------------------------------------------------------- role permissions */

const ACCESS_TABS: { id: string; label: string; screen: ScreenKey; description: string }[] = [
  {
    id: 'access',
    label: 'Được vào đâu',
    screen: 'SCREEN_PERMISSION_CONFIG',
    description: 'Chọn khu vực vai trò này mở được và thao tác được phép làm ở đó.',
  },
  {
    id: 'scope',
    label: 'Thấy dữ liệu của ai',
    screen: 'RECORD_SCOPE_CONFIG',
    description: 'Chọn nhiều mục là cộng dồn: nhóm của mình cộng các bộ phận được phân công.',
  },
  {
    id: 'fields',
    label: 'Thông tin xem được',
    screen: 'FIELD_GROUP_PERMISSION_CONFIG',
    description: 'Thông tin không được cấp quyền xem sẽ không xuất hiện trên màn hình lẫn trong dữ liệu trả về.',
  },
]

/**
 * Three questions about a role, on one page: where can it go, whose records does it see, and which
 * information can it read or change. They used to be three separate configuration screens named
 * after database tables.
 */
export function AccessControlPage() {
  const [tab, setTab] = useState(ACCESS_TABS[0]!.id)
  const active = ACCESS_TABS.find((item) => item.id === tab) ?? ACCESS_TABS[0]!

  return (
    <>
      <PageHeader
        title="Quyền theo vai trò"
        description="Mọi thay đổi ở đây có hiệu lực ngay với người đang giữ vai trò đó."
      />
      <Tabs tabs={ACCESS_TABS} active={tab} onChange={setTab} className="mb-5" />
      <ScreenGuard key={active.screen} screen={SCREENS[active.screen]}>
        <RolePermissionEditor
          mode={active.id === 'access' ? 'access' : active.id === 'scope' ? 'scope' : 'fieldGroups'}
          description={active.description}
        />
      </ScreenGuard>
    </>
  )
}

/* ---------------------------------------------------------------- catalogue */

const CATALOG_TABS: { id: string; label: string; screen: ScreenKey }[] = [
  { id: 'roles', label: 'Vai trò', screen: 'ROLE_MANAGEMENT' },
  { id: 'modules', label: 'Phân hệ', screen: 'MODULE_MANAGEMENT' },
  { id: 'screens', label: 'Màn hình', screen: 'SCREEN_MANAGEMENT' },
  { id: 'fields', label: 'Nhóm thông tin', screen: 'FIELD_GROUP_CONFIG' },
]

/** Reference data an administrator consults but rarely edits — grouped instead of scattered. */
export function CatalogPage() {
  const [tab, setTab] = useState(CATALOG_TABS[0]!.id)
  const active = CATALOG_TABS.find((item) => item.id === tab) ?? CATALOG_TABS[0]!

  return (
    <>
      <PageHeader
        title="Danh mục hệ thống"
        description="Cấu trúc phân hệ, màn hình, vai trò và nhóm thông tin của workspace."
      />
      <Tabs tabs={CATALOG_TABS} active={tab} onChange={setTab} className="mb-5" />
      <ScreenGuard key={active.screen} screen={SCREENS[active.screen]}>
        {active.id === 'roles' && <RoleCatalog />}
        {active.id === 'modules' && <ModuleCatalog />}
        {active.id === 'screens' && <ScreenCatalog />}
        {active.id === 'fields' && <FieldGroupCatalog />}
      </ScreenGuard>
    </>
  )
}

function useCatalog() {
  const { screen } = useActiveScreen()
  return useAdminMetadata(screen)
}

function RoleCatalog() {
  const { data, isLoading, error, refetch } = useCatalog()
  return (
    <Card padded={false}>
      {isLoading && <SkeletonRows rows={5} columns={4} />}
      {error != null && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && (
        <Table data-testid="role-table">
          <thead>
            <tr>
              <Th>Vai trò</Th>
              <Th>Mô tả</Th>
              <Th className="w-32">Loại</Th>
              <Th className="w-28">Số người</Th>
            </tr>
          </thead>
          <tbody>
            {data.roles.map((role) => (
              <tr key={role.id} className="hover:bg-surface-muted">
                <Td>
                  <span className="font-medium text-ink">{role.name}</span>
                  {role.system && (
                    <Badge tone="neutral" className="ml-2">
                      Hệ thống
                    </Badge>
                  )}
                </Td>
                <Td className="text-sm text-ink-muted">{role.description ?? '—'}</Td>
                <Td>
                  <Badge tone={role.kind === 'pos' ? 'info' : 'neutral'}>
                    {role.kind === 'pos' ? 'Theo vị trí' : 'Theo chức năng'}
                  </Badge>
                </Td>
                <Td data-numeric>{role.userCount}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  )
}

function ModuleCatalog() {
  const { data, isLoading, error, refetch } = useCatalog()
  return (
    <Card padded={false}>
      {isLoading && <SkeletonRows rows={5} columns={3} />}
      {error != null && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && (
        <Table data-testid="module-table">
          <thead>
            <tr>
              <Th>Phân hệ</Th>
              <Th>Nhóm chức năng</Th>
              <Th className="w-28">Trạng thái</Th>
            </tr>
          </thead>
          <tbody>
            {data.modules.map((module) => (
              <tr key={module.id} className="hover:bg-surface-muted">
                <Td className="font-medium text-ink">{MODULE_LABELS[module.moduleKey] ?? module.name}</Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {data.submodules
                      .filter((sub) => sub.moduleKey === module.moduleKey)
                      .map((sub) => (
                        <Badge key={sub.id}>{sub.name}</Badge>
                      ))}
                    {data.submodules.every((sub) => sub.moduleKey !== module.moduleKey) && (
                      <span className="text-ink-subtle">—</span>
                    )}
                  </span>
                </Td>
                <Td>
                  <Badge tone={module.active ? 'positive' : 'caution'}>
                    {module.active ? 'Đang dùng' : 'Đã tắt'}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  )
}

function ScreenCatalog() {
  const { data, isLoading, error, refetch } = useCatalog()
  return (
    <Card padded={false}>
      {isLoading && <SkeletonRows rows={6} columns={3} />}
      {error != null && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && (
        <Table data-testid="screen-table">
          <thead>
            <tr>
              <Th>Màn hình</Th>
              <Th className="w-40">Phân hệ</Th>
              <Th className="w-28">Trạng thái</Th>
            </tr>
          </thead>
          <tbody>
            {data.screens.map((row) => (
              <tr key={row.id} className="hover:bg-surface-muted">
                <Td>
                  <span className="font-medium text-ink">{SCREEN_LABELS[row.screenCode] ?? row.name}</span>
                  <span className="ml-2 font-mono text-xs text-ink-subtle">{row.screenCode}</span>
                </Td>
                <Td>{MODULE_LABELS[row.moduleKey] ?? row.moduleKey}</Td>
                <Td>
                  <Badge tone={row.active ? 'positive' : 'caution'}>{row.active ? 'Đang dùng' : 'Đã tắt'}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  )
}

function FieldGroupCatalog() {
  const { data, isLoading, error, refetch } = useCatalog()
  return (
    <>
      {isLoading && (
        <Card padded={false}>
          <SkeletonRows rows={4} columns={3} />
        </Card>
      )}
      {error != null && (
        <Card padded={false}>
          <ErrorState error={error} onRetry={() => refetch()} />
        </Card>
      )}
      {data && (
        <div className="grid gap-4 md:grid-cols-2" data-testid="field-group-list">
          {data.fieldGroups.map((group) => (
            <Card key={group.id}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-md font-semibold">{FIELD_GROUP_LABELS[group.code] ?? group.name}</h3>
                  <p className="mt-0.5 text-sm text-ink-muted">{group.description ?? '—'}</p>
                </div>
                {group.fields.some((field) => field.sensitive) && (
                  <Badge tone="brand">
                    <Lock size={11} strokeWidth={2.2} aria-hidden />
                    Nhạy cảm
                  </Badge>
                )}
              </div>
              <ul className="divide-y divide-line text-sm">
                {group.fields.map((field) => (
                  <li key={field.id} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="text-ink-secondary">{field.displayLabel}</span>
                    <span className="font-mono text-xs text-ink-subtle">{field.fieldName}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
