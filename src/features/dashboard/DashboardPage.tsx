import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FolderKanban,
  ListChecks,
  Plus,
  ScrollText,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import { auditApi, employeeApi, projectApi } from '@/shared/api/endpoints'
import { useAuth } from '@/shared/auth/AuthProvider'
import { useNavigation } from '@/shared/permissions/hooks'
import { grantedActions, grantedScreens } from '@/shared/navigation/businessNav'
import { SCREENS } from '@/shared/permissions/screens'
import { describeActivity, relativeTime } from '@/shared/activity'
import { Avatar, Badge, Button, Card, SkeletonCard } from '@/shared/ui/primitives'
import { EmptyState } from '@/shared/ui/feedback'
import { useMyProfile } from './useMyProfile'
import { SectionCard, StatCard } from './widgets'

const currency = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })
const number = new Intl.NumberFormat('vi-VN')

/**
 * The first screen of the working day. It answers three questions in order: who am I today, how big
 * is my world, and what is waiting for me. Nothing on it describes the system — every card is a
 * business fact pulled from data this person is allowed to see, and a card disappears entirely when
 * they are not.
 */
export function DashboardPage() {
  const { me } = useAuth()
  const profile = useMyProfile()
  const { data: navigation } = useNavigation()
  const granted = grantedScreens(navigation)

  const canSeePeople = granted.has('EMPLOYEE_LIST')
  const canSeePayroll = granted.has('SALARY_LIST')
  const canSeeProjects = granted.has('PROJECT_LIST')
  const canSeeActivity = granted.has('AUDIT_LOG_LIST')
  const canAddPeople = grantedActions(navigation, 'EMPLOYEE_CREATE').includes('CREATE')

  const people = useQuery({
    queryKey: ['dashboard-people'],
    queryFn: () => employeeApi.search(SCREENS.EMPLOYEE_LIST, { size: 100 }),
    enabled: canSeePeople,
  })
  const payroll = useQuery({
    queryKey: ['dashboard-payroll'],
    queryFn: () => employeeApi.salaries({ size: 100 }),
    enabled: canSeePayroll,
  })
  const projects = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: () => projectApi.search(SCREENS.PROJECT_LIST, { size: 50 }),
    enabled: canSeeProjects,
  })
  const activity = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => auditApi.logs({ size: 6 }),
    enabled: canSeeActivity,
  })

  const colleagues = (people.data?.content ?? []).filter((row) => row.id !== me?.employeeId)
  const payrollTotal = (payroll.data?.content ?? []).reduce(
    (sum, row) => sum + (typeof row.fields.salary === 'number' ? row.fields.salary : 0),
    0,
  )
  const activeProjects = (projects.data?.content ?? []).filter(
    (row) => row.fields.projectStatus === 'ACTIVE' || row.fields.projectStatus === undefined,
  )

  const tasks = buildTasks({
    profileMissingContact: profile.hasContactGap,
    peopleMissingEmail: (people.data?.content ?? []).filter(
      (row) => 'companyEmail' in row.fields && !row.fields.companyEmail,
    ).length,
    peopleInactive: (people.data?.content ?? []).filter((row) => row.fields.status === 'INACTIVE').length,
    canSeePeople,
  })

  const hasAnyStat = canSeePeople || canSeePayroll || canSeeProjects

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- hero */}
      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-brand-50"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={profile.fullName ?? me?.username ?? '?'} size="lg" />
            <div className="min-w-0">
              <p className="text-sm text-ink-muted">{greeting()}</p>
              <h1 className="truncate text-2xl font-semibold">{profile.fullName ?? me?.username}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                {profile.jobTitle && <span>{profile.jobTitle}</span>}
                {profile.jobTitle && (profile.team || profile.department) && <span aria-hidden>·</span>}
                {(profile.team || profile.department) && <span>{profile.team ?? profile.department}</span>}
                <span aria-hidden>·</span>
                <span>{today()}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canAddPeople && (
              <Link to="/hrm/employees/new">
                <Button icon={Plus}>Thêm nhân viên</Button>
              </Link>
            )}
            <Link to="/hrm/my-profile">
              <Button variant="secondary" icon={UserRound}>
                Hồ sơ của tôi
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------------------- KPIs */}
      {hasAnyStat && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {canSeePeople && (
            <StatCard
              label="Nhân viên bạn quản lý"
              value={number.format(people.data?.totalElements ?? 0)}
              hint={colleagues.length > 0 ? `${colleagues.length} đồng nghiệp trong phạm vi của bạn` : undefined}
              icon={Users}
              to="/hrm/employees"
              loading={people.isLoading}
            />
          )}
          {canSeePayroll && (
            <StatCard
              label="Quỹ lương kỳ này"
              value={`${currency.format(payrollTotal)} ₫`}
              hint={`${number.format(payroll.data?.totalElements ?? 0)} bảng lương`}
              icon={Wallet}
              to="/hrm/salaries"
              loading={payroll.isLoading}
            />
          )}
          {canSeeProjects && (
            <StatCard
              label="Dự án đang chạy"
              value={number.format(activeProjects.length)}
              hint={`${number.format(projects.data?.totalElements ?? 0)} dự án bạn theo dõi`}
              icon={FolderKanban}
              to="/projects"
              loading={projects.isLoading}
            />
          )}
        </div>
      )}

      {/* ------------------------------------------------------- main columns */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <SectionCard
            title="Cần bạn xử lý"
            description="Việc phát sinh từ dữ liệu bạn đang phụ trách."
            icon={ListChecks}
            padded={false}
          >
            {tasks.length === 0 ? (
              <EmptyState
                compact
                icon={CheckCircle2}
                title="Không có việc nào đang chờ"
                description="Dữ liệu trong phạm vi của bạn đang đầy đủ."
              />
            ) : (
              <ul>
                {tasks.map((task) => (
                  <li key={task.id} className="border-t border-line first:border-t-0">
                    <Link
                      to={task.to}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted"
                    >
                      <span
                        className={
                          task.tone === 'caution'
                            ? 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-caution-50 text-caution-700'
                            : 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-info-50 text-info-700'
                        }
                      >
                        <CircleAlert size={15} strokeWidth={2} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-medium text-ink">{task.title}</span>
                        <span className="block truncate text-sm text-ink-muted">{task.description}</span>
                      </span>
                      <ArrowRight size={16} strokeWidth={2} aria-hidden className="shrink-0 text-ink-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {canSeePeople && (
            <SectionCard
              title="Đồng nghiệp của bạn"
              description="Những người bạn làm việc cùng hằng ngày."
              icon={Users}
              to="/hrm/employees"
              padded={false}
            >
              {people.isLoading && <div className="skeleton mx-5 mb-5 h-24" />}
              {!people.isLoading && colleagues.length === 0 && (
                <EmptyState compact title="Chưa có ai trong danh bạ của bạn" />
              )}
              <ul>
                {colleagues.slice(0, 5).map((row) => (
                  <li key={row.id} className="border-t border-line first:border-t-0">
                    <Link
                      to={`/hrm/employees/${row.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                    >
                      <Avatar name={String(row.fields.fullName ?? '?')} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-medium text-ink">
                          {String(row.fields.fullName ?? '—')}
                        </span>
                        <span className="block truncate text-sm text-ink-muted">
                          {[row.fields.jobTitle, row.fields.team].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </span>
                      <ArrowRight size={15} strokeWidth={2} aria-hidden className="shrink-0 text-ink-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          {canSeeProjects && (
            <SectionCard title="Dự án" icon={FolderKanban} to="/projects" padded={false}>
              {projects.isLoading && <div className="skeleton mx-5 mb-5 h-20" />}
              {!projects.isLoading && (projects.data?.content.length ?? 0) === 0 && (
                <EmptyState compact icon={FolderKanban} title="Bạn chưa tham gia dự án nào" />
              )}
              <ul>
                {(projects.data?.content ?? []).slice(0, 4).map((row) => (
                  <li key={row.id} className="border-t border-line first:border-t-0">
                    <Link
                      to={`/projects/${row.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-medium text-ink">
                          {String(row.fields.projectName ?? '—')}
                        </span>
                        <span className="block truncate text-sm text-ink-muted">
                          {String(row.fields.projectDepartment ?? '—')}
                        </span>
                      </span>
                      <Badge tone="positive">Đang chạy</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {canSeeActivity && (
            <SectionCard title="Hoạt động gần đây" icon={ScrollText} to="/activity" padded={false}>
              {activity.isLoading && <div className="skeleton mx-5 mb-5 h-24" />}
              <ul>
                {(activity.data?.content ?? []).slice(0, 6).map((row) => (
                  <li key={row.id} className="flex gap-3 border-t border-line px-5 py-3 first:border-t-0">
                    <Avatar name={row.username ?? 'Hệ thống'} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink-secondary">{describeActivity(row)}</p>
                      <p className="text-xs text-ink-subtle">{relativeTime(row.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {!canSeeActivity && !canSeeProjects && (people.isLoading || payroll.isLoading) && <SkeletonCard />}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ helpers */

interface Task {
  id: string
  title: string
  description: string
  to: string
  tone: 'info' | 'caution'
}

function buildTasks(input: {
  profileMissingContact: boolean
  peopleMissingEmail: number
  peopleInactive: number
  canSeePeople: boolean
}): Task[] {
  const tasks: Task[] = []
  if (input.profileMissingContact) {
    tasks.push({
      id: 'profile-contact',
      title: 'Bổ sung thông tin liên hệ của bạn',
      description: 'Đồng nghiệp cần số điện thoại hoặc email cá nhân để liên hệ khi cần.',
      to: '/hrm/my-profile',
      tone: 'info',
    })
  }
  if (input.canSeePeople && input.peopleMissingEmail > 0) {
    tasks.push({
      id: 'missing-email',
      title: `${input.peopleMissingEmail} nhân viên chưa có email công ty`,
      description: 'Thiếu email công ty thì không nhận được thông báo nội bộ.',
      to: '/hrm/employees',
      tone: 'caution',
    })
  }
  if (input.canSeePeople && input.peopleInactive > 0) {
    tasks.push({
      id: 'inactive',
      title: `${input.peopleInactive} nhân viên đã nghỉ việc`,
      description: 'Rà soát lại quyền truy cập và bàn giao công việc.',
      to: '/hrm/employees',
      tone: 'caution',
    })
  }
  return tasks
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'Chào buổi sáng'
  if (hour < 14) return 'Chào buổi trưa'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function today(): string {
  return new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
