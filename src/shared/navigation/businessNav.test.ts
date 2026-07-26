import { describe, expect, it } from 'vitest'
import type { NavModule } from '@/shared/api/types'
import { SCREEN_LABELS, grantedActions, grantedScreens, visibleSections } from './businessNav'

function nav(screens: { code: string; actions?: string[] }[]): NavModule[] {
  return [
    {
      moduleKey: 'HRM',
      name: 'Human Resources',
      screens: [],
      submodules: [
        {
          submoduleKey: 'EMPLOYEE',
          name: 'Employee',
          screens: screens.map((entry) => ({
            moduleKey: 'HRM',
            submoduleKey: 'EMPLOYEE',
            screenCode: entry.code,
            name: entry.code,
            routePath: '/x',
            actions: entry.actions ?? ['READ'],
          })),
        },
      ],
    },
  ]
}

describe('business navigation', () => {
  it('shows a menu entry only when the server granted that screen', () => {
    const sections = visibleSections(nav([{ code: 'EMPLOYEE_LIST' }, { code: 'MY_PROFILE' }]))
    const labels = sections.flatMap((section) => section.items.map((item) => item.label))
    expect(labels).toContain('Nhân viên')
    expect(labels).toContain('Hồ sơ của tôi')
    expect(labels).not.toContain('Lương')
    expect(labels).not.toContain('Người dùng')
  })

  it('drops a whole section when none of its entries were granted', () => {
    const sections = visibleSections(nav([{ code: 'EMPLOYEE_LIST' }]))
    expect(sections.map((section) => section.id)).not.toContain('admin')
    expect(sections.map((section) => section.id)).not.toContain('activity')
  })

  it('reads the actions granted on one screen', () => {
    const tree = nav([{ code: 'EMPLOYEE_CREATE', actions: ['READ', 'CREATE'] }])
    expect(grantedActions(tree, 'EMPLOYEE_CREATE')).toEqual(['READ', 'CREATE'])
    expect(grantedActions(tree, 'SALARY_LIST')).toEqual([])
  })

  it('flattens granted screen codes', () => {
    expect(grantedScreens(nav([{ code: 'EMPLOYEE_LIST' }]))).toEqual(new Set(['EMPLOYEE_LIST']))
    expect(grantedScreens(undefined).size).toBe(0)
  })

  it('gives every screen a business name instead of its code', () => {
    expect(SCREEN_LABELS.EMPLOYEE_PICKER).toBe('Chọn người thêm vào dự án')
    expect(SCREEN_LABELS.FIELD_GROUP_PERMISSION_CONFIG).toBe('Quyền xem thông tin')
    // No label may leak the raw constant.
    for (const [code, label] of Object.entries(SCREEN_LABELS)) expect(label).not.toBe(code)
  })
})
