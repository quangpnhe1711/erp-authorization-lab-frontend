import { describe, expect, it } from 'vitest'
import type { NavModule, ScreenPermission } from '@/shared/api/types'
import { accessibleScreenCodes, can, canReadField, canUpdateField } from './hooks'
import { screenContextHeaders, SCREENS } from './screens'

const permission: ScreenPermission = {
  moduleKey: 'HRM',
  submoduleKey: 'EMPLOYEE',
  screenCode: 'MY_PROFILE',
  screenName: 'My Profile',
  screenAccess: true,
  allowedActions: ['READ', 'UPDATE'],
  recordScopes: ['SELF'],
  readableFieldGroups: ['PUBLIC_INFORMATION', 'CONTACT_INFORMATION'],
  creatableFieldGroups: [],
  updatableFieldGroups: ['CONTACT_INFORMATION'],
  readableFields: ['fullName', 'phoneNumber'],
  creatableFields: [],
  updatableFields: ['phoneNumber', 'personalEmail'],
  sourceRoles: ['EMPLOYEE'],
}

describe('permission helpers', () => {
  it('allows an action only when the screen is accessible and the action granted', () => {
    expect(can(permission, 'READ')).toBe(true)
    expect(can(permission, 'DELETE')).toBe(false)
    expect(can({ ...permission, screenAccess: false }, 'READ')).toBe(false)
    expect(can(undefined, 'READ')).toBe(false)
  })

  it('separates readable from updatable fields', () => {
    expect(canReadField(permission, 'fullName')).toBe(true)
    expect(canUpdateField(permission, 'fullName')).toBe(false)
    expect(canUpdateField(permission, 'phoneNumber')).toBe(true)
    // salary is neither readable nor updatable on MY_PROFILE
    expect(canReadField(permission, 'salary')).toBe(false)
    expect(canUpdateField(permission, 'salary')).toBe(false)
  })

  it('flattens the navigation tree into screen codes', () => {
    const navigation: NavModule[] = [
      {
        moduleKey: 'DASHBOARD',
        name: 'Dashboard',
        screens: [
          {
            moduleKey: 'DASHBOARD',
            submoduleKey: null,
            screenCode: 'DASHBOARD',
            name: 'Dashboard',
            routePath: '/dashboard',
            actions: ['READ'],
          },
        ],
        submodules: [],
      },
      {
        moduleKey: 'HRM',
        name: 'Human Resources',
        screens: [],
        submodules: [
          {
            submoduleKey: 'EMPLOYEE',
            name: 'Employee',
            screens: [
              {
                moduleKey: 'HRM',
                submoduleKey: 'EMPLOYEE',
                screenCode: 'EMPLOYEE_LIST',
                name: 'Employee List',
                routePath: '/hrm/employees',
                actions: ['READ'],
              },
            ],
          },
        ],
      },
    ]
    expect(accessibleScreenCodes(navigation)).toEqual(new Set(['DASHBOARD', 'EMPLOYEE_LIST']))
    expect(accessibleScreenCodes(undefined).size).toBe(0)
  })
})

describe('screen context headers', () => {
  it('always sends module + screen, and submodule only when the screen has one', () => {
    expect(screenContextHeaders(SCREENS.EMPLOYEE_LIST)).toEqual({
      'X-Module-Key': 'HRM',
      'X-Submodule-Key': 'EMPLOYEE',
      'X-Screen-Code': 'EMPLOYEE_LIST',
    })
    expect(screenContextHeaders(SCREENS.DASHBOARD)).toEqual({
      'X-Module-Key': 'DASHBOARD',
      'X-Screen-Code': 'DASHBOARD',
    })
  })

  it('gives the three EMPLOYEE_SEARCH callers three different contexts', () => {
    const contexts = [SCREENS.EMPLOYEE_LIST, SCREENS.MEMBER_LIST, SCREENS.EMPLOYEE_PICKER].map(
      (s) => screenContextHeaders(s)['X-Screen-Code'],
    )
    expect(new Set(contexts).size).toBe(3)
  })
})
