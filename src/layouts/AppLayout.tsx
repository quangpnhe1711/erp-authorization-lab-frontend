import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '@/shared/auth/AuthProvider'
import { useDeveloperMode } from '@/shared/devmode/DeveloperModeProvider'
import { useNavigation } from '@/shared/permissions/hooks'
import { visibleSections, type NavItem } from '@/shared/navigation/businessNav'
import { useMyProfile } from '@/features/dashboard/useMyProfile'
import { Avatar, Badge, IconButton, SearchInput, Switch } from '@/shared/ui/primitives'
import { ThemeToggle } from '@/shared/theme/ThemeProvider'
import { LAB_SECTION } from '@/features/lab/nav'
import { NotificationMenu } from './NotificationMenu'

const COLLAPSE_KEY = 'eal.sidebarCollapsed'

export function AppLayout() {
  const navigate = useNavigate()
  const { me, logout } = useAuth()
  const { data: navigationTree, isLoading } = useNavigation()
  const profile = useMyProfile()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')

  /**
   * Business sections come from the server's navigation tree. The Authorization Lab does not: it is
   * the tool that configures that tree, so gating it on the tree would hide the repair kit exactly
   * when the configuration is broken. It follows the SYSTEM_ADMIN role instead.
   */
  const sections = useMemo(() => {
    const business = visibleSections(navigationTree)
    return me?.roles.includes('SYSTEM_ADMIN') ? [...business, LAB_SECTION] : business
  }, [navigationTree, me])

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const canSearchPeople = sections.some((s) => s.items.some((i) => i.screenCode === 'EMPLOYEE_LIST'))

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    navigate(`/hrm/employees?q=${encodeURIComponent(term)}`)
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* -------------------------------------------------------------- sidebar */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
        />
      )}

      <aside
        data-testid="sidebar"
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          collapsed ? 'lg:w-rail' : 'lg:w-sidebar',
          'w-sidebar',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className={clsx('flex h-topbar items-center gap-2.5 border-b border-line', collapsed ? 'justify-center px-2' : 'px-4')}>
          <NavLink to="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-brand-500 font-display text-xs font-bold text-white">
              EA
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-semibold leading-tight">ACME Workspace</span>
                <span className="block truncate text-xs text-ink-subtle">Nhân sự &amp; dự án</span>
              </span>
            )}
          </NavLink>
          <IconButton icon={X} label="Đóng menu" onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden" />
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {isLoading && (
            <div className="space-y-2 px-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton h-9" />
              ))}
            </div>
          )}
          {sections.map((section) => (
            <div key={section.id} className="mb-5 last:mb-0">
              {!collapsed && <p className="section-label mb-1.5 px-3">{section.label}</p>}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.screenCode}
                    item={item}
                    collapsed={collapsed}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-line p-2 lg:block">
          <IconButton
            icon={collapsed ? PanelLeftOpen : PanelLeftClose}
            label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            onClick={() => setCollapsed((value) => !value)}
            className="w-full"
          />
        </div>
      </aside>

      {/* ------------------------------------------------------------- content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-topbar items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur lg:px-6">
          <IconButton icon={Menu} label="Mở menu" onClick={() => setMobileOpen(true)} className="lg:hidden" />

          {canSearchPeople ? (
            <form onSubmit={submitSearch} className="hidden min-w-0 flex-1 sm:block sm:max-w-md">
              <SearchInput
                icon={Search}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm nhân viên theo tên hoặc mã"
                aria-label="Tìm nhân viên"
                data-testid="global-search"
                className="h-9 bg-canvas"
              />
            </form>
          ) : (
            <div className="flex-1" />
          )}

          <div className="ml-auto flex items-center gap-1">
            <DeveloperModeChip />
            <ThemeToggle />
            <NotificationMenu />
            <UserMenu
              name={profile.fullName ?? me?.username ?? ''}
              username={me?.username ?? ''}
              jobTitle={profile.jobTitle}
              department={profile.department}
              onProfile={() => navigate('/hrm/my-profile')}
              onLogout={async () => {
                await logout()
                navigate('/login', { replace: true })
              }}
            />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px] animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon
  return (
    <li>
      <NavLink
        to={item.to}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        data-testid={`nav-${item.screenCode}`}
        className={({ isActive }) =>
          clsx(
            'group relative flex items-center gap-2.5 rounded-control px-3 py-2 text-base transition-colors',
            collapsed && 'justify-center px-0',
            isActive
              ? 'bg-brand-50 font-medium text-brand-600 before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand-500'
              : 'text-ink-secondary hover:bg-line/60 hover:text-ink',
          )
        }
      >
        <Icon size={17} strokeWidth={1.9} aria-hidden className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    </li>
  )
}

function DeveloperModeChip() {
  const { developerMode } = useDeveloperMode()
  if (!developerMode) return null
  return (
    <Badge tone="neutral" className="mr-1 hidden bg-ink text-white sm:inline-flex" data-testid="developer-mode-chip">
      Developer mode
    </Badge>
  )
}

function UserMenu({
  name,
  username,
  jobTitle,
  department,
  onProfile,
  onLogout,
}: {
  name: string
  username: string
  jobTitle?: string
  department?: string
  onProfile: () => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { developerMode, setDeveloperMode } = useDeveloperMode()

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="user-menu"
        className="flex items-center gap-2 rounded-control py-1 pl-1 pr-2 text-left transition-colors hover:bg-line/60"
      >
        <Avatar name={name || username} size="md" />
        <span className="hidden min-w-0 md:block">
          <span className="block max-w-[10rem] truncate text-sm font-medium" data-testid="current-username">
            {name || username}
          </span>
          {jobTitle && <span className="block max-w-[10rem] truncate text-xs text-ink-subtle">{jobTitle}</span>}
        </span>
        <ChevronDown size={15} strokeWidth={2} aria-hidden className="text-ink-subtle" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-72 rounded-card border border-line bg-surface p-1.5 shadow-lift animate-rise-in"
        >
          <div className="flex items-center gap-3 rounded-control px-2.5 py-2.5">
            <Avatar name={name || username} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-base font-medium">{name || username}</p>
              {jobTitle && <p className="truncate text-sm text-ink-muted">{jobTitle}</p>}
              {department && <p className="truncate text-xs text-ink-subtle">{department}</p>}
            </div>
          </div>

          <div className="my-1 h-px bg-line" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onProfile()
            }}
            className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-base text-ink-secondary transition-colors hover:bg-line/60 hover:text-ink"
          >
            <UserRound size={16} strokeWidth={1.9} aria-hidden />
            Hồ sơ của tôi
          </button>

          <div className="my-1 h-px bg-line" />

          <div className="flex items-start justify-between gap-3 rounded-control px-2.5 py-2">
            <div className="min-w-0">
              <p className="text-base text-ink-secondary">Chế độ nhà phát triển</p>
              <p className="mt-0.5 text-xs text-ink-subtle">Hiện bảng chẩn đoán quyền và mã lỗi kỹ thuật.</p>
            </div>
            <span className="pt-1" data-testid="developer-mode-toggle">
              <Switch checked={developerMode} onChange={setDeveloperMode} label="Chế độ nhà phát triển" />
            </span>
          </div>

          <div className="my-1 h-px bg-line" />

          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            data-testid="logout"
            className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-base text-ink-secondary transition-colors hover:bg-brand-50 hover:text-brand-600"
          >
            <LogOut size={16} strokeWidth={1.9} aria-hidden />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}

