import {
  Building2,
  CalendarClock,
  FolderKanban,
  Gauge,
  IdCard,
  KeyRound,
  LayoutGrid,
  ScrollText,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { NavModule } from '@/shared/api/types'

/**
 * The sidebar is organised by what people do, not by how the system is built.
 *
 * The server still decides *whether* an entry appears — an item is rendered only when its screen
 * came back from GET /api/me/navigation. This table only decides how those screens are named and
 * grouped, so "EMPLOYEE_LIST" reaches the user as "Nhân viên" under "Con người".
 */
export interface NavItem {
  /** Screen the entry opens; used to check the server actually granted it. */
  screenCode: string
  label: string
  to: string
  icon: LucideIcon
  description?: string
}

export interface NavSection {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'work',
    label: 'Công việc',
    icon: Gauge,
    items: [
      { screenCode: 'DASHBOARD', label: 'Tổng quan', to: '/dashboard', icon: Gauge },
      { screenCode: 'MY_PROFILE', label: 'Hồ sơ của tôi', to: '/hrm/my-profile', icon: IdCard },
    ],
  },
  {
    id: 'people',
    label: 'Con người',
    icon: Users,
    items: [
      {
        screenCode: 'EMPLOYEE_LIST',
        label: 'Nhân viên',
        to: '/hrm/employees',
        icon: Users,
        description: 'Danh bạ và hồ sơ nhân sự',
      },
      {
        screenCode: 'SALARY_LIST',
        label: 'Lương',
        to: '/hrm/salaries',
        icon: Wallet,
        description: 'Bảng lương theo kỳ',
      },
    ],
  },
  {
    id: 'delivery',
    label: 'Dự án',
    icon: FolderKanban,
    items: [
      {
        screenCode: 'PROJECT_LIST',
        label: 'Dự án',
        to: '/projects',
        icon: FolderKanban,
        description: 'Dự án và thành viên tham gia',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Quản trị',
    icon: ShieldCheck,
    items: [
      {
        screenCode: 'USER_MANAGEMENT',
        label: 'Người dùng',
        to: '/admin/users',
        icon: Users,
        description: 'Tài khoản đăng nhập',
      },
      {
        screenCode: 'USER_ROLE_ASSIGNMENT',
        label: 'Phân vai trò',
        to: '/admin/user-roles',
        icon: KeyRound,
        description: 'Ai giữ vai trò nào',
      },
      {
        screenCode: 'SCREEN_PERMISSION_CONFIG',
        label: 'Quyền theo vai trò',
        to: '/admin/access',
        icon: ShieldCheck,
        description: 'Vai trò được vào đâu, làm được gì, xem được ai',
      },
      {
        screenCode: 'RESPONSIBILITY_ASSIGNMENT',
        label: 'Phân công phụ trách',
        to: '/admin/responsibilities',
        icon: CalendarClock,
        description: 'Phòng ban, nhóm và dự án mỗi người phụ trách',
      },
      {
        screenCode: 'MODULE_MANAGEMENT',
        label: 'Danh mục hệ thống',
        to: '/admin/catalog',
        icon: LayoutGrid,
        description: 'Phân hệ, màn hình và nhóm thông tin',
      },
      {
        screenCode: 'PERMISSION_DECISION_TRACE',
        label: 'Kiểm tra quyền hiệu lực',
        to: '/admin/effective-permissions',
        icon: ShieldCheck,
        description: 'Vì sao user được hoặc không được một quyền',
      },
    ],
  },
  {
    id: 'activity',
    label: 'Nhật ký',
    icon: ScrollText,
    items: [
      {
        screenCode: 'AUDIT_LOG_LIST',
        label: 'Hoạt động',
        to: '/activity',
        icon: ScrollText,
        description: 'Ai đã làm gì, khi nào',
      },
    ],
  },
]

/**
 * Business names for every screen, used wherever an administrator has to reason about areas of the
 * product — the permission matrix, the catalogue. `EMPLOYEE_PICKER` means nothing to an HR manager;
 * "Chọn người thêm vào dự án" does.
 */
export const SCREEN_LABELS: Record<string, string> = {
  DASHBOARD: 'Tổng quan',
  MY_PROFILE: 'Hồ sơ cá nhân',
  EMPLOYEE_LIST: 'Danh sách nhân viên',
  EMPLOYEE_DETAIL: 'Hồ sơ nhân viên',
  EMPLOYEE_CREATE: 'Thêm nhân viên',
  EMPLOYEE_EDIT: 'Chỉnh sửa nhân viên',
  SALARY_LIST: 'Bảng lương',
  PROJECT_LIST: 'Danh sách dự án',
  PROJECT_DETAIL: 'Chi tiết dự án',
  MEMBER_LIST: 'Thành viên dự án',
  EMPLOYEE_PICKER: 'Chọn người thêm vào dự án',
  USER_MANAGEMENT: 'Người dùng',
  ROLE_MANAGEMENT: 'Vai trò',
  MODULE_MANAGEMENT: 'Phân hệ',
  SUBMODULE_MANAGEMENT: 'Nhóm chức năng',
  SCREEN_MANAGEMENT: 'Màn hình',
  SCREEN_PERMISSION_CONFIG: 'Quyền truy cập',
  RECORD_SCOPE_CONFIG: 'Phạm vi dữ liệu',
  FIELD_GROUP_CONFIG: 'Nhóm thông tin',
  FIELD_GROUP_PERMISSION_CONFIG: 'Quyền xem thông tin',
  USER_ROLE_ASSIGNMENT: 'Phân vai trò',
  RESPONSIBILITY_ASSIGNMENT: 'Phân công phụ trách',
  AUDIT_LOG_LIST: 'Nhật ký hoạt động',
  PERMISSION_DECISION_TRACE: 'Nhật ký kiểm tra quyền',
}

/** Business names for the module a screen belongs to. */
export const MODULE_LABELS: Record<string, string> = {
  DASHBOARD: 'Tổng quan',
  HRM: 'Nhân sự',
  PROJECT: 'Dự án',
  ADMINISTRATION: 'Quản trị',
  AUDIT: 'Nhật ký',
}

export const ACTION_LABELS: Record<string, string> = {
  READ: 'Xem',
  CREATE: 'Thêm',
  UPDATE: 'Sửa',
  DELETE: 'Xoá',
}

/** Record scopes, said the way a manager would say them. */
export const SCOPE_LABELS: Record<string, { label: string; hint: string }> = {
  NONE: { label: 'Không ai', hint: 'Không nhìn thấy bản ghi nào' },
  SELF: { label: 'Chính mình', hint: 'Chỉ hồ sơ của bản thân' },
  TEAM: { label: 'Nhóm', hint: 'Nhóm của mình, gồm cả bản thân' },
  DEPARTMENT: { label: 'Phòng ban', hint: 'Phòng ban của mình, gồm cả bản thân' },
  RESPONSIBILITY: { label: 'Được phân công', hint: 'Bộ phận, nhóm hoặc dự án được giao phụ trách' },
  ALL: { label: 'Toàn công ty', hint: 'Toàn bộ bản ghi' },
}

/** Screens the server granted, flattened to a set of codes. */
export function grantedScreens(navigation: NavModule[] | undefined): Set<string> {
  const codes = new Set<string>()
  for (const mod of navigation ?? []) {
    for (const screen of mod.screens) codes.add(screen.screenCode)
    for (const sub of mod.submodules) for (const screen of sub.screens) codes.add(screen.screenCode)
  }
  return codes
}

/** Actions the server granted on one screen, e.g. to decide whether "Thêm nhân viên" appears. */
export function grantedActions(navigation: NavModule[] | undefined, screenCode: string): string[] {
  for (const mod of navigation ?? []) {
    for (const screen of [...mod.screens, ...mod.submodules.flatMap((s) => s.screens)]) {
      if (screen.screenCode === screenCode) return screen.actions
    }
  }
  return []
}

/** Sections with their unavailable entries removed; empty sections drop out entirely. */
export function visibleSections(navigation: NavModule[] | undefined): NavSection[] {
  const granted = grantedScreens(navigation)
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => granted.has(item.screenCode)),
  })).filter((section) => section.items.length > 0)
}

export { Building2 }
