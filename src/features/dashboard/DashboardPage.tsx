import { Link } from 'react-router-dom'
import { useAuth } from '@/shared/auth/AuthProvider'
import { useNavigation } from '@/shared/permissions/hooks'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { Badge, Card, CardHeader, PageHeader, Spinner } from '@/shared/ui/primitives'

const DEMO_HINTS = [
  {
    title: 'Cùng một API, ba màn hình',
    body: 'EMPLOYEE_SEARCH gọi từ Employee List, Project Members và Employee Picker trả về số dòng và số cột khác nhau — record scope và field group gắn với screen, không gắn với API.',
  },
  {
    title: 'Multi-role là hợp (union)',
    body: 'multi-role@example.com có TEAM_MANAGER + HR_OFFICER nên thấy TEAM ∪ RESPONSIBILITY. Scope là thứ tự bộ phận, không phải enum lớn hơn thắng.',
  },
  {
    title: 'Field-level là ở backend',
    body: 'Trường không được đọc thì không có trong response (không phải null). Thử sửa lương ở My Profile để nhận FIELD_PERMISSION_DENIED.',
  },
]

export function DashboardPage() {
  const { me } = useAuth()
  const { permission } = useActiveScreen()
  const { data: modules, isLoading } = useNavigation()

  const screens = (modules ?? []).flatMap((m) => [...m.screens, ...m.submodules.flatMap((s) => s.screens)])

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Xin chào, ${me?.username ?? ''}`}
        description="Đây là toàn bộ những gì backend cho phép tài khoản này nhìn thấy — menu, màn hình và hành động đều lấy từ cấu hình phân quyền, không hard-code ở frontend."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader eyebrow="Identity" title="Phiên hiện tại" />
          <dl className="space-y-3 text-[13px]">
            <div>
              <dt className="font-display text-[10px] uppercase tracking-label text-ink-faint">Username</dt>
              <dd className="mt-1 text-ink">{me?.username}</dd>
            </div>
            <div>
              <dt className="font-display text-[10px] uppercase tracking-label text-ink-faint">Employee id</dt>
              <dd className="mt-1 text-ink">{me?.employeeId ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-display text-[10px] uppercase tracking-label text-ink-faint">Roles</dt>
              <dd className="mt-2 flex flex-wrap gap-1" data-testid="dashboard-roles">
                {(me?.roles ?? []).map((role) => (
                  <Badge key={role} tone="brand">
                    {role}
                  </Badge>
                ))}
              </dd>
            </div>
            <div>
              <dt className="font-display text-[10px] uppercase tracking-label text-ink-faint">
                Hành động trên Dashboard
              </dt>
              <dd className="mt-2 flex flex-wrap gap-1">
                {(permission?.allowedActions ?? []).map((action) => (
                  <Badge key={action}>{action}</Badge>
                ))}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            eyebrow="Navigation"
            title="Màn hình bạn được phép mở"
            description={`${screens.length} màn hình từ role_screen_permissions.`}
            actions={<Badge tone="muted">{modules?.length ?? 0} module</Badge>}
          />
          {isLoading && <Spinner />}
          <div className="grid gap-4 sm:grid-cols-2">
            {(modules ?? []).map((mod) => (
              <div key={mod.moduleKey} className="border border-line p-4">
                <p className="eyebrow mb-2">{mod.name}</p>
                <ul className="space-y-1 text-[13px]">
                  {[...mod.screens, ...mod.submodules.flatMap((s) => s.screens)].map((screen) => (
                    <li key={screen.screenCode} className="flex items-center justify-between gap-2">
                      {screen.routePath && !screen.routePath.includes(':') ? (
                        <Link to={screen.routePath} className="text-ink-muted hover:text-brand-500">
                          {screen.name}
                        </Link>
                      ) : (
                        <span className="text-ink-faint">{screen.name}</span>
                      )}
                      <span className="font-mono text-[10px] text-ink-faint">{screen.actions.join('/')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {DEMO_HINTS.map((hint) => (
          <Card key={hint.title}>
            <p className="eyebrow mb-2">Thử ngay</p>
            <h3 className="text-sm font-bold">{hint.title}</h3>
            <p className="mt-2 text-[13px] leading-6 text-ink-faint">{hint.body}</p>
          </Card>
        ))}
      </div>
    </>
  )
}
