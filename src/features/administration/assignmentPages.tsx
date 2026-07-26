import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/shared/api/endpoints'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { Badge, Button, Label, PageHeader, Select, Spinner, Table, Td, Th } from '@/shared/ui/primitives'
import { Alert, ApiErrorPanel } from '@/shared/ui/feedback'
import { Card } from '@/shared/ui/primitives'
import { formatDateTime } from '@/shared/format'
import { useAdminMetadata } from './hooks'

const RESPONSIBILITY_TYPES = ['HR_PARTNER', 'MANAGER', 'PROJECT_MANAGER']

export function UserRoleAssignmentPage() {
  const { screen } = useActiveScreen()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useAdminMetadata(screen)
  const [userId, setUserId] = useState('')
  const [roleId, setRoleId] = useState('')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-metadata'] })
    queryClient.invalidateQueries({ queryKey: ['navigation'] })
    queryClient.invalidateQueries({ queryKey: ['screen-permission'] })
  }

  const assign = useMutation({
    mutationFn: () => adminApi.assignUserRole(Number(userId), Number(roleId)),
    onSuccess: invalidate,
  })
  const revoke = useMutation({
    mutationFn: (userRoleId: number) => adminApi.revokeUserRole(userRoleId),
    onSuccess: invalidate,
  })

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Gán role cho người dùng"
        description="Quyền của một user là hợp của tất cả role đang hiệu lực (spec §10) — gán thêm role là mở rộng, không thay thế."
      />

      <Card className="mb-6">
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (userId && roleId) assign.mutate()
          }}
        >
          <div className="w-64">
            <Label htmlFor="assign-user">Người dùng</Label>
            <Select id="assign-user" value={userId} onChange={(e) => setUserId(e.target.value)} required>
              <option value="">— Chọn —</option>
              {(data?.users ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-56">
            <Label htmlFor="assign-role">Role</Label>
            <Select id="assign-role" value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
              <option value="">— Chọn —</option>
              {(data?.roles ?? []).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.code}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={assign.isPending} data-testid="assign-role">
            {assign.isPending ? 'Đang gán…' : 'Gán role'}
          </Button>
        </form>
        {assign.error != null && <ApiErrorPanel error={assign.error} className="mt-4" />}
        {revoke.error != null && <ApiErrorPanel error={revoke.error} className="mt-4" />}
        {assign.isSuccess && (
          <Alert tone="success" className="mt-4">
            Đã gán role.
          </Alert>
        )}
      </Card>

      <Card padded={false}>
        {isLoading && (
          <div className="px-6">
            <Spinner />
          </div>
        )}
        {error != null && (
          <div className="p-6">
            <ApiErrorPanel error={error} />
          </div>
        )}
        <Table data-testid="user-role-table">
          <thead>
            <tr>
              <Th>Người dùng</Th>
              <Th>Role đang có</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.users ?? []).map((user) => (
              <tr key={user.id}>
                <Td className="font-mono text-[12px]">{user.username}</Td>
                <Td>
                  <span className="flex flex-wrap gap-2">
                    {user.roles.length === 0 && <span className="text-ink-faint">—</span>}
                    {user.roles.map((role) => (
                      <span key={role.id} className="inline-flex items-center gap-1">
                        <Badge tone="brand">{role.roleCode}</Badge>
                        <button
                          type="button"
                          onClick={() => revoke.mutate(role.id)}
                          className="text-[11px] text-ink-faint hover:text-brand-500"
                          aria-label={`Gỡ ${role.roleCode} khỏi ${user.username}`}
                          data-testid={`revoke-${user.username}-${role.roleCode}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  )
}

export function ResponsibilityAssignmentPage() {
  const { screen } = useActiveScreen()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useAdminMetadata(screen)
  const [userId, setUserId] = useState('')
  const [type, setType] = useState(RESPONSIBILITY_TYPES[0]!)
  const [targetType, setTargetType] = useState('DEPARTMENT')
  const [targetId, setTargetId] = useState('')

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
    onSuccess: invalidate,
  })
  const revoke = useMutation({
    mutationFn: (id: number) => adminApi.revokeResponsibility(id),
    onSuccess: invalidate,
  })

  const targets = (data?.responsibilityTargets ?? []).filter((t) => t.targetType === targetType)

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Gán trách nhiệm"
        description="Nguồn dữ liệu của record scope RESPONSIBILITY: phòng ban / nhóm / dự án mà user được phân công phụ trách."
      />

      <Card className="mb-6">
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (userId && targetId) assign.mutate()
          }}
        >
          <div className="w-60">
            <Label htmlFor="resp-user">Người dùng</Label>
            <Select id="resp-user" value={userId} onChange={(e) => setUserId(e.target.value)} required>
              <option value="">— Chọn —</option>
              {(data?.users ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-52">
            <Label htmlFor="resp-type">Loại trách nhiệm</Label>
            <Select id="resp-type" value={type} onChange={(e) => setType(e.target.value)}>
              {RESPONSIBILITY_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Label htmlFor="resp-target-type">Đối tượng</Label>
            <Select
              id="resp-target-type"
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value)
                setTargetId('')
              }}
            >
              <option value="DEPARTMENT">DEPARTMENT</option>
              <option value="TEAM">TEAM</option>
              <option value="PROJECT">PROJECT</option>
            </Select>
          </div>
          <div className="w-60">
            <Label htmlFor="resp-target">Giá trị</Label>
            <Select id="resp-target" value={targetId} onChange={(e) => setTargetId(e.target.value)} required>
              <option value="">— Chọn —</option>
              {targets.map((target) => (
                <option key={`${target.targetType}-${target.id}`} value={target.id}>
                  {target.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={assign.isPending} data-testid="assign-responsibility">
            {assign.isPending ? 'Đang gán…' : 'Gán trách nhiệm'}
          </Button>
        </form>
        {assign.error != null && <ApiErrorPanel error={assign.error} className="mt-4" />}
        {revoke.error != null && <ApiErrorPanel error={revoke.error} className="mt-4" />}
        {assign.isSuccess && (
          <Alert tone="success" className="mt-4">
            Đã gán trách nhiệm — record scope RESPONSIBILITY của user đó thay đổi ngay.
          </Alert>
        )}
      </Card>

      <Card padded={false}>
        {isLoading && (
          <div className="px-6">
            <Spinner />
          </div>
        )}
        {error != null && (
          <div className="p-6">
            <ApiErrorPanel error={error} />
          </div>
        )}
        <Table data-testid="responsibility-table">
          <thead>
            <tr>
              <Th>Người dùng</Th>
              <Th>Loại</Th>
              <Th>Đối tượng</Th>
              <Th>Hiệu lực từ</Th>
              <Th className="w-24">&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.responsibilities ?? []).map((row) => (
              <tr key={row.id}>
                <Td className="font-mono text-[12px]">{row.username}</Td>
                <Td>
                  <Badge>{row.responsibilityType}</Badge>
                </Td>
                <Td>
                  {row.targetType} · {row.targetName ?? row.targetId}
                </Td>
                <Td className="text-[12px] text-ink-faint">{formatDateTime(row.validFrom)}</Td>
                <Td>
                  <Button
                    size="sm"
                    variant="danger"
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
      </Card>
    </>
  )
}
