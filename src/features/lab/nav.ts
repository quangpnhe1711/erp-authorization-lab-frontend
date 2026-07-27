import {
  FlaskConical,
  Grid3x3,
  Layers,
  ListTree,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Users,
} from 'lucide-react'
import type { NavSection } from '@/shared/navigation/businessNav'

/**
 * The Authorization Lab section. Unlike the business sections it is a fixed list: these screens
 * configure the permission model, so they are not themselves entries in it.
 */
export const LAB_SECTION: NavSection = {
  id: 'lab',
  label: 'Authorization Lab',
  icon: FlaskConical,
  items: [
    { screenCode: 'LAB_DASHBOARD', label: 'Tổng quan cấu hình', to: '/lab', icon: Grid3x3 },
    { screenCode: 'LAB_USERS', label: 'Người dùng & vai trò', to: '/lab/users', icon: Users },
    { screenCode: 'LAB_ROLES', label: 'Vai trò', to: '/lab/roles', icon: ShieldCheck },
    { screenCode: 'LAB_MODULES', label: 'Module & màn hình', to: '/lab/modules', icon: ListTree },
    { screenCode: 'LAB_FIELDS', label: 'Danh mục field', to: '/lab/fields', icon: Tags },
    { screenCode: 'LAB_FIELD_GROUPS', label: 'Nhóm field', to: '/lab/field-groups', icon: Layers },
    {
      screenCode: 'LAB_PERMISSIONS',
      label: 'Cấu hình quyền',
      to: '/lab/permissions',
      icon: SlidersHorizontal,
      description: 'Truy cập màn, hành động và quyền theo nhóm field',
    },
    {
      screenCode: 'LAB_EXPLORER',
      label: 'Tra cứu quyền hiệu lực',
      to: '/lab/explorer',
      icon: FlaskConical,
      description: 'Vì sao một user có hoặc không có một quyền',
    },
    { screenCode: 'LAB_AUDIT', label: 'Lịch sử thay đổi', to: '/lab/audit', icon: ScrollText },
  ],
}
