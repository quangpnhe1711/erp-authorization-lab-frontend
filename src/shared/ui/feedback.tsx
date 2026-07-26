import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { ApiError } from '@/shared/api/client'
import { Button } from './primitives'

type AlertTone = 'error' | 'warning' | 'info' | 'success'

const ALERT_TONES: Record<AlertTone, string> = {
  error: 'border-brand-500 bg-brand-50 text-brand-700',
  warning: 'border-amber-500 bg-amber-50 text-amber-800',
  info: 'border-line-strong bg-surface-raised text-ink-muted',
  success: 'border-emerald-500 bg-emerald-50 text-emerald-800',
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div role="alert" className={clsx('border-l-4 px-4 py-3 text-[13px]', ALERT_TONES[tone], className)}>
      {title && <p className="font-display text-[11px] font-bold uppercase tracking-label">{title}</p>}
      {children && <div className={clsx(title && 'mt-1')}>{children}</div>}
    </div>
  )
}

/** Renders a backend {@link ApiError} the way the spec describes it: code first, then message + details. */
export function ApiErrorPanel({ error, className }: { error: unknown; className?: string }) {
  if (!error) return null
  if (!(error instanceof ApiError)) {
    return (
      <Alert tone="error" title="Lỗi" className={className} data-testid="api-error">
        {error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.'}
      </Alert>
    )
  }
  const denied = error.deniedFields
  return (
    <div data-testid="api-error" data-error-code={error.code}>
      <Alert tone={error.status === 403 ? 'warning' : 'error'} title={error.code} className={className}>
        <p>{error.message}</p>
        {denied.length > 0 && (
          <p className="mt-1">
            Trường bị từ chối: <span className="font-mono text-[12px]">{denied.join(', ')}</span>
          </p>
        )}
        {error.requestId && <p className="mt-1 text-[11px] opacity-70">requestId: {error.requestId}</p>}
      </Alert>
    </div>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-16 animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx('w-full border border-line bg-white shadow-pop', wide ? 'max-w-4xl' : 'max-w-lg')}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-label">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Đóng">
            ✕
          </Button>
        </header>
        <div className="px-5 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</footer>}
      </div>
    </div>
  )
}
