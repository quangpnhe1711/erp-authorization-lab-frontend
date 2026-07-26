import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { employeeApi } from '@/shared/api/endpoints'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { ActionGate } from '@/shared/permissions/ScreenGuard'
import { Badge, Button, Card, Input, PageHeader, Spinner } from '@/shared/ui/primitives'
import { ApiErrorPanel } from '@/shared/ui/feedback'
import { EMPLOYEE_COLUMN_ORDER, FieldTable } from '@/shared/ui/FieldTable'
import { ScopeSummary } from './ScopeSummary'

export function EmployeeListPage() {
  const { screen, permission } = useActiveScreen()
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', screen.screenCode, query],
    queryFn: () => employeeApi.search(screen, { q: query || undefined, size: 50 }),
  })

  return (
    <>
      <PageHeader
        eyebrow="HRM · Employee"
        title="Danh sách nhân viên"
        description="Số dòng phụ thuộc record scope, số cột phụ thuộc field group — cả hai gắn với màn hình EMPLOYEE_LIST, không gắn với endpoint."
        actions={
          <ActionGate action="CREATE">
            <Link to="/hrm/employees/new">
              <Button size="sm">Thêm nhân viên</Button>
            </Link>
          </ActionGate>
        }
      />

      <ScopeSummary permission={permission} rowCount={data?.totalElements} />

      <Card className="mt-6">
        <form
          className="mb-5 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            setQuery(search.trim())
          }}
        >
          <div className="w-full max-w-xs">
            <Input
              placeholder="Tìm theo tên hoặc mã nhân viên"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm nhân viên"
              data-testid="employee-search"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Tìm
          </Button>
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                setSearch('')
                setQuery('')
              }}
            >
              Xoá lọc
            </Button>
          )}
          <span className="ml-auto">
            <Badge tone="muted" data-testid="employee-total">
              {data?.totalElements ?? 0} bản ghi
            </Badge>
          </span>
        </form>

        {isLoading && <Spinner />}
        {error != null && <ApiErrorPanel error={error} />}
        {data && (
          <FieldTable
            page={data}
            columnOrder={EMPLOYEE_COLUMN_ORDER}
            testId="employee-table"
            emptyHint="Record scope của bạn trên màn hình này không bao gồm bản ghi nào."
            rowHref={(id) => (
              <Link
                to={`/hrm/employees/${id}`}
                className="font-display text-[10px] font-semibold uppercase tracking-label text-brand-500 hover:underline"
              >
                Chi tiết
              </Link>
            )}
          />
        )}
      </Card>
    </>
  )
}
