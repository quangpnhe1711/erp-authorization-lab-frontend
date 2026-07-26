import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, UserPlus, Users } from 'lucide-react'
import { employeeApi } from '@/shared/api/endpoints'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { ActionGate } from '@/shared/permissions/ScreenGuard'
import { ScopeNotice } from '@/shared/permissions/ScopeNotice'
import { Button, Card, PageHeader, SearchInput, SkeletonRows } from '@/shared/ui/primitives'
import { EmptyState, ErrorState } from '@/shared/ui/feedback'
import { EMPLOYEE_COLUMN_ORDER, FieldTable } from '@/shared/ui/FieldTable'

export function EmployeeListPage() {
  const { screen, permission } = useActiveScreen()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const applied = params.get('q') ?? ''
  const [draft, setDraft] = useState(applied)

  useEffect(() => setDraft(applied), [applied])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employees', screen.screenCode, applied],
    queryFn: () => employeeApi.search(screen, { q: applied || undefined, size: 50 }),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const term = draft.trim()
    setParams(term ? { q: term } : {}, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Nhân viên"
        description="Danh bạ nhân sự bạn phụ trách."
        actions={
          <ActionGate action="CREATE">
            <Link to="/hrm/employees/new">
              <Button icon={Plus}>Thêm nhân viên</Button>
            </Link>
          </ActionGate>
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <form onSubmit={submit} className="min-w-0 flex-1 sm:max-w-sm">
            <SearchInput
              icon={Search}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Tìm theo tên hoặc mã nhân viên"
              aria-label="Tìm nhân viên"
              data-testid="employee-search"
            />
          </form>
          {applied && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParams({}, { replace: true })}
              data-testid="clear-search"
            >
              Xoá bộ lọc
            </Button>
          )}
          <span className="ml-auto text-sm text-ink-muted" data-testid="employee-total">
            {data ? `${data.totalElements} nhân viên` : ''}
          </span>
        </div>

        {isLoading && <SkeletonRows rows={6} columns={5} />}
        {error != null && <ErrorState error={error} onRetry={() => refetch()} />}

        {data && (
          <FieldTable
            page={data}
            columnOrder={EMPLOYEE_COLUMN_ORDER}
            testId="employee-table"
            onRowClick={(id) => navigate(`/hrm/employees/${id}`)}
            emptyTitle={applied ? 'Không tìm thấy ai khớp từ khoá' : 'Danh bạ của bạn đang trống'}
            emptyDescription={
              applied
                ? 'Thử một tên hoặc mã nhân viên khác.'
                : 'Khi có nhân viên thuộc phạm vi bạn phụ trách, họ sẽ xuất hiện ở đây.'
            }
            emptyAction={
              applied ? (
                <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                  Xoá bộ lọc
                </Button>
              ) : (
                <ActionGate action="CREATE">
                  <Link to="/hrm/employees/new">
                    <Button icon={UserPlus}>Thêm nhân viên đầu tiên</Button>
                  </Link>
                </ActionGate>
              )
            }
          />
        )}
      </Card>

      {data && data.content.length > 0 && (
        <div className="mt-3">
          <ScopeNotice permission={permission} count={data.totalElements} noun="nhân viên" />
        </div>
      )}
    </>
  )
}

/** Shared by the pages that show a person-shaped list but have nothing to show yet. */
export function NoPeopleState() {
  return <EmptyState icon={Users} title="Chưa có nhân viên nào trong phạm vi của bạn" />
}
