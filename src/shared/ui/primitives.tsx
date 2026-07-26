import clsx from 'clsx'
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
} from 'react'
import { forwardRef } from 'react'
import type { LucideIcon } from 'lucide-react'

/* ------------------------------------------------------------------ buttons */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white shadow-card hover:bg-brand-600 active:bg-brand-700',
  secondary: 'border border-line-strong bg-white text-ink-secondary shadow-card hover:bg-surface-muted hover:text-ink',
  ghost: 'text-ink-muted hover:bg-line/70 hover:text-ink',
  danger: 'border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
  md: 'h-9 gap-2 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-5 text-base',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex select-none items-center justify-center rounded-control font-medium transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} aria-hidden />}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 14 : 16} strokeWidth={2} aria-hidden />}
    </button>
  )
})

/** Square icon-only button — used in toolbars and card headers. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }
>(function IconButton({ icon: Icon, label, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-grid h-9 w-9 place-items-center rounded-control text-ink-muted transition-colors',
        'hover:bg-line/70 hover:text-ink disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <Icon size={17} strokeWidth={1.9} aria-hidden />
    </button>
  )
})

/* -------------------------------------------------------------------- cards */

export function Card({
  children,
  className,
  padded = true,
  interactive = false,
  ...rest
}: HTMLAttributes<HTMLElement> & { padded?: boolean; interactive?: boolean }) {
  return (
    <section
      className={clsx(
        'rounded-card border border-line bg-surface shadow-card',
        padded && 'p-5',
        interactive && 'transition-shadow duration-200 hover:shadow-lift',
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  description,
  actions,
  icon: Icon,
  className,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  icon?: LucideIcon
  className?: string
}) {
  return (
    <header className={clsx('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-control bg-canvas text-ink-muted">
            <Icon size={16} strokeWidth={1.9} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-md font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  breadcrumb?: ReactNode
}) {
  return (
    <div className="mb-6">
      {breadcrumb && <div className="mb-2 text-sm text-ink-subtle">{breadcrumb}</div>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-base text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- badges */

export type BadgeTone = 'neutral' | 'brand' | 'positive' | 'caution' | 'info'

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'border-line-strong bg-surface-muted text-ink-muted',
  brand: 'border-brand-200 bg-brand-50 text-brand-600',
  positive: 'border-positive-500/25 bg-positive-50 text-positive-700',
  caution: 'border-caution-500/25 bg-caution-50 text-caution-700',
  info: 'border-info-500/25 bg-info-50 text-info-700',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        BADGE_TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ avatars */

const AVATAR_SIZES = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-14 w-14 text-base' }

/** Deterministic tint so the same person keeps the same colour across screens. */
const AVATAR_TINTS = [
  'bg-[#EEF2FF] text-[#4338CA]',
  'bg-[#ECFDF5] text-[#047857]',
  'bg-[#FEF3C7] text-[#B45309]',
  'bg-[#F1F5F9] text-[#334155]',
  'bg-[#FCE7F3] text-[#9D174D]',
  'bg-[#E0F2FE] text-[#0369A1]',
]

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: keyof typeof AVATAR_SIZES
  className?: string
}) {
  const label = initialsOf(name)
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-grid shrink-0 place-items-center rounded-full font-semibold',
        AVATAR_SIZES[size],
        AVATAR_TINTS[hash % AVATAR_TINTS.length],
        className,
      )}
    >
      {label}
    </span>
  )
}

function initialsOf(name: string): string {
  const words = name.trim().split(/[\s@._-]+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase()
}

/* ------------------------------------------------------------------- inputs */

/** The hint sits beside the label, not inside it, so it never becomes part of the field's name. */
export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-secondary">
        {children}
      </label>
      {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
    </div>
  )
}

const FIELD = clsx(
  'h-10 w-full rounded-control border border-line-strong bg-white px-3 text-base text-ink transition-colors',
  'placeholder:text-ink-subtle hover:border-ink-subtle/60',
  'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle',
)

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={clsx(FIELD, className)} {...props} />
})

/** Input with a leading icon — the search field pattern used in every toolbar. */
export const SearchInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }
>(function SearchInput({ icon: Icon, className, ...props }, ref) {
  return (
    <div className="relative">
      <Icon
        size={16}
        strokeWidth={1.9}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
      />
      <input ref={ref} className={clsx(FIELD, 'pl-9', className)} {...props} />
    </div>
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={clsx(FIELD, 'cursor-pointer pr-8', className)} {...props} />
})

export function Checkbox({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={clsx('inline-flex cursor-pointer select-none items-center gap-2 text-sm', className)}>
      <input
        type="checkbox"
        className="h-4 w-4 cursor-pointer rounded border-line-strong text-brand-500 accent-[#CE181E]"
        {...props}
      />
      <span className="text-ink-secondary">{label}</span>
    </label>
  )
}

/** iOS-style switch for settings that take effect immediately. */
export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  id?: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-brand-500' : 'bg-line-strong',
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

/* -------------------------------------------------------------------- table */

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('w-full border-collapse text-base', className)} {...props} />
    </div>
  )
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={clsx(
        'whitespace-nowrap border-b border-line bg-surface-muted px-4 py-2.5 text-left',
        'text-xs font-semibold text-ink-muted',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx('border-b border-line px-4 py-3 align-middle text-ink-secondary', className)} {...rest}>
      {children}
    </td>
  )
}

/* --------------------------------------------------------------------- tabs */

export interface TabDefinition {
  id: string
  label: string
  hint?: string
}

/** Underlined tabs — the quiet variant, so the red accent stays reserved for actions. */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabDefinition[]
  active: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div role="tablist" className={clsx('flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            data-testid={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            title={tab.hint}
            className={clsx(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-base transition-colors',
              selected
                ? 'border-brand-500 font-medium text-ink'
                : 'border-transparent text-ink-muted hover:border-line-strong hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ loading */

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-ink-muted" role="status">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-brand-500"
        aria-hidden
      />
      {label}
    </div>
  )
}

/** Skeletons keep the layout from jumping when data lands. */
export function SkeletonRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <div
              key={columnIndex}
              className="skeleton h-9 flex-1"
              style={{ opacity: 1 - rowIndex * 0.12, maxWidth: columnIndex === 0 ? '18rem' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('rounded-card border border-line bg-surface p-5 shadow-card', className)} aria-hidden>
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-4 h-8 w-32" />
      <div className="skeleton mt-3 h-3 w-40" />
    </div>
  )
}

/* --------------------------------------------------------------- key/value */

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-2.5">
      <dt className="text-xs text-ink-subtle">{label}</dt>
      <dd className="mt-0.5 text-base text-ink">{children}</dd>
    </div>
  )
}
