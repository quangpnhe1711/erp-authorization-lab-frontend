import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/shared/api/endpoints'
import type { AdminMetadata } from '@/shared/api/types'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Label,
  PageHeader,
  Select,
  SkeletonRows,
  Table,
  Td,
  Th,
} from '@/shared/ui/primitives'
import { EmptyState, ErrorState, Modal, Toast } from '@/shared/ui/feedback'
import { formatDateTime } from '@/shared/format'
import { useAdminMetadata } from './hooks'

/** Roles are configuration, but an administrator reads them as job descriptions. */
function roleName(metadata: AdminMetadata | undefined, code: string): string {
  return metadata?.roles.find((role) => role.code === code)?.name ?? code
}

export function UsersPage() {
  const { screen } = useActiveScreen()
  const { data, isLoading, error, refetch } = useAdminMetadata(screen)

  return (
    <>
      <PageHeader title="Người dùng" description="Tài khoản đăng nhập và vai trò họ đang giữ." />
      <Card padded={false}>
        {isLoading && <SkeletonRows rows={5} columns={4} />}
        {error != null && <ErrorState error={error} onRetry={() => refetch()} />}
        {data && (
          <Table data-testid="user-table">
            <thead>
              <tr>
                <Th>Người dùng</Th>
                <Th>Nhân viên</Th>
                <Th>Vai trò</Th>
                <Th className="w-28">Trạng thái</Th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-muted">
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={user.employeeName ?? user.username} size="sm" />
                      <span className="font-medium text-ink">{user.username}</span>
                    </span>
                  </Td>
                  <Td>{user.employeeName ?? '—'}</Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {user.roles.length === 0 && <span className="text-ink-subtle">Chưa gán</span>}
                      {user.roles.map((role) => (
                        <Badge key={role.id}>{roleName(data, role.roleCode)}</Badge>
                      ))}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={user.active ? 'positive' : 'caution'}>
                      {user.active ? 'Đang hoạt động' : 'Đã khoá'}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}

export function RoleAssignmentPage() {
  const { screen } = useActiveScreen()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useAdminMetadata(screen)
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-metadata'] })
    queryClient.invalidateQueries({ queryKey: ['navigation'] })
    queryClient.invalidateQueries({ queryKey: ['screen-permission'] })
  }

  const assign = useMutation({
    mutationFn: () => adminApi.assignUserRole(Number(userId), Number(roleId)),
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setToast('Đã gán vai trò')
    },
  })

  const revoke = useMutation({
    mutationFn: (id: number) => adminApi.revokeUserRole(id),
    onSuccess: () => {
      invalidate()
      setToast('Đã gỡ vai trò')
    },
  })

  return (
    <>
      <PageHeader
        title="Phân vai trò"
        description="Vai trò quyết định một người vào được đâu và làm được gì. Một người có thể giữ nhiều vai trò."
        actions={
          <Button icon={Plus} onClick={() => setOpen(true)} data-testid="open-assign-role">
            Gán vai trò
          </Button>
        }
      />

      <Card padded={false}>
        {isLoading && <SkeletonRows rows={5} columns={2} />}
        {error != null && <ErrorState error={error} onRetry={() => refetch()} />}
        {revoke.error != null && (
          <div className="p-5">
            <ErrorState error={revoke.error} />
          </div>
        )}
        {data && (
          <Table data-testid="user-role-table">
            <thead>
              <tr>
                <Th>Người dùng</Th>
                <Th>Vai trò đang giữ</Th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={user.employeeName ?? user.username} size="sm" />
                      <span>
                        <span className="block font-medium text-ink">{user.employeeName ?? user.username}</span>
                        <span className="block text-sm text-ink-subtle">{user.username}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {user.roles.length === 0 && <span className="text-ink-subtle">Chưa gán vai trò nào</span>}
                      {user.roles.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface-muted py-0.5 pl-2.5 pr-1 text-xs"
                        >
                          {roleName(data, role.roleCode)}
                          <button
                            type="button"
                            onClick={() => revoke.mutate(role.id)}
                            aria-label={`Gỡ vai trò ${roleName(data, role.roleCode)} của ${user.username}`}
                            data-testid={`revoke-${user.username}-${role.roleCode}`}
                            className="grid h-5 w-5 place-items-center rounded-full text-ink-subtle hover:bg-brand-50 hover:text-brand-600"
                          >
                            <Trash2 size={12} strokeWidth={2} aria-hidden />
                          </button>
                        </span>
                      ))}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        title="Gán vai trò"
        description="Người dùng sẽ nhận thêm quyền của vai trò này ngay lập tức."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => assign.mutate()}
              disabled={!userId || !roleId || assign.isPending}
              data-testid="assign-role"
            >
              {assign.isPending ? 'Đang gán…' : 'Gán vai trò'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="assign-user">Người dùng</Label>
            <Select id="assign-user" value={userId} onChange={(event) => setUserId(event.target.value)}>
              <option value="">Chọn người dùng</option>
              {(data?.users ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.employeeName ? `${user.employeeName} — ${user.username}` : user.username}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="assign-role-select">Vai trò</Label>
            <Select id="assign-role-select" value={roleId} onChange={(event) => setRoleId(event.target.value)}>
              <option value="">Chọn vai trò</option>
              {(data?.roles ?? []).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </div>
          {assign.error != null && <ErrorState error={assign.error} />}
        </div>
      </Modal>

      <Toast open={toast != null} message={toast ?? ''} onClose={() => setToast(null)} />
    </>
  )
}

const RESPONSIBILITY_TYPES = [
  { value: 'HR_PARTNER', label: 'Phụ trách nhân sự' },
  { value: 'MANAGER', label: 'Quản lý trực tiếp' },
  { value: 'PROJECT_MANAGER', label: 'Quản lý dự án' },
]

const TARGET_TYPES = [
  { value: 'DEPARTMENT', label: 'Phòng ban' },
  { value: 'TEAM', label: 'Nhóm' },
  { value: 'PROJECT', label: 'Dự án' },
]

const labelOf = (list: { value: string; label: string }[], value: string) =>
  list.find((item) => item.value === value)?.label ?? value

export function ResponsibilityPage() {
  const { screen } = useActiveScreen()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useAdminMetadata(screen)
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [type, setType] = useState(RESPONSIBILITY_TYPES[0]!.value)
  const [targetType, setTargetType] = useState('DEPARTMENT')
  const [targetId, setTargetId] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-metadata'] })
    queryClient.invalidateQueries({ queryKey: ['employees'] })
    queryClient.invalidateQueries({ queryKey: ['projects'] })
  }

  const assign = useMutation({
    mutationFn: () =>
      adminApi.assignResponsibility({
        userId: Number(userId),
        responsibilityType: type,
        targetType,
        targetId: Number(targetId),
      }),
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setToast('Đã phân công phụ trách')
    },
  })

  const revoke = useMutation({
    mutationFn: (id: number) => adminApi.revokeResponsibility(id),
    onSuccess: () => {
      invalidate()
      setToast('Đã gỡ phân công')
    },
  })

  const targets = useMemo(
    () => (data?.responsibilityTargets ?? []).filter((target) => target.targetType === targetType),
    [data, targetType],
  )

  return (
    <>
      <PageHeader
        title="Phân công phụ trách"
        description="Người phụ trách một phòng ban, nhóm hoặc dự án sẽ nhìn thấy dữ liệu của nơi đó."
        actions={
          <Button icon={Plus} onClick={() => setOpen(true)} data-testid="open-assign-responsibility">
            Phân công
          </Button>
        }
      />

      <Card padded={false}>
        {isLoading && <SkeletonRows rows={4} columns={4} />}
        {error != null && <ErrorState error={error} onRetry={() => refetch()} />}
        {data && data.responsibilities.length === 0 && (
          <EmptyState
            icon={KeyRound}
            title="Chưa có phân công nào"
            description="Phân công phụ trách để người quản lý nhìn thấy dữ liệu của bộ phận mình."
            action={<Button icon={Plus} onClick={() => setOpen(true)}>Phân công</Button>}
          />
        )}
        {data && data.responsibilities.length > 0 && (
          <Table data-testid="responsibility-table">
            <thead>
              <tr>
                <Th>Người phụ trách</Th>
                <Th>Vai trò</Th>
                <Th>Phụ trách</Th>
                <Th>Hiệu lực từ</Th>
                <Th className="w-20">&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {data.responsibilities.map((row) => (
                <tr key={row.id} className="hover:bg-surface-muted">
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={row.username} size="sm" />
                      <span className="font-medium text-ink">{row.username}</span>
                    </span>
                  </Td>
                  <Td>
                    <Badge>{labelOf(RESPONSIBILITY_TYPES, row.responsibilityType)}</Badge>
                  </Td>
                  <Td>
                    <span className="text-ink">{row.targetName ?? '—'}</span>
                    <span className="ml-1.5 text-sm text-ink-subtle">
                      ({labelOf(TARGET_TYPES, row.targetType).toLowerCase()})
                    </span>
                  </Td>
                  <Td className="text-sm text-ink-muted">{formatDateTime(row.validFrom)}</Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      onClick={() => revoke.mutate(row.id)}
                      data-testid={`revoke-responsibility-${row.id}`}
                    >
                      Gỡ
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        title="Phân công phụ trách"
        description="Người được phân công sẽ thấy dữ liệu của bộ phận đó ngay ở lần truy cập kế tiếp."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => assign.mutate()}
              disabled={!userId || !targetId || assign.isPending}
              data-testid="assign-responsibility"
            >
              {assign.isPending ? 'Đang lưu…' : 'Phân công'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="resp-user">Người phụ trách</Label>
            <Select id="resp-user" value={userId} onChange={(event) => setUserId(event.target.value)}>
              <option value="">Chọn người dùng</option>
              {(data?.users ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.employeeName ? `${user.employeeName} — ${user.username}` : user.username}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="resp-type">Vai trò phụ trách</Label>
              <Select id="resp-type" value={type} onChange={(event) => setType(event.target.value)}>
                {RESPONSIBILITY_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="resp-target-type">Loại đối tượng</Label>
              <Select
                id="resp-target-type"
                value={targetType}
                onChange={(event) => {
                  setTargetType(event.target.value)
                  setTargetId('')
                }}
              >
                {TARGET_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="resp-target">Đối tượng</Label>
            <Select id="resp-target" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
              <option value="">Chọn {labelOf(TARGET_TYPES, targetType).toLowerCase()}</option>
              {targets.map((target) => (
                <option key={`${target.targetType}-${target.id}`} value={target.id}>
                  {target.name}
                </option>
              ))}
            </Select>
          </div>
          {assign.error != null && <ErrorState error={assign.error} />}
        </div>
      </Modal>

      <Toast open={toast != null} message={toast ?? ''} onClose={() => setToast(null)} />
    </>
  )
}

