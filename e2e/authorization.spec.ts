import { expect, test } from '@playwright/test'
import { columnHeaders, login, logout, rowCount, USERS } from './helpers'

/**
 * These mirror docs/DEMO_SCENARIOS: each test states a permission rule and checks the UI reflects
 * what the backend actually returned — no mocks, no fixtures.
 */

test.describe('Scenario 1 — record scope decides the row set', () => {
  test('EMPLOYEE sees only their own team', async ({ page }) => {
    await login(page, USERS.employee)
    await page.getByTestId('nav-EMPLOYEE_LIST').click()

    await expect(page.getByTestId('scope-list')).toContainText('TEAM')
    expect(await rowCount(page, 'employee-table')).toBe(3)
  })

  test('HR_ADMIN sees every employee', async ({ page }) => {
    await login(page, USERS.admin)
    await page.goto('/hrm/employees')

    await expect(page.getByTestId('scope-list')).toContainText('ALL')
    expect(await rowCount(page, 'employee-table')).toBe(8)
  })

  test('multi-role sees the UNION of TEAM and RESPONSIBILITY, not the larger of the two', async ({ page }) => {
    await login(page, USERS.multiRole)
    await page.goto('/hrm/employees')

    const scopes = page.getByTestId('scope-list')
    await expect(scopes).toContainText('TEAM')
    await expect(scopes).toContainText('RESPONSIBILITY')
    // Frontend team (3, own team) ∪ Backend team (3, responsibility) = 6
    expect(await rowCount(page, 'employee-table')).toBe(6)
  })
})

test.describe('Scenario 2 — field groups decide the column set', () => {
  test('EMPLOYEE gets public + organization columns and no salary', async ({ page }) => {
    await login(page, USERS.employee)
    await page.goto('/hrm/employees')

    const headers = await columnHeaders(page, 'employee-table')
    expect(headers).toContain('Mã nhân viên')
    expect(headers).toContain('Phòng ban')
    expect(headers).not.toContain('Lương')
    expect(headers).not.toContain('Email cá nhân')
  })

  test('HR_ADMIN additionally gets the sensitive salary column', async ({ page }) => {
    await login(page, USERS.admin)
    await page.goto('/hrm/employees')

    const headers = await columnHeaders(page, 'employee-table')
    expect(headers.some((h) => h.startsWith('Lương'))).toBe(true)
    expect(headers).toContain('Email cá nhân')
  })
})

test.describe('Scenario 3 — one API, three screens, three answers', () => {
  test('EMPLOYEE_SEARCH returns a different result per screen context', async ({ page }) => {
    await login(page, USERS.manager)

    await page.goto('/hrm/employees')
    await expect(page.getByTestId('scope-list')).toContainText('TEAM')
    const listRows = await rowCount(page, 'employee-table')
    const listHeaders = await columnHeaders(page, 'employee-table')

    await page.goto('/projects/1/members/add')
    await expect(page.getByTestId('scope-list')).toContainText('DEPARTMENT')
    const pickerRows = await rowCount(page, 'picker-table')

    expect(listRows).toBe(3)
    expect(pickerRows).toBe(6)
    // EMPLOYEE_LIST grants CONTACT_INFORMATION to a manager; EMPLOYEE_PICKER does not.
    expect(listHeaders).toContain('Email cá nhân')
    expect(await columnHeaders(page, 'picker-table')).not.toContain('Email cá nhân')
  })

  test('MEMBER_LIST mixes employee and project field groups', async ({ page }) => {
    await login(page, USERS.manager)
    await page.goto('/projects/1/members')

    const headers = await columnHeaders(page, 'member-table')
    expect(headers).toContain('Họ và tên')
    expect(headers).toContain('Vai trò trong dự án')
    expect(headers).not.toContain('Lương')
    expect(await rowCount(page, 'member-table')).toBe(3)
  })
})

test.describe('Scenario 4 — screen access is enforced, not hidden', () => {
  test('a screen outside the role is blocked even when reached by URL', async ({ page }) => {
    await login(page, USERS.employee)

    await expect(page.getByTestId('nav-SALARY_LIST')).toHaveCount(0)
    await page.goto('/hrm/salaries')
    await expect(page.getByTestId('screen-access-denied')).toHaveAttribute(
      'data-error-code',
      'SCREEN_ACCESS_DENIED',
    )

    await page.goto('/admin/users')
    await expect(page.getByTestId('screen-access-denied')).toBeVisible()
  })

  test('the sidebar only lists screens the server granted', async ({ page }) => {
    await login(page, USERS.employee)
    await expect(page.getByTestId('nav-EMPLOYEE_LIST')).toBeVisible()
    await expect(page.getByTestId('nav-MY_PROFILE')).toBeVisible()
    await expect(page.getByTestId('nav-USER_MANAGEMENT')).toHaveCount(0)
    await expect(page.getByTestId('nav-AUDIT_LOG_LIST')).toHaveCount(0)

    await logout(page)
    await login(page, USERS.admin)
    await expect(page.getByTestId('nav-SALARY_LIST')).toBeVisible()
    await expect(page.getByTestId('nav-USER_MANAGEMENT')).toBeVisible()
  })
})

test.describe('Scenario 5 — field-level update authorization', () => {
  test('an employee may update contact fields on their own profile', async ({ page }) => {
    await login(page, USERS.employee)
    await page.goto('/hrm/my-profile')

    await expect(page.getByTestId('scope-list')).toContainText('SELF')
    await page.getByTestId('toggle-edit').click()

    const phone = page.getByLabel('Số điện thoại')
    const next = `09${Date.now().toString().slice(-8)}`
    await phone.fill(next)
    await page.getByTestId('field-form-submit').click()

    await expect(page.getByText('Cập nhật thành công.')).toBeVisible()
    await expect(page.locator('[data-field="phoneNumber"]')).toHaveText(next)
  })

  test('non-updatable fields are never offered, and the API rejects them anyway', async ({ page }) => {
    await login(page, USERS.employee)
    await page.goto('/hrm/my-profile')
    await page.getByTestId('toggle-edit').click()

    await expect(page.getByLabel('Số điện thoại')).toBeVisible()
    await expect(page.getByLabel('Lương')).toHaveCount(0)
    await expect(page.getByLabel('Họ và tên')).toHaveCount(0)

    // Same request the UI refuses to build, made directly: the backend is the real gate.
    const token = await page.evaluate(() => localStorage.getItem('eal.accessToken'))
    const response = await page.request.patch('http://localhost:8080/api/employees/4', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Module-Key': 'HRM',
        'X-Submodule-Key': 'EMPLOYEE',
        'X-Screen-Code': 'MY_PROFILE',
      },
      data: { salary: 999 },
    })
    expect(response.status()).toBe(403)
    expect((await response.json()).code).toBe('FIELD_PERMISSION_DENIED')
  })
})

test.describe('Scenario 6 — a wider screen offers wider write access', () => {
  test('EMPLOYEE_EDIT lets HR_ADMIN write organization and salary fields', async ({ page }) => {
    await login(page, USERS.admin)
    await page.goto('/hrm/employees/4/edit')

    // Organization fields are written by id, so the form needs the ORGANIZATION_OPTIONS lookup.
    const department = page.getByLabel('Phòng ban')
    await expect(department).toBeVisible()
    await expect(department.locator('option')).toContainText(['Development Department'])
    await expect(page.getByLabel('Quản lý')).toBeVisible()
    await expect(page.getByLabel('Lương')).toBeVisible()

    const title = page.getByLabel('Chức danh')
    const next = `Backend Developer ${Date.now().toString().slice(-4)}`
    await title.fill(next)
    await page.getByTestId('field-form-submit').click()
    await expect(page.getByText('Cập nhật thành công.')).toBeVisible()

    // Restore the seeded value so the other scenarios keep describing the demo data.
    await page.getByLabel('Chức danh').fill('Backend Developer')
    await page.getByTestId('field-form-submit').click()
    await page.reload()
    await expect(page.getByLabel('Chức danh')).toHaveValue('Backend Developer')
  })
})

test.describe('Scenario 7 — permission debug drawer explains the result', () => {
  test('the drawer shows the headers sent, the scopes and the last call', async ({ page }) => {
    await login(page, USERS.employee)
    await page.goto('/hrm/employees')
    await expect(page.getByTestId('employee-table')).toBeVisible()

    await page.getByTestId('permission-debug-toggle').click()
    const drawer = page.getByTestId('permission-debug-drawer')
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText('X-Module-Key')
    await expect(drawer).toContainText('EMPLOYEE_LIST')
    await expect(drawer).toContainText('TEAM')
    await expect(drawer).toContainText('EMPLOYEE_SEARCH')
  })
})
