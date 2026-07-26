import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollText } from 'lucide-react'
import { auditApi } from '@/shared/api/endpoints'
import { useDeveloperMode } from '@/shared/devmode/DeveloperModeProvider'
import { SCREEN_LABELS } from '@/shared/navigation/businessNav'
import { ACTIVITY_FILTERS, describeActivity, relativeTime } from '@/shared/activity'
import { Avatar, Badge, Button, Card, PageHeader, Select, SkeletonRows, Table, Tabs, Td, Th } from '@/shared/ui/primitives'
import { EmptyState, ErrorState } from '@/shared/ui/feedback'
import { formatDateTime } from '@/shared/format'

/**
 * "Who did what, when" — the business half of the audit trail. The permission-decision log lives
 * behind developer mode, because it answers an engineering question, not an operational one.
 */
export function ActivityPage() {
  const { developerMode: showTrace } = useDeveloperMode()
  const [tab, setTab] = useState('activity')

  // Turning developer mode off while the trace tab is open must not leave the page on a dead tab.
  useEffect(() => {
    if (!showTrace) setTab('activity')
  }, [showTrace])

  return (
    <>
      <PageHeader title="Hoạt động" description="Nhật ký thao tác trong workspace." />

      {showTrace && (
        <Tabs
          tabs={[
            { id: 'activity', label: 'Hoạt động' },
            { id: 'trace', label: 'Kiểm tra quyền' },
          ]}
          active={tab}
          onChange={setTab}
          className="mb-5"
        />
      )}

      {tab === 'activity' ? <ActivityFeed /> : <DecisionTrace />}
    </>
  )
}

function ActivityFeed() {
  const [action, setAction] = useState('')
  const [page, setPage] = useState(0)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activity', action, page],
    queryFn: () => auditApi.logs({ action: action || undefined, page, size: 20 }),
  })

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <Select
          value={action}
          onChange={(event) => {
            setPage(0)
            setAction(event.target.value)
          }}
          aria-label="Lọc theo loại hoạt động"
          data-testid="activity-filter"
          className="h-9 w-56"
        >
          {ACTIVITY_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </Select>
        <span className="ml-auto text-sm text-ink-muted">{data ? `${data.totalElements} hoạt động` : ''}</span>
      </div>

      {isLoading && <SkeletonRows rows={6} columns={3} />}
      {error != null && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && data.content.length === 0 && (
        <EmptyState icon={ScrollText} title="Chưa có hoạt động nào" description="Thử bỏ bộ lọc để xem toàn bộ." />
      )}

      {data && data.content.length > 0 && (
        <ul data-testid="activity-list">
          {data.content.map((row) => (
            <li key={row.id} className="flex items-start gap-3 border-b border-line px-5 py-3.5 last:border-b-0">
              <Avatar name={row.username ?? 'Hệ thống'} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-base text-ink-secondary">{describeActivity(row)}</p>
                <p className="mt-0.5 text-sm text-ink-subtle">
                  {relativeTime(row.createdAt)} · {formatDateTime(row.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pager page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </Card>
  )
}

/**
 * Developer-mode only: the raw permission decision log, in its own vocabulary. It carries its own
 * screen context on every request, so it needs no extra route guard around it.
 */
function DecisionTrace() {
  const [decision, setDecision] = useState('')
  const [page, setPage] = useState(0)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['decisions', decision, page],
    queryFn: () => auditApi.decisions({ decision: decision || undefined, page, size: 20 }),
  })

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <Select
          value={decision}
          onChange={(event) => {
            setPage(0)
            setDecision(event.target.value)
          }}
          aria-label="Lọc theo kết quả"
          data-testid="decision-filter"
          className="h-9 w-44"
        >
          <option value="">Tất cả</option>
          <option value="ALLOW">Cho phép</option>
          <option value="DENY">Từ chối</option>
        </Select>
        <span className="ml-auto text-sm text-ink-muted">{data ? `${data.totalElements} lượt kiểm tra` : ''}</span>
      </div>

      {isLoading && <SkeletonRows rows={6} columns={5} />}
      {error != null && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && (
        <Table data-testid="decision-table">
          <thead>
            <tr>
              <Th className="w-40">Thời điểm</Th>
              <Th>Người dùng</Th>
              <Th>Khu vực</Th>
              <Th className="w-28">Kết quả</Th>
              <Th>Chi tiết kỹ thuật</Th>
            </tr>
          </thead>
          <tbody>
            {data.content.map((row) => (
              <tr key={row.id} data-testid="decision-row" data-decision={row.decision}>
                <Td className="whitespace-nowrap text-sm text-ink-muted">{formatDateTime(row.createdAt)}</Td>
                <Td className="text-sm">{row.username ?? '—'}</Td>
                <Td className="text-sm">
                  {SCREEN_LABELS[row.screenCode ?? ''] ?? row.screenCode}
                  <span className="ml-1.5 font-mono text-xs text-ink-subtle">{row.screenCode}</span>
                </Td>
                <Td>
                  <Badge tone={row.decision === 'ALLOW' ? 'positive' : 'brand'}>
                    {row.decision === 'ALLOW' ? 'Cho phép' : 'Từ chối'}
                  </Badge>
                </Td>
                <Td className="font-mono text-xs text-ink-subtle">
                  <span className="block">
                    {row.apiCode} · {row.action}
                    {row.reason ? ` · ${row.reason}` : ''}
                  </span>
                  <span className="block">{row.recordScopes || '—'}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Pager page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </Card>
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
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-sm text-ink-muted">
      <span>
        Trang {page + 1} / {totalPages}
      </span>
      <span className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => onChange(page - 1)}>
          Trước
        </Button>
        <Button size="sm" variant="secondary" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
          Sau
        </Button>
      </span>
    </div>
  )
}
