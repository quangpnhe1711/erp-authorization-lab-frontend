import { useMemo, useState } from 'react'
import {
  Copy,
  EyeOff,
  Layers,
  ListTree,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Tags,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge, Card, CardHeader, PageHeader, SkeletonCard, Table, Tabs, Td, Th } from '@/shared/ui/primitives'
import { ErrorState } from '@/shared/ui/feedback'
import { useLabDashboard } from './hooks'
import type { ValidationIssue } from './types'

/** The state of the configuration at a glance: how big it is, and where it disagrees with itself. */
export function LabDashboardPage() {
  const dashboard = useLabDashboard()
  const [tab, setTab] = useState('errors')

  const errors = useMemo(
    () => (dashboard.data?.issues ?? []).filter((i) => i.severity === 'ERROR'),
    [dashboard.data],
  )
  const warnings = useMemo(
    () => (dashboard.data?.issues ?? []).filter((i) => i.severity === 'WARNING'),
    [dashboard.data],
  )

  if (dashboard.error != null) return <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />

  const stats = dashboard.data

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tổng quan cấu hình phân quyền"
        description="Mô hình hiện tại, các điểm chồng lấn, và những cấu hình đang vi phạm quy tắc."
      />

      {dashboard.isLoading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={ShieldCheck} label="Vai trò" value={stats.roles} />
            <Metric icon={ListTree} label="Module" value={stats.modules} />
            <Metric icon={ListTree} label="Màn hình" value={stats.screens} />
            <Metric icon={Layers} label="Nhóm field" value={stats.fieldGroups} />
            <Metric icon={Tags} label="Field" value={stats.fields} />
            <Metric
              icon={Copy}
              label="Field thuộc nhiều nhóm"
              value={stats.fieldsInMultipleGroups}
              tone={stats.fieldsInMultipleGroups > 0 ? 'caution' : 'neutral'}
              hint="Quyền của các field này là hợp quyền theo từng hành động"
            />
            <Metric
              icon={ShieldAlert}
              label="Cấu hình vi phạm"
              value={stats.violatingConfigurations}
              tone={stats.violatingConfigurations > 0 ? 'brand' : 'positive'}
              hint="Vi phạm quy tắc phạm vi hoặc gắn nhóm/module"
            />
            <Metric
              icon={EyeOff}
              label="Field nhạy cảm chưa có Unmask"
              value={stats.sensitiveFieldsWithoutUnmaskPolicy}
              tone={stats.sensitiveFieldsWithoutUnmaskPolicy > 0 ? 'caution' : 'positive'}
              hint="Đọc được nhưng không vai trò nào xem được giá trị thật"
            />
          </div>

          <Card padded={false}>
            <CardHeader className="m-0 px-5 pt-5" title="Kết quả kiểm tra cấu hình" />
            <div className="px-5">
              <Tabs
                tabs={[
                  { id: 'errors', label: `Vi phạm (${errors.length})` },
                  { id: 'warnings', label: `Cảnh báo (${warnings.length})` },
                ]}
                active={tab}
                onChange={setTab}
              />
            </div>
            <IssueTable issues={tab === 'errors' ? errors : warnings} />
          </Card>

          <Card padded={false}>
            <CardHeader
              className="m-0 px-5 pt-5"
              title="Thay đổi cấu hình gần đây"
              description="Ai đổi gì, ở vai trò và màn hình nào"
              icon={ScrollText}
            />
            <Table>
              <thead>
                <tr>
                  <Th className="w-44">Thời điểm</Th>
                  <Th className="w-52">Người thực hiện</Th>
                  <Th>Sự kiện</Th>
                  <Th className="w-40">Vai trò</Th>
                  <Th className="w-52">Màn hình</Th>
                </tr>
              </thead>
              <tbody>
                {stats.recentChanges.map((event) => (
                  <tr key={event.id}>
                    <Td>{new Date(event.createdAt).toLocaleString()}</Td>
                    <Td>{event.actor ?? '—'}</Td>
                    <Td>
                      <span className="font-medium text-ink">{event.event}</span>
                    </Td>
                    <Td>{event.roleCode ?? '—'}</Td>
                    <Td>{event.screenCode ?? '—'}</Td>
                  </tr>
                ))}
                {stats.recentChanges.length === 0 && (
                  <tr>
                    <Td className="text-sm text-ink-muted">Chưa có thay đổi nào.</Td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
  hint,
}: {
  icon: LucideIcon
  label: string
  value: number
  tone?: 'neutral' | 'brand' | 'caution' | 'positive'
  hint?: string
}) {
  return (
    <Card title={hint}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-label">{label}</p>
          <p className="mt-1 font-display text-metric" data-numeric data-testid={`metric-${label}`}>
            {value}
          </p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-canvas text-ink-muted">
          <Icon size={17} strokeWidth={1.9} aria-hidden />
        </span>
      </div>
      {tone !== 'neutral' && value > 0 && (
        <Badge tone={tone} className="mt-2">
          Cần xem lại
        </Badge>
      )}
    </Card>
  )
}

function IssueTable({ issues }: { issues: ValidationIssue[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th className="w-56">Quy tắc</Th>
          <Th className="w-36">Vai trò</Th>
          <Th className="w-48">Màn hình</Th>
          <Th className="w-52">Nhóm / field</Th>
          <Th>Chi tiết</Th>
        </tr>
      </thead>
      <tbody>
        {issues.map((issue, index) => (
          <tr key={index} data-testid={`issue-${issue.code}`}>
            <Td>
              <span className="font-mono text-xs text-ink-secondary">{issue.code}</span>
            </Td>
            <Td>{issue.roleCode ?? '—'}</Td>
            <Td>{issue.screenCode ?? '—'}</Td>
            <Td>{issue.fieldName ?? issue.groupCode ?? '—'}</Td>
            <Td>{issue.message}</Td>
          </tr>
        ))}
        {issues.length === 0 && (
          <tr>
            <Td className="text-sm text-ink-muted">Không có mục nào.</Td>
          </tr>
        )}
      </tbody>
    </Table>
  )
}
