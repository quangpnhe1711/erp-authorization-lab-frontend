import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, Input, PageHeader, Select, Spinner, Table, Td, Th } from '@/shared/ui/primitives'
import { ApiErrorPanel } from '@/shared/ui/feedback'
import { formatDateTime } from '@/shared/format'

export function AuditLogListPage() {
  const [action, setAction] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', applied, page],
    queryFn: () => auditApi.logs({ action: applied || undefined, page, size: 20 }),
  })

  return (
    <>
      <PageHeader
        eyebrow="Audit"
        title="Nhật ký nghiệp vụ"
        description="LOGIN, LOGOUT, EMPLOYEE_UPDATE, ROLE_ASSIGN… Không bao giờ ghi mật khẩu hay token."
      />

      <Card padded={false}>
        <form
          className="flex flex-wrap items-end gap-3 border-b border-line p-4"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(0)
            setApplied(action.trim())
          }}
        >
          <div className="w-64">
            <Input
              placeholder="Lọc theo action (vd: LOGIN)"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              aria-label="Lọc action"
              data-testid="audit-action-filter"
            />
          </div>
          <Button type="submit" variant="secondary">
            Lọc
          </Button>
          <span className="ml-auto">
            <Badge tone="muted">{data?.totalElements ?? 0} bản ghi</Badge>
          </span>
        </form>

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

        <Table data-testid="audit-table">
          <thead>
            <tr>
              <Th className="w-44">Thời điểm</Th>
              <Th>Người dùng</Th>
              <Th>Action</Th>
              <Th>Đối tượng</Th>
              <Th>Chi tiết</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.content ?? []).map((row) => (
              <tr key={row.id}>
                <Td className="whitespace-nowrap text-[12px] text-ink-faint">{formatDateTime(row.createdAt)}</Td>
                <Td className="font-mono text-[12px]">{row.username ?? '—'}</Td>
                <Td>
                  <Badge tone="brand">{row.action}</Badge>
                </Td>
                <Td className="text-[12px]">
                  {row.objectType ?? '—'}
                  {row.objectId ? ` #${row.objectId}` : ''}
                </Td>
                <Td className="max-w-md break-all font-mono text-[11px] text-ink-faint">{row.detail ?? '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Pager page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
      </Card>
    </>
  )
}

export function PermissionDecisionTracePage() {
  const [decision, setDecision] = useState('')
  const [screenCode, setScreenCode] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-decisions', decision, screenCode, page],
    queryFn: () =>
      auditApi.decisions({
        decision: decision || undefined,
        screenCode: screenCode.trim() || undefined,
        page,
        size: 20,
      }),
  })

  return (
    <>
      <PageHeader
        eyebrow="Audit"
        title="Permission decision trace"
        description="Mỗi request qua @PermissionCheck đều ghi một dòng: screen context, use-case, quyết định, scope, field group và lý do từ chối."
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-line p-4">
          <div className="w-40">
            <Select
              value={decision}
              onChange={(e) => {
                setPage(0)
                setDecision(e.target.value)
              }}
              aria-label="Lọc quyết định"
              data-testid="decision-filter"
            >
              <option value="">Tất cả</option>
              <option value="ALLOW">ALLOW</option>
              <option value="DENY">DENY</option>
            </Select>
          </div>
          <div className="w-64">
            <Input
              placeholder="Screen code (vd: EMPLOYEE_LIST)"
              value={screenCode}
              onChange={(e) => {
                setPage(0)
                setScreenCode(e.target.value)
              }}
              aria-label="Lọc screen code"
              data-testid="decision-screen-filter"
            />
          </div>
          <span className="ml-auto">
            <Badge tone="muted">{data?.totalElements ?? 0} quyết định</Badge>
          </span>
        </div>

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

        <Table data-testid="decision-table">
          <thead>
            <tr>
              <Th className="w-40">Thời điểm</Th>
              <Th>Người dùng · roles</Th>
              <Th>Screen context</Th>
              <Th>Use-case</Th>
              <Th className="w-24">Quyết định</Th>
              <Th>Scope / field group</Th>
              <Th className="w-20">ms</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.content ?? []).map((row) => (
              <tr key={row.id} data-testid="decision-row" data-decision={row.decision}>
                <Td className="whitespace-nowrap text-[12px] text-ink-faint">{formatDateTime(row.createdAt)}</Td>
                <Td>
                  <span className="block font-mono text-[12px]">{row.username ?? '—'}</span>
                  <span className="block text-[11px] text-ink-faint">{row.roles ?? '—'}</span>
                </Td>
                <Td className="font-mono text-[11px]">
                  {row.moduleKey}
                  {row.submoduleKey ? ` / ${row.submoduleKey}` : ''}
                  <span className="block text-ink">{row.screenCode}</span>
                </Td>
                <Td className="font-mono text-[11px]">
                  {row.apiCode}
                  <span className="block text-ink-faint">
                    {row.resource} · {row.action}
                  </span>
                </Td>
                <Td>
                  <Badge tone={row.decision === 'ALLOW' ? 'success' : 'brand'}>{row.decision}</Badge>
                  {row.reason && <span className="mt-1 block text-[10px] text-brand-600">{row.reason}</span>}
                </Td>
                <Td className="font-mono text-[11px] text-ink-faint">
                  <span className="block">{row.recordScopes || '—'}</span>
                  <span className="block">{row.fieldGroups || '—'}</span>
                </Td>
                <Td className="text-[12px] text-ink-faint">{row.durationMs ?? '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Pager page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
      </Card>
    </>
  )
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line p-4 text-[12px] text-ink-faint">
      <span>
        Trang {page + 1} / {totalPages}
      </span>
      <span className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => onChange(page - 1)}>
          Trước
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page + 1 >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Sau
        </Button>
      </span>
    </div>
  )
}
