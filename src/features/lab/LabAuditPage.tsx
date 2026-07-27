import { useState } from 'react'
import { Card, CardHeader, Label, PageHeader, Select, SkeletonRows, Table, Td, Th } from '@/shared/ui/primitives'
import { ErrorNotice } from '@/shared/ui/feedback'
import { useLabAudit, useLabRoles } from './hooks'

/** The configuration trail: who changed which (role, screen, group), and the row before and after. */
export function LabAuditPage() {
  const roles = useLabRoles()
  const [roleCode, setRoleCode] = useState<string>('')
  const audit = useLabAudit(100, roleCode || undefined)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lịch sử thay đổi cấu hình"
        description="Mỗi thay đổi lưu cả trạng thái trước và sau, kèm request id để đối chiếu log."
      />
      {audit.error != null && <ErrorNotice error={audit.error} />}

      <Card padded={false}>
        <CardHeader
          className="m-0 px-5 pt-5"
          title={`${audit.data?.length ?? 0} sự kiện`}
          actions={
            <div className="w-56">
              <Label htmlFor="audit-role">Lọc theo vai trò</Label>
              <Select
                id="audit-role"
                value={roleCode}
                onChange={(event) => setRoleCode(event.target.value)}
                data-testid="audit-role-filter"
              >
                <option value="">Tất cả</option>
                {(roles.data ?? []).map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.code}
                  </option>
                ))}
              </Select>
            </div>
          }
        />
        {audit.isLoading ? (
          <SkeletonRows rows={8} columns={6} />
        ) : (
          <Table data-testid="audit-table">
            <thead>
              <tr>
                <Th className="w-40">Thời điểm</Th>
                <Th className="w-48">Người thực hiện</Th>
                <Th className="w-56">Sự kiện</Th>
                <Th className="w-32">Vai trò</Th>
                <Th className="w-44">Màn hình · nhóm</Th>
                <Th>Trước → sau</Th>
              </tr>
            </thead>
            <tbody>
              {(audit.data ?? []).map((event) => (
                <tr key={event.id} data-testid={`audit-${event.id}`}>
                  <Td>{new Date(event.createdAt).toLocaleString()}</Td>
                  <Td>
                    <span className="block">{event.actor ?? '—'}</span>
                    <span className="block font-mono text-[11px] text-ink-subtle">{event.requestId ?? ''}</span>
                  </Td>
                  <Td>
                    <span className="font-medium text-ink">{event.event}</span>
                  </Td>
                  <Td>{event.roleCode ?? '—'}</Td>
                  <Td>
                    {event.screenCode ?? '—'}
                    {event.fieldGroupCode ? ` · ${event.fieldGroupCode}` : ''}
                  </Td>
                  <Td>
                    {event.before == null && event.after == null ? (
                      <span className="text-ink-subtle">—</span>
                    ) : (
                      <details>
                        <summary className="cursor-pointer text-sm text-brand-600">Xem JSON</summary>
                        <pre className="dev-surface mt-2 max-h-64 overflow-auto rounded-control p-3">
                          {JSON.stringify({ before: event.before, after: event.after }, null, 2)}
                        </pre>
                      </details>
                    )}
                  </Td>
                </tr>
              ))}
              {(audit.data ?? []).length === 0 && (
                <tr>
                  <Td className="text-sm text-ink-muted">Chưa có sự kiện nào.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
