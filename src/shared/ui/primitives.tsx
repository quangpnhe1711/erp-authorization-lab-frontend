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

/* Luvina house style: square corners, hairline borders, one strong red, generous whitespace. */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-200',
  secondary: 'border border-line-strong bg-white text-ink hover:border-ink hover:text-ink',
  ghost: 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
  danger: 'border border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[11px]',
  md: 'h-10 px-5 text-xs',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-label transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    />
  )
})

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section
      className={clsx('border border-line bg-white shadow-card', padded && 'p-6', className)}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
      <div className="rule-accent">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-[13px] text-ink-faint">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="rule-accent">
        <p className="eyebrow mb-1">{eyebrow}</p>
        <h1 className="text-2xl font-extrabold uppercase leading-none tracking-tight">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-[13px] text-ink-faint">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'muted'

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'border-line-strong bg-white text-ink-muted',
  brand: 'border-brand-500 bg-brand-50 text-brand-600',
  success: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-500 bg-amber-50 text-amber-700',
  muted: 'border-line bg-surface-sunken text-ink-faint',
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
        'inline-flex items-center border px-2 py-[3px] font-display text-[10px] font-semibold uppercase tracking-label',
        BADGE_TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}

export function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-label text-ink-faint"
    >
      {children}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(
        'h-10 w-full border border-line-strong bg-white px-3 text-sm text-ink transition-colors',
        'placeholder:text-ink-faint/60 focus:border-brand-500',
        'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-faint',
        className,
      )}
      {...props}
    />
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={clsx(
        'h-10 w-full border border-line-strong bg-white px-3 text-sm text-ink transition-colors',
        'focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-surface-sunken',
        className,
      )}
      {...props}
    />
  )
})

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto border border-line bg-white">
      <table className={clsx('w-full border-collapse text-sm', className)} {...props} />
    </div>
  )
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={clsx(
        'whitespace-nowrap border-b border-line bg-surface-sunken px-4 py-3 text-left',
        'font-display text-[10px] font-semibold uppercase tracking-label text-ink-faint',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx('border-b border-line px-4 py-3 align-top text-ink-soft', className)} {...rest}>
      {children}
    </td>
  )
}

export function Spinner({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-ink-faint" role="status">
      <span className="h-4 w-4 animate-spin border-2 border-line-strong border-t-brand-500" aria-hidden />
      {label}
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="border border-dashed border-line-strong bg-surface-raised px-6 py-12 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-label text-ink-faint">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-md text-[13px] text-ink-faint">{hint}</p>}
    </div>
  )
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-line py-2.5 last:border-b-0">
      <dt className="font-display text-[10px] font-semibold uppercase tracking-label text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm text-ink-soft">{children}</dd>
    </div>
  )
}
