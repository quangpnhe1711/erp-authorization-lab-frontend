import type { AuditLogRow } from '@/shared/api/types'

/**
 * Turns an audit row into a sentence. The log stores machine actions (`ROLE_ASSIGN`); people read
 * events ("Đã gán vai trò cho một tài khoản"). Anything unmapped falls back to a neutral phrasing
 * rather than leaking the raw constant.
 */
const ACTION_PHRASES: Record<string, string> = {
  LOGIN: 'đã đăng nhập',
  LOGOUT: 'đã đăng xuất',
  TOKEN_REFRESH: 'đã gia hạn phiên làm việc',
  EMPLOYEE_CREATE: 'đã thêm một nhân viên mới',
  EMPLOYEE_UPDATE: 'đã cập nhật hồ sơ nhân viên',
  ROLE_ASSIGN: 'đã gán vai trò cho một tài khoản',
  ROLE_REVOKE: 'đã gỡ vai trò của một tài khoản',
  ROLE_PERMISSION_UPDATE: 'đã thay đổi quyền của một vai trò',
  RESPONSIBILITY_ASSIGN: 'đã phân công phụ trách',
  RESPONSIBILITY_REVOKE: 'đã gỡ phân công phụ trách',
  PROJECT_MEMBER_ASSIGN: 'đã thêm thành viên vào dự án',
}

export function describeActivity(row: AuditLogRow): string {
  const who = row.username ?? 'Một tài khoản'
  const phrase = ACTION_PHRASES[row.action] ?? 'đã thực hiện một thao tác'
  return `${who} ${phrase}`
}

/** Short, human phrasing for the action itself — used as a table cell or filter label. */
export function activityLabel(action: string): string {
  const phrase = ACTION_PHRASES[action]
  if (!phrase) return 'Thao tác khác'
  return phrase.charAt(0).toUpperCase() + phrase.slice(1)
}

export const ACTIVITY_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả hoạt động' },
  { value: 'LOGIN', label: 'Đăng nhập' },
  { value: 'EMPLOYEE_UPDATE', label: 'Cập nhật hồ sơ' },
  { value: 'EMPLOYEE_CREATE', label: 'Thêm nhân viên' },
  { value: 'ROLE_ASSIGN', label: 'Gán vai trò' },
  { value: 'ROLE_PERMISSION_UPDATE', label: 'Đổi quyền vai trò' },
  { value: 'RESPONSIBILITY_ASSIGN', label: 'Phân công phụ trách' },
]

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

const relative = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })

export function relativeTime(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return '—'
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return '—'
  const seconds = Math.round((time - now) / 1000)
  if (Math.abs(seconds) < 45) return 'vừa xong'
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return relative.format(Math.round(seconds / 60), 'minute')
}
