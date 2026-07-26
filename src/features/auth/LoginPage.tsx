import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/shared/auth/AuthProvider'
import { authApi } from '@/shared/api/endpoints'
import { Avatar, Button, Input, Label } from '@/shared/ui/primitives'
import { ErrorNotice } from '@/shared/ui/feedback'

/**
 * Sign-in, plus the five demo identities this workspace ships with. Each one is described by the
 * job it represents ("HR toàn công ty"), not by the roles behind it — picking one should feel like
 * choosing who you are today.
 */
const PERSONAS: Record<string, { title: string; blurb: string }> = {
  'employee@example.com': { title: 'Nhân viên', blurb: 'Xem hồ sơ của mình và danh bạ nhóm.' },
  'manager@example.com': { title: 'Quản lý nhóm', blurb: 'Quản lý nhóm và dự án đang phụ trách.' },
  'hr@example.com': { title: 'Nhân sự', blurb: 'Phụ trách nhân sự khối Phát triển.' },
  'admin@example.com': { title: 'Quản trị hệ thống', blurb: 'Toàn quyền nhân sự, lương và cấu hình.' },
  'multi-role@example.com': { title: 'Kiêm nhiệm', blurb: 'Vừa quản lý nhóm, vừa phụ trách nhân sự.' },
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, status } = useAuth()
  const [username, setUsername] = useState('employee@example.com')
  const [password, setPassword] = useState('Password@123')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: demoAccounts } = useQuery({ queryKey: ['demo-accounts'], queryFn: authApi.demoAccounts })

  useEffect(() => {
    if (status === 'authenticated') navigate('/dashboard', { replace: true })
  }, [status, navigate])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* --------------------------------------------------------- sign in */}
      <section className="flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-control bg-brand-500 font-display text-xs font-bold text-white">
              EA
            </span>
            <span>
              <span className="block font-display text-md font-semibold leading-tight">ACME Workspace</span>
              <span className="block text-xs text-ink-subtle">Nhân sự &amp; dự án</span>
            </span>
          </div>

          <h1 className="text-2xl font-semibold">Đăng nhập</h1>
          <p className="mt-1.5 text-base text-ink-muted">Dùng tài khoản công ty của bạn để tiếp tục.</p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <div>
              <Label htmlFor="username">Email công ty</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={reveal ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setReveal((value) => !value)}
                  aria-label={reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-control text-ink-subtle hover:text-ink"
                >
                  {reveal ? <EyeOff size={16} strokeWidth={1.9} /> : <Eye size={16} strokeWidth={1.9} />}
                </button>
              </div>
            </div>

            <ErrorNotice error={error} />

            <Button type="submit" size="lg" className="w-full" disabled={submitting} data-testid="login-submit">
              {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>
          </form>
        </div>
      </section>

      {/* -------------------------------------------------------- personas */}
      <section className="relative flex items-center justify-center overflow-hidden bg-canvas px-6 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-50"
        />
        <div className="relative w-full max-w-md">
          <p className="section-label">Tài khoản dùng thử</p>
          <h2 className="mt-1.5 text-xl font-semibold">Cùng một workspace, khác vai trò</h2>
          <p className="mt-1.5 text-base text-ink-muted">
            Mỗi người nhìn thấy một phần dữ liệu khác nhau. Chọn một tài khoản để xem sự khác biệt.
          </p>

          <ul className="mt-6 space-y-2">
            {(demoAccounts ?? []).map((account) => {
              const persona = PERSONAS[account.username]
              const selected = username === account.username
              return (
                <li key={account.username}>
                  <button
                    type="button"
                    data-testid={`demo-${account.username}`}
                    onClick={() => {
                      setUsername(account.username)
                      setPassword(account.password)
                    }}
                    className={
                      selected
                        ? 'flex w-full items-center gap-3 rounded-card border border-brand-300 bg-brand-50/60 p-3.5 text-left transition-colors'
                        : 'flex w-full items-center gap-3 rounded-card border border-line bg-surface p-3.5 text-left transition-colors hover:border-line-strong hover:shadow-card'
                    }
                  >
                    <Avatar name={persona?.title ?? account.username} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium text-ink">
                        {persona?.title ?? account.username}
                      </span>
                      <span className="block truncate text-sm text-ink-muted">
                        {persona?.blurb ?? account.description}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      strokeWidth={2}
                      aria-hidden
                      className={selected ? 'text-brand-500' : 'text-ink-subtle'}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </div>
  )
}
