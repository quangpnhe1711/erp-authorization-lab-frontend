import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectApi, employeeApi } from '@/shared/api/endpoints'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { ActionGate } from '@/shared/permissions/ScreenGuard'
import { Badge, Button, Card, CardHeader, PageHeader, Select, Spinner } from '@/shared/ui/primitives'
import { Alert, ApiErrorPanel } from '@/shared/ui/feedback'
import { EMPLOYEE_COLUMN_ORDER, FieldTable, PROJECT_COLUMN_ORDER } from '@/shared/ui/FieldTable'
import { FieldSections } from '@/features/employees/FieldSections'
import { ScopeSummary } from '@/features/employees/ScopeSummary'

export function ProjectListPage() {
  const { screen, permission } = useActiveScreen()
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', screen.screenCode],
    queryFn: () => projectApi.search(screen, { size: 50 }),
  })

  return (
    <>
      <PageHeader
        eyebrow="Project"
        title="Danh sách dự án"
        description="RESPONSIBILITY chỉ thấy dự án mình phụ trách; ALL thấy toàn bộ. Cùng một endpoint."
      />
      <ScopeSummary permission={permission} rowCount={data?.totalElements} />
      <Card className="mt-6">
        {isLoading && <Spinner />}
        {error != null && <ApiErrorPanel error={error} />}
        {data && (
          <FieldTable
            page={data}
            columnOrder={PROJECT_COLUMN_ORDER}
            testId="project-table"
            rowHref={(id) => (
              <Link
                to={`/projects/${id}`}
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

export function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const { screen, permission } = useActiveScreen()
  const { data, isLoading, error } = useQuery({
    queryKey: ['project', screen.screenCode, projectId],
    queryFn: () => projectApi.detail(screen, projectId),
  })

  return (
    <>
      <PageHeader
        eyebrow="Project"
        title="Chi tiết dự án"
        actions={
          <Link to={`/projects/${projectId}/members`}>
            <Button size="sm" variant="secondary">
              Thành viên dự án
            </Button>
          </Link>
        }
      />
      <ScopeSummary permission={permission} />
      {isLoading && <Spinner />}
      {error != null && <ApiErrorPanel error={error} className="mt-6" />}
      {data && (
        <Card className="mt-6">
          <CardHeader eyebrow="Dự án" title={String(data.fields.projectName ?? `#${data.id}`)} />
          <FieldSections fields={data.fields} order={PROJECT_COLUMN_ORDER} />
        </Card>
      )}
    </>
  )
}

export function MemberListPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const { permission } = useActiveScreen()
  const { data, isLoading, error } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectApi.members(projectId, { size: 50 }),
  })

  return (
    <>
      <PageHeader
        eyebrow="Project · Member"
        title="Thành viên dự án"
        description="MEMBER_LIST gọi EMPLOYEE_SEARCH-shaped data nhưng scope là RESPONSIBILITY và field group chỉ có PUBLIC + PROJECT."
        actions={
          <>
            <Link to={`/projects/${projectId}`}>
              <Button variant="ghost" size="sm">
                ← Dự án
              </Button>
            </Link>
            <ActionGate action="CREATE">
              <Link to={`/projects/${projectId}/members/add`}>
                <Button size="sm" data-testid="open-picker">
                  Thêm thành viên
                </Button>
              </Link>
            </ActionGate>
          </>
        }
      />
      <ScopeSummary permission={permission} rowCount={data?.totalElements} />
      <Card className="mt-6">
        {isLoading && <Spinner />}
        {error != null && <ApiErrorPanel error={error} />}
        {data && <FieldTable page={data} columnOrder={EMPLOYEE_COLUMN_ORDER} testId="member-table" />}
      </Card>
    </>
  )
}

/**
 * Employee picker — the third caller of EMPLOYEE_SEARCH. Same endpoint as the employee list, but a
 * different screen context, so both the row set and the column set differ (spec §25).
 */
export function EmployeePickerPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { screen, permission } = useActiveScreen()
  const [role, setRole] = useState('MEMBER')

  const candidates = useQuery({
    queryKey: ['employees', screen.screenCode],
    queryFn: () => employeeApi.search(screen, { size: 50 }),
  })

  const assign = useMutation({
    mutationFn: (employeeId: number) => projectApi.addMember(projectId, employeeId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
      navigate(`/projects/${projectId}/members`)
    },
  })

  return (
    <>
      <PageHeader
        eyebrow="Project · Member"
        title="Chọn nhân viên"
        description="Cùng gọi GET /api/employees như màn hình Danh sách nhân viên — khác screen context nên khác kết quả."
        actions={
          <Link to={`/projects/${projectId}/members`}>
            <Button variant="ghost" size="sm">
              ← Thành viên
            </Button>
          </Link>
        }
      />

      <ScopeSummary permission={permission} rowCount={candidates.data?.totalElements} />

      <Card className="mt-6">
        <CardHeader
          eyebrow="Ứng viên"
          title="Nhân viên trong phạm vi của màn hình EMPLOYEE_PICKER"
          actions={
            <div className="flex items-center gap-2">
              <Badge tone="muted">Vai trò</Badge>
              <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Vai trò trong dự án">
                <option value="MEMBER">MEMBER</option>
                <option value="MANAGER">MANAGER</option>
              </Select>
            </div>
          }
        />
        {assign.error != null && <ApiErrorPanel error={assign.error} className="mb-4" />}
        {assign.isSuccess && (
          <Alert tone="success" className="mb-4">
            Đã thêm thành viên.
          </Alert>
        )}
        {candidates.isLoading && <Spinner />}
        {candidates.error != null && <ApiErrorPanel error={candidates.error} />}
        {candidates.data && (
          <FieldTable
            page={candidates.data}
            columnOrder={EMPLOYEE_COLUMN_ORDER}
            testId="picker-table"
            rowHref={(employeeId) => (
              <Button
                size="sm"
                variant="secondary"
                disabled={assign.isPending}
                onClick={() => assign.mutate(employeeId)}
                data-testid={`assign-${employeeId}`}
              >
                Thêm
              </Button>
            )}
          />
        )}
      </Card>
    </>
  )
}
