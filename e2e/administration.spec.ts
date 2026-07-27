import { expect, test } from '@playwright/test'
import { login, logout, setDeveloperMode, USERS } from './helpers'

/** Administration and activity, from an administrator's point of view. */

test.describe('Administration reads as job descriptions, not tables', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.admin)
  })

  test('the user list names roles the way people describe their jobs', async ({ page }) => {
    await page.goto('/admin/users')
    const table = page.getByTestId('user-table')
    await expect(table).toContainText('multi-role@example.com')
    const row = table.locator('tr', { hasText: 'multi-role@example.com' })
    await expect(row).toContainText('Team Manager')
    await expect(row).toContainText('HR Officer')
    // The underlying constants stay out of the interface.
    await expect(table).not.toContainText('TEAM_MANAGER')
  })

  test('the catalogue groups reference data instead of scattering it', async ({ page }) => {
    await page.goto('/admin/catalog')
    await expect(page.getByTestId('role-table')).toBeVisible()

    await page.getByTestId('tab-fields').click()
    const groups = page.getByTestId('field-group-list')
    await expect(groups).toContainText('Thông tin lương')
    await expect(groups).toContainText('Thông tin ngân hàng')
    await expect(groups).toContainText('Nhạy cảm')
  })

  test('role permissions are three questions on one page', async ({ page }) => {
    await page.goto('/admin/access')
    await expect(page.getByTestId('role-select')).toBeVisible()
    await page.getByTestId('role-select').selectOption({ label: 'HR Admin' })
    await expect(page.getByTestId('access-EMPLOYEE_LIST')).toBeChecked()
    await expect(page.getByTestId('action-EMPLOYEE_LIST-READ')).toBeChecked()
    await expect(page.getByTestId('action-EMPLOYEE_LIST-DELETE')).not.toBeChecked()

    await page.getByTestId('tab-scope').click()
    await page.getByTestId('role-select').selectOption({ label: 'Team Manager' })
    await expect(page.getByTestId('scope-EMPLOYEE_LIST-TEAM')).toBeChecked()
    await expect(page.getByTestId('scope-MEMBER_LIST-RESPONSIBILITY')).toBeChecked()
    await expect(page.getByTestId('scope-EMPLOYEE_LIST-ALL')).not.toBeChecked()
  })

  test('data scope is a multi-select union, spelled out in words', async ({ page }) => {
    await page.goto('/admin/access')
    await page.getByTestId('tab-scope').click()
    const matrix = page.getByTestId('matrix-scope').first()
    await expect(matrix).toContainText('Được phân công')
    await expect(matrix).toContainText('Toàn công ty')
    await expect(matrix).not.toContainText('RESPONSIBILITY')
  })

  test('granting a role a new area takes effect immediately, then is reverted', async ({ page }) => {
    // Start from a known state rather than assuming it — a half-finished earlier run must not
    // decide whether this one passes.
    await page.goto('/admin/access')
    await page.getByTestId('role-select').selectOption({ label: 'HR Officer' })
    await page.getByTestId('access-SALARY_LIST').uncheck()
    await page.getByTestId('action-SALARY_LIST-READ').uncheck()
    // Save stays disabled while nothing is dirty, which is the normal case on a clean database.
    const save = page.getByTestId('save-permissions')
    if (await save.isEnabled()) await save.click()

    await logout(page)
    await login(page, USERS.hr)
    await page.goto('/hrm/salaries')
    await expect(page.getByTestId('screen-access-denied')).toBeVisible()

    await logout(page)
    await login(page, USERS.admin)
    await page.goto('/admin/access')
    await page.getByTestId('role-select').selectOption({ label: 'HR Officer' })
    await page.getByTestId('access-SALARY_LIST').check()
    await page.getByTestId('action-SALARY_LIST-READ').check()
    await page.getByTestId('save-permissions').click()
    await expect(page.getByTestId('toast')).toContainText('Đã lưu thay đổi quyền')

    await logout(page)
    await login(page, USERS.hr)
    await page.goto('/hrm/salaries')
    // The area is open now. It is still empty — being allowed in is not the same as being given
    // data, which is exactly the distinction the model draws.
    await expect(page.getByTestId('screen-access-denied')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Lương' })).toBeVisible()

    await logout(page)
    await login(page, USERS.admin)
    await page.goto('/admin/access')
    await page.getByTestId('role-select').selectOption({ label: 'HR Officer' })
    await page.getByTestId('access-SALARY_LIST').uncheck()
    await page.getByTestId('action-SALARY_LIST-READ').uncheck()
    await page.getByTestId('save-permissions').click()
    await expect(page.getByTestId('toast')).toContainText('Đã lưu thay đổi quyền')

    await page.reload()
    await page.getByTestId('role-select').selectOption({ label: 'HR Officer' })
    await expect(page.getByTestId('access-SALARY_LIST')).not.toBeChecked()
  })
})

test.describe('Activity is a feed of events, not a log dump', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.admin)
  })

  test('each entry reads as a sentence', async ({ page }) => {
    await page.goto('/activity')
    const feed = page.getByTestId('activity-list')
    await expect(feed).toContainText('đã đăng nhập')
    await expect(feed).toContainText(USERS.admin)
    await expect(feed).not.toContainText('LOGIN')
  })

  test('the feed can be narrowed to one kind of event', async ({ page }) => {
    await page.goto('/activity')
    await page.getByTestId('activity-filter').selectOption('ROLE_PERMISSION_UPDATE')
    await expect(page.getByTestId('activity-list').or(page.getByText('Chưa có hoạt động nào'))).toBeVisible()
  })

  test('the permission trace is developer-only and filters to refusals', async ({ page }) => {
    await page.goto('/activity')
    await expect(page.getByTestId('tab-trace')).toHaveCount(0)

    await setDeveloperMode(page, true)
    await page.getByTestId('tab-trace').click()
    await expect(page.getByTestId('decision-row').first()).toBeVisible()

    await page.getByTestId('decision-filter').selectOption('DENY')
    const decisions = await page
      .getByTestId('decision-row')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-decision')))
    // The filter must never let an ALLOW through. It cannot be asserted that a refusal exists: a
    // screen-level refusal is answered by GET /api/me/screen-permission, which is not an enforced
    // use-case and so writes no decision row, and on a freshly migrated database no business call
    // has been refused yet.
    expect(decisions.every((decision) => decision === 'DENY')).toBe(true)

    await setDeveloperMode(page, false)
    await expect(page.getByTestId('tab-trace')).toHaveCount(0)
  })
})

test.describe('Assignments are done in a dialog, not a bare form', () => {
  test('responsibility can be granted and taken back', async ({ page }) => {
    await login(page, USERS.admin)
    await page.goto('/admin/responsibilities')

    const rows = page.getByTestId('responsibility-table').locator('tbody tr')
    await expect(rows.first()).toBeVisible()
    const before = await rows.count()

    await page.getByTestId('open-assign-responsibility').click()
    const userSelect = page.getByLabel('Người phụ trách')
    const userValue = await userSelect
      .locator('option', { hasText: 'employee@example.com' })
      .getAttribute('value')
    await userSelect.selectOption(userValue!)
    await page.getByLabel('Loại đối tượng').selectOption('TEAM')
    await page.getByLabel('Đối tượng', { exact: true }).selectOption({ label: 'Frontend Team' })
    await page.getByTestId('assign-responsibility').click()

    await expect(page.getByTestId('toast')).toContainText('Đã phân công phụ trách')
    await expect(rows).toHaveCount(before + 1)

    const added = page.getByTestId('responsibility-table').locator('tr', { hasText: 'employee@example.com' })
    await expect(added).toContainText('Frontend Team')
    await added.getByRole('button', { name: 'Gỡ' }).click()
    await expect(rows).toHaveCount(before)
  })
})
