import { useQuery } from '@tanstack/react-query'
import { Wallet } from 'lucide-react'
import { employeeApi } from '@/shared/api/endpoints'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { ScopeNotice } from '@/shared/permissions/ScopeNotice'
import { Card, PageHeader, SkeletonRows } from '@/shared/ui/primitives'
import { ErrorState } from '@/shared/ui/feedback'
import { EMPLOYEE_COLUMN_ORDER, FieldTable } from '@/shared/ui/FieldTable'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export function SalaryListPage() {
  const { permission } = useActiveScreen()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['salaries'],
    queryFn: () => employeeApi.salaries({ size: 100 }),
  })

  const total = (data?.content ?? []).reduce(
    (sum, row) => sum + (typeof row.fields.salary === 'number' ? row.fields.salary : 0),
    0,
  )

  return (
    <>
      <PageHeader title="Lương" description="Bảng lương của những người bạn phụ trách." />

      {data && data.content.length > 0 && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-control bg-canvas text-ink-muted">
              <Wallet size={18} strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <p className="text-sm text-ink-muted">Tổng quỹ lương kỳ này</p>
              <p className="text-xl font-semibold" data-numeric data-testid="payroll-total">
                {currency.format(total)}
              </p>
            </div>
          </div>
          <p className="text-sm text-ink-muted">{data.totalElements} bảng lương</p>
        </Card>
      )}

      <Card padded={false}>
        {isLoading && <SkeletonRows rows={6} columns={5} />}
        {error != null && <ErrorState error={error} onRetry={() => refetch()} />}
        {data && (
          <FieldTable
            page={data}
            columnOrder={EMPLOYEE_COLUMN_ORDER}
            testId="salary-table"
            emptyTitle="Chưa có bảng lương nào"
            emptyDescription="Bảng lương sẽ xuất hiện khi bạn phụ trách nhân sự có dữ liệu lương."
          />
        )}
      </Card>

      {data && data.content.length > 0 && (
        <div className="mt-3">
          <ScopeNotice permission={permission} count={data.totalElements} noun="bảng lương" />
        </div>
      )}
    </>
  )
}
