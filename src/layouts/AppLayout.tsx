import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '@/shared/auth/AuthProvider'
import { useNavigation } from '@/shared/permissions/hooks'
import type { NavScreen } from '@/shared/api/types'
import { Badge, Button, Spinner } from '@/shared/ui/primitives'
import { initials } from '@/shared/format'

/** Screens that are only reachable from another screen — not worth a sidebar entry. */
const HIDDEN_FROM_NAV = new Set(['EMPLOYEE_DETAIL', 'EMPLOYEE_EDIT', 'PROJECT_DETAIL', 'EMPLOYEE_PICKER', 'MEMBER_LIST'])

export function AppLayout() {
  const { me, logout } = useAuth()
  const navigate = useNavigate()
  const { data: modules, isLoading } = useNavigation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center bg-brand-500 font-display text-sm font-extrabold text-white">
              EA
            </span>
            <span className="hidden sm:block">
              <span className="block font-display text-[13px] font-extrabold uppercase leading-none tracking-tight">
                ERP Authorization Lab
              </span>
              <span className="block font-display text-[9px] uppercase tracking-label text-ink-faint">
                TKCB permission model
              </span>
            </span>
          </NavLink>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden flex-wrap justify-end gap-1 md:flex" data-testid="topbar-roles">
              {(me?.roles ?? []).map((role) => (
                <Badge key={role} tone="brand">
                  {role}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="grid h-9 w-9 place-items-center border border-line-strong font-display text-[11px] font-bold"
                aria-hidden
              >
                {initials(me?.username ?? '?')}
              </span>
              <span className="hidden text-[13px] text-ink-muted lg:block" data-testid="current-username">
                {me?.username}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={onLogout} data-testid="logout">
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav
          data-testid="sidebar"
          className={clsx(
            'w-64 shrink-0 border-r border-line bg-white',
            mobileOpen ? 'block' : 'hidden lg:block',
          )}
        >
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto px-3 py-6">
            {isLoading && <Spinner label="Đang tải menu…" />}
            {(modules ?? []).map((mod) => (
              <div key={mod.moduleKey} className="mb-6">
                <p className="mb-2 px-3 font-display text-[10px] font-bold uppercase tracking-label text-ink-faint">
                  {mod.name}
                </p>
                <ul className="space-y-0.5">
                  {mod.screens.filter(visible).map((screen) => (
                    <NavItem key={screen.screenCode} screen={screen} onNavigate={() => setMobileOpen(false)} />
                  ))}
                </ul>
                {mod.submodules.map((sub) => {
                  const screens = sub.screens.filter(visible)
                  if (screens.length === 0) return null
                  return (
                    <div key={sub.submoduleKey} className="mt-3">
                      <p className="mb-1 px-3 text-[11px] font-medium text-ink-faint/80">{sub.name}</p>
                      <ul className="space-y-0.5">
                        {screens.map((screen) => (
                          <NavItem
                            key={screen.screenCode}
                            screen={screen}
                            onNavigate={() => setMobileOpen(false)}
                          />
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </nav>

        <main className="min-w-0 flex-1 px-4 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-line bg-white px-4 py-4 text-center text-[11px] text-ink-faint lg:px-8">
        Mọi quyết định phân quyền được thực thi ở backend — giao diện chỉ phản ánh kết quả.
      </footer>
    </div>
  )
}

function visible(screen: NavScreen): boolean {
  return Boolean(screen.routePath) && !HIDDEN_FROM_NAV.has(screen.screenCode)
}

function NavItem({ screen, onNavigate }: { screen: NavScreen; onNavigate: () => void }) {
  return (
    <li>
      <NavLink
        to={screen.routePath!}
        onClick={onNavigate}
        data-testid={`nav-${screen.screenCode}`}
        className={({ isActive }) =>
          clsx(
            'block border-l-2 px-3 py-2 text-[13px] transition-colors',
            isActive
              ? 'border-brand-500 bg-brand-50 font-semibold text-brand-600'
              : 'border-transparent text-ink-muted hover:border-line-strong hover:bg-surface-sunken hover:text-ink',
          )
        }
      >
        {screen.name}
      </NavLink>
    </li>
  )
}
