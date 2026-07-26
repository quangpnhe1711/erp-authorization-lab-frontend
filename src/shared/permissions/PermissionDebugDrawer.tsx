import { useState } from 'react'
import clsx from 'clsx'
import { useAuth } from '@/shared/auth/AuthProvider'
import { Badge, Button } from '@/shared/ui/primitives'
import { formatDateTime } from '@/shared/format'
import { useActiveScreen } from './activeScreen'
import { clearApiCalls, useApiCalls } from './debugStore'
import { FIELD_GROUP_LABELS, screenContextHeaders } from './screens'

/**
 * Permission debug drawer (spec §20): the headers actually sent, the API use-case, the merged
 * permission the server computed, and the last decisions — so a demo can explain *why* a row or a
 * field is missing instead of leaving it to guesswork.
 */
export function PermissionDebugDrawer() {
  const [open, setOpen] = useState(false)
  const { screen, permission } = useActiveScreen()
  const { me } = useAuth()
  const calls = useApiCalls()
  const screenCalls = calls.filter((c) => c.screen?.screenCode === screen.screenCode)
  const headers = screenContextHeaders(screen)
  const lastError = screenCalls.find((c) => c.errorCode)

  return (
    <>
      <Button
        variant={lastError ? 'danger' : 'secondary'}
        size="sm"
        onClick={() => setOpen((v) => !v)}
        data-testid="permission-debug-toggle"
        className="fixed bottom-5 right-5 z-40 shadow-pop"
        aria-expanded={open}
      >
        {lastError ? `⚠ ${lastError.errorCode}` : 'Permission debug'}
      </Button>

      {open && (
        <aside
          data-testid="permission-debug-drawer"
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-line bg-white shadow-pop animate-slide-in"
        >
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="rule-accent">
              <p className="eyebrow">Permission trace</p>
              <h2 className="text-sm font-bold uppercase tracking-tight">{screen.screenCode}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Đóng">
              ✕
            </Button>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 text-[13px]">
            <Section title="Screen context headers">
              <dl className="space-y-1 font-mono text-[12px]">
                {Object.entries(headers).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3 border-b border-line py-1">
                    <dt className="text-ink-faint">{key}</dt>
                    <dd className="text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section title="Identity">
              <p className="text-ink-muted">{me?.username}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(me?.roles ?? []).map((role) => (
                  <Badge key={role} tone="brand">
                    {role}
                  </Badge>
                ))}
              </div>
            </Section>

            <Section title="Effective permission">
              <Row label="Screen access">
                <Badge tone={permission?.screenAccess ? 'success' : 'warning'}>
                  {permission?.screenAccess ? 'ALLOW' : 'DENY'}
                </Badge>
              </Row>
              <Row label="Actions">
                <ChipList values={permission?.allowedActions} />
              </Row>
              <Row label="Record scopes">
                <ChipList values={permission?.recordScopes} tone="brand" />
              </Row>
              <Row label="Readable groups">
                <ChipList values={permission?.readableFieldGroups?.map((g) => FIELD_GROUP_LABELS[g] ?? g)} />
              </Row>
              <Row label="Updatable groups">
                <ChipList values={permission?.updatableFieldGroups?.map((g) => FIELD_GROUP_LABELS[g] ?? g)} />
              </Row>
              <Row label="Source roles">
                <ChipList values={permission?.sourceRoles} tone="muted" />
              </Row>
              <Row label="Readable fields">
                <p className="font-mono text-[11px] leading-5 text-ink-muted">
                  {permission?.readableFields.join(', ') || '—'}
                </p>
              </Row>
            </Section>

            <Section
              title="API calls from this screen"
              action={
                <button
                  type="button"
                  onClick={clearApiCalls}
                  className="font-display text-[10px] uppercase tracking-label text-ink-faint hover:text-brand-500"
                >
                  Xoá
                </button>
              }
            >
              {screenCalls.length === 0 && <p className="text-ink-faint">Chưa có request nào.</p>}
              <ul className="space-y-3">
                {screenCalls.map((call) => (
                  <li
                    key={`${call.at}-${call.url}`}
                    className={clsx('border-l-2 pl-3', call.errorCode ? 'border-brand-500' : 'border-line-strong')}
                  >
                    <p className="font-mono text-[11px] text-ink">
                      {call.method} {call.url}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                      <Badge tone={call.errorCode ? 'brand' : 'success'}>{call.status}</Badge>
                      {call.apiCode && <span className="font-mono">{call.apiCode}</span>}
                      {typeof call.rowCount === 'number' && <span>{call.rowCount} dòng</span>}
                      <span>{formatDateTime(new Date(call.at).toISOString())}</span>
                    </p>
                    {call.errorCode && (
                      <p className="mt-1 font-mono text-[11px] text-brand-600">
                        {call.errorCode} {JSON.stringify(call.errorDetails ?? {})}
                      </p>
                    )}
                    {call.readableFields && (
                      <p className="mt-1 font-mono text-[10px] leading-4 text-ink-faint">
                        readableFields: {call.readableFields.join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </aside>
      )}
    </>
  )
}

function Section({
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
        <h3 className="eyebrow">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <span className="shrink-0 font-display text-[10px] uppercase tracking-label text-ink-faint">{label}</span>
      <div className="flex flex-wrap justify-end gap-1">{children}</div>
    </div>
  )
}

function ChipList({ values, tone = 'neutral' }: { values?: string[]; tone?: 'neutral' | 'brand' | 'muted' }) {
  if (!values || values.length === 0) return <span className="text-ink-faint">—</span>
  return (
    <>
      {values.map((value) => (
        <Badge key={value} tone={tone}>
          {value}
        </Badge>
      ))}
    </>
  )
}
