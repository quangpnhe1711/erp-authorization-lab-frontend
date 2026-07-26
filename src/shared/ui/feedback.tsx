import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  SearchX,
  ServerCrash,
  X,
  type LucideIcon,
} from 'lucide-react'
import { ApiError } from '@/shared/api/client'
import { useDeveloperMode } from '@/shared/devmode/DeveloperModeProvider'
import { FIELD_LABELS } from '@/shared/permissions/screens'
import { Button, IconButton } from './primitives'

/* -------------------------------------------------------------------- alert */

type AlertTone = 'error' | 'caution' | 'info' | 'success'

const ALERT: Record<AlertTone, { className: string; icon: LucideIcon }> = {
  error: { className: 'border-brand-200 bg-brand-50 text-brand-700', icon: AlertTriangle },
  caution: { className: 'border-caution-500/25 bg-caution-50 text-caution-700', icon: AlertTriangle },
  info: { className: 'border-info-500/25 bg-info-50 text-info-700', icon: Info },
  success: { className: 'border-positive-500/25 bg-positive-50 text-positive-700', icon: CheckCircle2 },
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
  onDismiss,
}: {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  className?: string
  onDismiss?: () => void
}) {
  const { className: toneClass, icon: Icon } = ALERT[tone]
  return (
    <div role="alert" className={clsx('flex gap-3 rounded-card border px-4 py-3 text-sm', toneClass, className)}>
      <Icon size={17} strokeWidth={1.9} aria-hidden className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={clsx(title && 'mt-0.5')}>{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Đóng thông báo" className="shrink-0 opacity-60 hover:opacity-100">
          <X size={15} strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- empty/error */

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={clsx('flex flex-col items-center text-center', compact ? 'px-6 py-10' : 'px-6 py-16')}>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-canvas text-ink-subtle">
        <Icon size={22} strokeWidth={1.6} aria-hidden />
      </span>
      <p className="mt-4 text-md font-semibold text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-md text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/**
 * Human-readable failure. Every backend error code is translated into a sentence that says what
 * happened and what to do next; the code itself only surfaces in developer mode.
 */
const ERROR_COPY: Record<string, { title: string; body: string; icon: LucideIcon }> = {
  SCREEN_ACCESS_DENIED: {
    title: 'Bạn chưa được cấp quyền vào mục này',
    body: 'Nếu đây là công việc của bạn, hãy nhờ quản trị viên bổ sung quyền cho tài khoản.',
    icon: Lock,
  },
  ACTION_PERMISSION_DENIED: {
    title: 'Bạn không thực hiện được thao tác này',
    body: 'Tài khoản của bạn chỉ được xem nội dung này. Liên hệ quản trị viên nếu cần chỉnh sửa.',
    icon: Lock,
  },
  RECORD_PERMISSION_DENIED: {
    title: 'Hồ sơ này nằm ngoài phạm vi của bạn',
    body: 'Bạn chỉ xem được dữ liệu thuộc nhóm hoặc bộ phận mình phụ trách.',
    icon: Lock,
  },
  FIELD_PERMISSION_DENIED: {
    title: 'Một vài thông tin bạn không được sửa',
    body: 'Thay đổi chưa được lưu. Hãy bỏ các thông tin bị khoá rồi lưu lại.',
    icon: Lock,
  },
  SCREEN_API_MAPPING_DENIED: {
    title: 'Không mở được nội dung từ màn hình này',
    body: 'Hãy quay lại và mở đúng mục trong thanh điều hướng.',
    icon: AlertTriangle,
  },
  RESOURCE_NOT_FOUND: {
    title: 'Không tìm thấy nội dung',
    body: 'Nội dung có thể đã bị xoá hoặc đường dẫn không còn đúng.',
    icon: SearchX,
  },
  CONFLICT: {
    title: 'Dữ liệu bị trùng',
    body: 'Một bản ghi khác đã dùng giá trị này. Hãy đổi rồi thử lại.',
    icon: AlertTriangle,
  },
  VALIDATION_ERROR: {
    title: 'Thông tin chưa hợp lệ',
    body: 'Kiểm tra lại các ô đang báo lỗi rồi gửi lại.',
    icon: AlertTriangle,
  },
  UNAUTHENTICATED: {
    title: 'Phiên đăng nhập đã hết hạn',
    body: 'Đăng nhập lại để tiếp tục công việc.',
    icon: Lock,
  },
}

const FALLBACK = {
  title: 'Không tải được nội dung',
  body: 'Đã có lỗi xảy ra. Thử lại sau ít phút, nếu vẫn lỗi hãy báo bộ phận hỗ trợ.',
  icon: ServerCrash,
}

export function humanizeError(error: unknown): { title: string; body: string; icon: LucideIcon } {
  if (error instanceof ApiError) return ERROR_COPY[error.code] ?? FALLBACK
  return FALLBACK
}

/** Full-panel failure — use when the screen has nothing else to show. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { developerMode } = useDeveloperMode()
  const { title, body, icon } = humanizeError(error)
  const api = error instanceof ApiError ? error : null
  return (
    <div data-testid="error-state" data-error-code={api?.code ?? 'UNKNOWN'}>
      <EmptyState
        icon={icon}
        title={title}
        description={body}
        action={onRetry ? <Button variant="secondary" onClick={onRetry}>Thử lại</Button> : undefined}
      />
      {developerMode && api && (
        <pre className="dev-surface mx-6 mb-6 overflow-x-auto rounded-card p-3">
          {api.code} · HTTP {api.status}
          {'\n'}
          {api.message}
          {api.requestId ? `\nrequestId: ${api.requestId}` : ''}
          {Object.keys(api.details).length ? `\ndetails: ${JSON.stringify(api.details)}` : ''}
        </pre>
      )}
    </div>
  )
}

/** Inline failure — use beside a form or above a table that still has content. */
export function ErrorNotice({ error, className }: { error: unknown; className?: string }) {
  const { developerMode } = useDeveloperMode()
  if (!error) return null
  const { title, body } = humanizeError(error)
  const api = error instanceof ApiError ? error : null
  // The backend names fields the way the database does; the notice names them the way the form does.
  const deniedLabels = api?.deniedFields.map((field) => FIELD_LABELS[field] ?? field)

  return (
    <div data-testid="error-notice" data-error-code={api?.code ?? 'UNKNOWN'} className={className}>
      <Alert tone={api?.status === 403 ? 'caution' : 'error'} title={title}>
        <p>{body}</p>
        {deniedLabels?.length ? <p className="mt-1">Thông tin bị khoá: {deniedLabels.join(', ')}</p> : null}
        {developerMode && api && (
          <p className="mt-1.5 font-mono text-xs opacity-80">
            {api.code} · {api.message}
            {api.requestId ? ` · ${api.requestId}` : ''}
          </p>
        )}
      </Alert>
    </div>
  )
}

/* -------------------------------------------------------------------- modal */

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  const width = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 p-4 pt-[8vh] backdrop-blur-[2px] animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx('w-full rounded-panel border border-line bg-surface shadow-overlay animate-rise-in', width)}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-md font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          <IconButton icon={X} label="Đóng" onClick={onClose} />
        </header>
        <div className="px-5 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</footer>}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- toast */

/** Transient confirmation. Uses the same verb as the button that triggered it. */
export function Toast({
  open,
  message,
  tone = 'success',
  onClose,
}: {
  open: boolean
  message: string
  tone?: AlertTone
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(onClose, 4000)
    return () => window.clearTimeout(timer)
  }, [open, onClose])

  if (!open) return null
  const { className, icon: Icon } = ALERT[tone]
  return (
    <div
      role="status"
      data-testid="toast"
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-rise-in"
    >
      <div
        className={clsx(
          'pointer-events-auto flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm shadow-lift',
          className,
        )}
      >
        <Icon size={16} strokeWidth={2} aria-hidden />
        {message}
        <button type="button" onClick={onClose} aria-label="Đóng" className="ml-1 opacity-60 hover:opacity-100">
          <X size={14} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  )
}
