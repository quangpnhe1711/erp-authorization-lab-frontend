import { useQuery } from '@tanstack/react-query'
import { employeeApi } from '@/shared/api/endpoints'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { Card, PageHeader, Spinner } from '@/shared/ui/primitives'
import { ApiErrorPanel } from '@/shared/ui/feedback'
import { EMPLOYEE_COLUMN_ORDER, FieldTable } from '@/shared/ui/FieldTable'
import { ScopeSummary } from '@/features/employees/ScopeSummary'

export function SalaryListPage() {
  const { permission } = useActiveScreen()
  const { data, isLoading, error } = useQuery({
    queryKey: ['salaries'],
    queryFn: () => employeeApi.salaries({ size: 50 }),
  })

  return (
    <>
      <PageHeader
        eyebrow="HRM · Salary"
        title="Danh sách lương"
        description="Cùng bảng employees nhưng đi qua use-case SALARY_SEARCH trên màn hình SALARY_LIST — field group SALARY_INFORMATION mới được mở."
      />

      <ScopeSummary permission={permission} rowCount={data?.totalElements} />

      <Card className="mt-6">
        {isLoading && <Spinner />}
        {error != null && <ApiErrorPanel error={error} />}
        {data && <FieldTable page={data} columnOrder={EMPLOYEE_COLUMN_ORDER} testId="salary-table" />}
      </Card>
    </>
  )
}
