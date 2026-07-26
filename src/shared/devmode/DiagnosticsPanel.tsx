import { useState } from 'react'
import clsx from 'clsx'
import { Bug, X } from 'lucide-react'
import { useAuth } from '@/shared/auth/AuthProvider'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { clearApiCalls, useApiCalls } from '@/shared/permissions/debugStore'
import { screenContextHeaders } from '@/shared/permissions/screens'
import { useDeveloperMode } from './DeveloperModeProvider'

/**
 * Admin diagnostic panel — the only surface in the product that speaks in codes. It answers
 * "why did this screen return these rows and these columns?" with the request headers, the merged
 * permission the server computed and the calls this screen made. Hidden unless developer mode is on.
 */
export function DiagnosticsPanel() {
  const { developerMode } = useDeveloperMode()
  const [open, setOpen] = useState(false)
  const { screen, permission } = useActiveScreen()
  const { me } = useAuth()
  const calls = useApiCalls()

  if (!developerMode) return null

  const screenCalls = calls.filter((call) => call.screen?.screenCode === screen.screenCode)
  const lastError = screenCalls.find((call) => call.errorCode)
  const headers = screenContextHeaders(screen)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        data-testid="diagnostics-toggle"
        aria-expanded={open}
        className={clsx(
          'fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium shadow-lift transition-colors',
          lastError ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-ink text-white hover:bg-ink-secondary',
        )}
      >
        <Bug size={14} strokeWidth={2} aria-hidden />
        {lastError ? lastError.errorCode : 'Diagnostics'}
      </button>

      {open && (
        <aside
          data-testid="diagnostics-panel"
          className="dev-surface fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col shadow-overlay animate-slide-in"
        >
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Admin diagnostics</p>
              <h2 className="mt-0.5 text-[13px] font-medium text-white">{screen.screenCode}</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              data-testid="diagnostics-close"
              className="text-white/50 hover:text-white"
            >
              <X size={16} strokeWidth={2} aria-hidden />
            </button>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <Block title="Request context">
              {Object.entries(headers).map(([key, value]) => (
                <Row key={key} label={key} value={value} />
              ))}
            </Block>

            <Block title="Principal">
              <Row label="username" value={me?.username ?? '—'} />
              <Row label="userId" value={String(me?.userId ?? '—')} />
              <Row label="employeeId" value={String(me?.employeeId ?? '—')} />
              <Row label="roles" value={(me?.roles ?? []).join(', ') || '—'} />
            </Block>

            <Block title="Effective permission">
              <Row label="screenAccess" value={permission?.screenAccess ? 'ALLOW' : 'DENY'} />
              <Row label="allowedActions" value={permission?.allowedActions.join(', ') || '—'} />
              <Row label="recordScopes" value={permission?.recordScopes.join(' ∪ ') || '—'} />
              <Row label="readableFieldGroups" value={permission?.readableFieldGroups.join(', ') || '—'} />
              <Row label="updatableFieldGroups" value={permission?.updatableFieldGroups.join(', ') || '—'} />
              <Row label="sourceRoles" value={permission?.sourceRoles.join(', ') || '—'} />
              <Row label="readableFields" value={permission?.readableFields.join(', ') || '—'} wrap />
            </Block>

            <Block
              title="Calls from this screen"
              action={
                <button type="button" onClick={clearApiCalls} className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white">
                  clear
                </button>
              }
            >
              {screenCalls.length === 0 && <p className="text-white/40">no requests yet</p>}
              <ul className="space-y-3">
                {screenCalls.map((call) => (
                  <li
                    key={`${call.at}-${call.url}`}
                    className={clsx('border-l-2 pl-3', call.errorCode ? 'border-brand-500' : 'border-white/20')}
                  >
                    <p className="text-white">
                      {call.method} {call.url}
                    </p>
                    <p className="mt-0.5 text-white/50">
                      {call.status} · {call.apiCode ?? '—'}
                      {typeof call.rowCount === 'number' ? ` · ${call.rowCount} rows` : ''}
                    </p>
                    {call.errorCode && (
                      <p className="mt-0.5 text-brand-300">
                        {call.errorCode} {JSON.stringify(call.errorDetails ?? {})}
                      </p>
                    )}
                    {call.readableFields && (
                      <p className="mt-0.5 break-all text-white/35">{call.readableFields.join(', ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Block>
          </div>
        </aside>
      )}
    </>
  )
}

function Block({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-[0.14em] text-white/40">{title}</h3>
        {action}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

function Row({ label, value, wrap }: { label: string; value: string; wrap?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-1 last:border-b-0">
      <span className="shrink-0 text-white/40">{label}</span>
      <span className={clsx('text-right text-white', wrap && 'break-all')}>{value}</span>
    </div>
  )
}
