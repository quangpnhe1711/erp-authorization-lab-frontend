import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth/AuthProvider'
import { authApi } from '@/shared/api/endpoints'
import { Badge, Button, Input, Label } from '@/shared/ui/primitives'
import { ApiErrorPanel } from '@/shared/ui/feedback'

/**
 * Login + demo-account picker (spec §24). The five demo users are the whole point of the lab:
 * each one sees a different slice of the same screens.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const { login, status } = useAuth()
  const [username, setUsername] = useState('employee@example.com')
  const [password, setPassword] = useState('Password@123')
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
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between bg-ink px-12 py-14 text-white lg:flex">
        <div className="absolute inset-y-0 left-0 w-1 bg-brand-500" aria-hidden />
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center bg-brand-500 font-display text-sm font-extrabold">
            EA
          </span>
          <span className="font-display text-sm font-extrabold uppercase tracking-tight">
            ERP Authorization Lab
          </span>
        </div>

        <div className="max-w-xl">
          <p className="font-display text-[11px] font-bold uppercase tracking-label text-brand-400">
            TKCB permission model
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-[1.05]">
            Cùng một API.
            <br />
            Khác màn hình.
            <br />
            <span className="text-brand-400">Khác dữ liệu.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-white/70">
            User → Role → Module/Submodule/Screen → API use-case → Action → Record scope → Field group. Toàn bộ
            quyết định phân quyền được thực thi ở backend; giao diện chỉ hiển thị phần được phép.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-6 border-t border-white/15 pt-6 text-white/70">
          {[
            ['7', 'Bước kiểm tra quyền'],
            ['6', 'Record scope'],
            ['8', 'Field group'],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="font-display text-3xl font-extrabold text-white">{value}</dt>
              <dd className="mt-1 font-display text-[10px] uppercase tracking-label">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rule-accent mb-8">
            <p className="eyebrow mb-1">Đăng nhập</p>
            <h2 className="text-2xl font-extrabold uppercase leading-none tracking-tight">Xin chào</h2>
            <p className="mt-2 text-[13px] text-ink-faint">
              Chọn một tài khoản demo bên dưới hoặc nhập thủ công.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error != null && <ApiErrorPanel error={error} />}

            <Button type="submit" className="w-full" disabled={submitting} data-testid="login-submit">
              {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>
          </form>

          <div className="mt-10">
            <p className="eyebrow mb-3">Tài khoản demo</p>
            <ul className="space-y-2">
              {(demoAccounts ?? []).map((account) => (
                <li key={account.username}>
                  <button
                    type="button"
                    data-testid={`demo-${account.username}`}
                    onClick={() => {
                      setUsername(account.username)
                      setPassword(account.password)
                    }}
                    className="w-full border border-line px-4 py-3 text-left transition-colors hover:border-brand-500 hover:bg-brand-50"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-display text-[12px] font-bold">{account.username}</span>
                      <Badge tone="muted">chọn</Badge>
                    </span>
                    <span className="mt-1 block text-[12px] text-ink-faint">{account.description}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-ink-faint">Mật khẩu chung: Password@123</p>
          </div>
        </div>
      </section>
    </div>
  )
}
