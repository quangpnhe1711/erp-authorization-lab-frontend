import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FolderKanban, UserPlus, Users } from 'lucide-react'
import { employeeApi, projectApi } from '@/shared/api/endpoints'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { ActionGate } from '@/shared/permissions/ScreenGuard'
import { ScopeNotice } from '@/shared/permissions/ScopeNotice'
import { Badge, Button, Card, PageHeader, Select, SkeletonRows } from '@/shared/ui/primitives'
import { ErrorState, Toast } from '@/shared/ui/feedback'
import { EMPLOYEE_COLUMN_ORDER, FieldTable, PROJECT_COLUMN_ORDER } from '@/shared/ui/FieldTable'

export function ProjectListPage() {
  const { screen, permission } = useActiveScreen()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['projects', screen.screenCode],
    queryFn: () => projectApi.search(screen, { size: 50 }),
  })

  return (
    <>
      <PageHeader title="Dự án" description="Các dự án bạn tham gia hoặc phụ trách." />

      <Card padded={false}>
        {isLoading && <SkeletonRows rows={4} columns={4} />}
        {error != null && <ErrorState error={error} onRetry={() => refetch()} />}
        {data && (
          <FieldTable
            page={data}
            columnOrder={PROJECT_COLUMN_ORDER}
            testId="project-table"
            onRowClick={(id) => navigate(`/projects/${id}`)}
            emptyTitle="Bạn chưa tham gia dự án nào"
            emptyDescription="Khi được thêm vào một dự án, nó sẽ xuất hiện ở đây."
          />
        )}
      </Card>

      {data && data.content.length > 0 && (
        <div className="mt-3">
          <ScopeNotice permission={permission} count={data.totalElements} noun="dự án" />
        </div>
      )}
    </>
  )
}

export function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const { screen } = useActiveScreen()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['project', screen.screenCode, projectId],
    queryFn: () => projectApi.detail(screen, projectId),
  })

  const fields = data?.fields ?? {}

  return (
    <>
      <PageHeader
        title={typeof fields.projectName === 'string' ? fields.projectName : 'Dự án'}
        breadcrumb={
          <Link to="/projects" className="inline-flex items-center gap-1.5 hover:text-ink">
            <ArrowLeft size={14} strokeWidth={2} aria-hidden />
            Dự án
          </Link>
        }
        actions={
          <Link to={`/projects/${projectId}/members`}>
            <Button variant="secondary" icon={Users}>
              Thành viên
            </Button>
          </Link>
        }
      />

      {isLoading && <div className="skeleton h-40" />}
      {error != null && (
        <Card padded={false}>
          <ErrorState error={error} onRetry={() => refetch()} />
        </Card>
      )}

      {data && (
        <Card>
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-card bg-canvas text-ink-muted">
              <FolderKanban size={20} strokeWidth={1.8} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">{String(fields.projectName ?? '—')}</h2>
              <p className="mt-1 text-sm text-ink-muted">{String(fields.projectDepartment ?? '—')}</p>
            </div>
            {typeof fields.projectStatus === 'string' && <Badge tone="positive">Đang chạy</Badge>}
          </div>
          {typeof fields.projectCode === 'string' && (
            <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">
              Mã dự án <span className="font-mono text-ink">{fields.projectCode}</span>
            </p>
          )}
        </Card>
      )}
    </>
  )
}

export function MemberListPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const { permission } = useActiveScreen()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectApi.members(projectId, { size: 50 }),
  })

  return (
    <>
      <PageHeader
        title="Thành viên dự án"
        description="Những người đang tham gia dự án này."
        breadcrumb={
          <Link to={`/projects/${projectId}`} className="inline-flex items-center gap-1.5 hover:text-ink">
            <ArrowLeft size={14} strokeWidth={2} aria-hidden />
            Dự án
          </Link>
        }
        actions={
          <ActionGate action="CREATE">
            <Link to={`/projects/${projectId}/members/add`}>
              <Button icon={UserPlus} data-testid="open-picker">
                Thêm thành viên
              </Button>
            </Link>
          </ActionGate>
        }
      />

      <Card padded={false}>
        {isLoading && <SkeletonRows rows={4} columns={4} />}
        {error != null && <ErrorState error={error} onRetry={() => refetch()} />}
        {data && (
          <FieldTable
            page={data}
            columnOrder={EMPLOYEE_COLUMN_ORDER}
            testId="member-table"
            emptyTitle="Dự án chưa có thành viên"
            emptyDescription="Thêm người vào dự án để họ thấy công việc của mình."
          />
        )}
      </Card>

      {data && data.content.length > 0 && (
        <div className="mt-3">
          <ScopeNotice permission={permission} count={data.totalElements} noun="thành viên" />
        </div>
      )}
    </>
  )
}

/** Adding someone to a project: the candidate list is already limited to people you may manage. */
export function EmployeePickerPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { screen, permission } = useActiveScreen()
  const [role, setRole] = useState('MEMBER')
  const [added, setAdded] = useState<string | null>(null)

  const candidates = useQuery({
    queryKey: ['employees', screen.screenCode],
    queryFn: () => employeeApi.search(screen, { size: 50 }),
  })

  const assign = useMutation({
    mutationFn: (employeeId: number) => projectApi.addMember(projectId, employeeId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
      setAdded('Đã thêm thành viên vào dự án')
      navigate(`/projects/${projectId}/members`)
    },
  })

  return (
    <>
      <PageHeader
        title="Thêm thành viên"
        description="Chọn người bạn muốn đưa vào dự án."
        breadcrumb={
          <Link to={`/projects/${projectId}/members`} className="inline-flex items-center gap-1.5 hover:text-ink">
            <ArrowLeft size={14} strokeWidth={2} aria-hidden />
            Thành viên dự án
          </Link>
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <label htmlFor="member-role" className="text-sm text-ink-muted">
            Vai trò khi tham gia
          </label>
          <Select
            id="member-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-9 w-44"
          >
            <option value="MEMBER">Thành viên</option>
            <option value="MANAGER">Quản lý dự án</option>
          </Select>
          <span className="ml-auto text-sm text-ink-muted">
            {candidates.data ? `${candidates.data.totalElements} người có thể chọn` : ''}
          </span>
        </div>

        {assign.error != null && (
          <div className="p-5">
            <ErrorState error={assign.error} />
          </div>
        )}
        {candidates.isLoading && <SkeletonRows rows={5} columns={4} />}
        {candidates.error != null && <ErrorState error={candidates.error} onRetry={() => candidates.refetch()} />}

        {candidates.data && (
          <FieldTable
            page={candidates.data}
            columnOrder={EMPLOYEE_COLUMN_ORDER}
            testId="picker-table"
            emptyTitle="Không có ai để thêm"
            emptyDescription="Bạn chỉ có thể thêm những người thuộc phạm vi mình phụ trách."
            rowAction={(employeeId) => (
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

      {candidates.data && candidates.data.content.length > 0 && (
        <div className="mt-3">
          <ScopeNotice permission={permission} count={candidates.data.totalElements} noun="người" />
        </div>
      )}

      <Toast open={added != null} message={added ?? ''} onClose={() => setAdded(null)} />
    </>
  )
}

