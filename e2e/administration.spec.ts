import { expect, test } from '@playwright/test'
import { login, logout, USERS } from './helpers'

/** Administration + audit screens. The last test mutates config and reverts it in the same run. */

test.describe('Administration catalogue', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.admin)
  })

  test('lists users with their effective roles', async ({ page }) => {
    await page.goto('/admin/users')
    const table = page.getByTestId('user-table')
    await expect(table).toBeVisible()
    await expect(table).toContainText('multi-role@example.com')
    await expect(table.locator('tr', { hasText: 'multi-role@example.com' })).toContainText('TEAM_MANAGER')
    await expect(table.locator('tr', { hasText: 'multi-role@example.com' })).toContainText('HR_OFFICER')
  })

  test('shows every screen with the API use-cases it may invoke', async ({ page }) => {
    await page.goto('/admin/screens')
    const table = page.getByTestId('screen-table')
    await expect(table.locator('tr', { hasText: 'EMPLOYEE_LIST' })).toContainText('EMPLOYEE_SEARCH')
    await expect(table.locator('tr', { hasText: 'MY_PROFILE' })).toContainText('EMPLOYEE_UPDATE')
    await expect(table.locator('tr', { hasText: 'MY_PROFILE' })).not.toContainText('EMPLOYEE_SEARCH')
  })

  test('renders the field-group catalogue with sensitive markers', async ({ page }) => {
    await page.goto('/admin/field-groups')
    const list = page.getByTestId('field-group-list')
    await expect(list).toContainText('SALARY_INFORMATION')
    await expect(list).toContainText('BANK_INFORMATION')
    await expect(list).toContainText('employeeCode')
  })

  test('loads the role permission matrix for the selected role', async ({ page }) => {
    await page.goto('/admin/screen-permissions')
    await expect(page.getByTestId('role-select')).toBeVisible()
    await page.getByTestId('role-select').selectOption({ label: 'HR_ADMIN' })
    await expect(page.getByTestId('access-EMPLOYEE_LIST')).toBeChecked()
    await expect(page.getByTestId('action-EMPLOYEE_LIST-READ')).toBeChecked()
    await expect(page.getByTestId('action-EMPLOYEE_LIST-DELETE')).not.toBeChecked()
  })

  test('shows record scopes as a multi-select union, not a single value', async ({ page }) => {
    await page.goto('/admin/record-scopes')
    await page.getByTestId('role-select').selectOption({ label: 'TEAM_MANAGER' })
    await expect(page.getByTestId('scope-EMPLOYEE_LIST-TEAM')).toBeChecked()
    await expect(page.getByTestId('scope-MEMBER_LIST-RESPONSIBILITY')).toBeChecked()
    await expect(page.getByTestId('scope-EMPLOYEE_LIST-ALL')).not.toBeChecked()
  })
})

test.describe('Audit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.admin)
  })

  test('audit log records the logins that just happened', async ({ page }) => {
    await page.goto('/audit/logs')
    await expect(page.getByTestId('audit-table')).toContainText('LOGIN')
    await expect(page.getByTestId('audit-table')).toContainText(USERS.admin)
  })

  test('decision trace can be filtered down to denials', async ({ page }) => {
    await page.goto('/audit/decisions')
    // The table shell renders while the query is in flight — wait for an actual row.
    await expect(page.getByTestId('decision-row').first()).toBeVisible()

    await page.getByTestId('decision-filter').selectOption('DENY')
    await expect(page.getByTestId('decision-row').first()).toBeVisible()
    const decisions = await page
      .getByTestId('decision-row')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-decision')))
    expect(decisions.length).toBeGreaterThan(0)
    expect(decisions.every((d) => d === 'DENY')).toBe(true)
  })

  test('a denied request from another user is visible in the trace', async ({ page }) => {
    await page.goto('/audit/decisions')
    await page.getByTestId('decision-screen-filter').fill('USER_MANAGEMENT')
    await expect(page.getByTestId('decision-table')).toContainText('USER_MANAGEMENT')
  })
})

test.describe('Changing configuration changes behaviour', () => {
  test('granting HR_OFFICER access to SALARY_LIST takes effect, then is reverted', async ({ page }) => {
    await login(page, USERS.admin)
    await page.goto('/admin/screen-permissions')
    await page.getByTestId('role-select').selectOption({ label: 'HR_OFFICER' })

    const access = page.getByTestId('access-SALARY_LIST')
    await expect(access).not.toBeChecked()

    await access.check()
    await page.getByTestId('action-SALARY_LIST-READ').check()
    await page.getByTestId('save-permissions').click()
    await expect(page.getByText('Cấu hình quyền đã được ghi.', { exact: false })).toBeVisible()

    // The HR officer can now open a screen that was denied a moment ago.
    await logout(page)
    await login(page, USERS.hr)
    await page.goto('/hrm/salaries')
    await expect(page.getByTestId('screen-access-denied')).toHaveCount(0)
    await expect(page.getByTestId('scope-summary')).toBeVisible()

    // Revert so the seeded demo matrix stays as documented.
    await logout(page)
    await login(page, USERS.admin)
    await page.goto('/admin/screen-permissions')
    await page.getByTestId('role-select').selectOption({ label: 'HR_OFFICER' })
    await page.getByTestId('access-SALARY_LIST').uncheck()
    await page.getByTestId('action-SALARY_LIST-READ').uncheck()
    await page.getByTestId('save-permissions').click()
    await expect(page.getByText('Cấu hình quyền đã được ghi.', { exact: false })).toBeVisible()

    await page.reload()
    await page.getByTestId('role-select').selectOption({ label: 'HR_OFFICER' })
    await expect(page.getByTestId('access-SALARY_LIST')).not.toBeChecked()
  })
})
