import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { Card, SkeletonCard } from '@/shared/ui/primitives'

/**
 * One number, one label, one way in. KPI cards answer "how big is my world today?" at a glance;
 * anything that needs a sentence belongs in a section below, not here.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
  loading,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  to?: string
  loading?: boolean
}) {
  if (loading) return <SkeletonCard />

  const body = (
    <Card interactive={Boolean(to)} className="h-full">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-muted">{label}</p>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-canvas text-ink-muted">
          <Icon size={16} strokeWidth={1.9} aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-metric font-semibold text-ink" data-numeric>
        {value}
      </p>
      {hint && <p className="mt-1 text-sm text-ink-subtle">{hint}</p>}
      {to && (
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
          Xem chi tiết
          <ArrowRight size={14} strokeWidth={2} aria-hidden />
        </span>
      )}
    </Card>
  )

  return to ? (
    <Link to={to} className="block h-full rounded-card focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  )
}

/** A titled panel with an optional "see all" link in the corner. */
export function SectionCard({
  title,
  description,
  icon: Icon,
  to,
  toLabel = 'Xem tất cả',
  children,
  className,
  padded = true,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  to?: string
  toLabel?: string
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <Card className={clsx('flex flex-col', className)} padded={false}>
      <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon && (
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-control bg-canvas text-ink-muted">
              <Icon size={15} strokeWidth={1.9} aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-md font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
        </div>
        {to && (
          <Link
            to={to}
            className="shrink-0 whitespace-nowrap text-sm font-medium text-brand-600 hover:underline"
          >
            {toLabel}
          </Link>
        )}
      </header>
      <div className={clsx('min-w-0 flex-1', padded && 'px-5 pb-5')}>{children}</div>
    </Card>
  )
}
