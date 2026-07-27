import { expect, test } from '@playwright/test'
import { login, USERS } from './helpers'

/**
 * The Authorization Lab against the real backend. The assertions that matter are the ones about the
 * mandatory example of the spec: phoneNumber sits in EMPLOYEE_CONTACT and EMPLOYEE_SUMMARY, so
 * Nguyen Van A (EMPLOYEE + HR_OFFICER) reads it for everybody, updates and unmasks it only for
 * himself. Anything that widened update or unmask along with read would fail here.
 */
test.describe('Authorization Lab', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.admin)
  })

  test('the dashboard reports the model and the configurations that break its rules', async ({ page }) => {
    await page.goto('/lab')
    await expect(page.getByRole('heading', { name: /Tổng quan cấu hình/ })).toBeVisible()

    // The seed deliberately contains broken rows so this check has something to find.
    const violations = page.getByTestId('metric-Cấu hình vi phạm')
    await expect(violations).toBeVisible()
    expect(Number(await violations.innerText())).toBeGreaterThan(0)

    await expect(page.getByTestId('metric-Field thuộc nhiều nhóm')).toBeVisible()
    await expect(page.getByTestId(/issue-(UPDATE|UNMASK|READ)_SCOPE_EXCEEDS/).first()).toBeVisible()
  })

  test('the field catalogue flags a field that belongs to more than one group', async ({ page }) => {
    await page.goto('/lab/fields')
    await page.getByTestId('filter-multi-group').check()

    const row = page.getByTestId('field-phoneNumber')
    await expect(row).toBeVisible()
    await expect(row).toContainText('EMPLOYEE_CONTACT')
    await expect(row).toContainText('EMPLOYEE_SUMMARY')
  })

  test('the permission matrix shows each action with its own scope', async ({ page }) => {
    await page.goto('/lab/permissions')
    await page.getByTestId('select-role').selectOption('HR_OFFICER')
    await page.getByTestId('select-module').selectOption('HRM')
    await page.getByTestId('select-screen').selectOption('EMPLOYEE_DETAIL')

    await expect(page.getByTestId('can-enter')).toBeChecked()
    await expect(page.getByTestId('scope-EMPLOYEE_CONTACT-read')).toHaveValue('DEPARTMENT')
    await expect(page.getByTestId('scope-EMPLOYEE_CONTACT-update')).toHaveValue('SELF')
    await expect(page.getByTestId('scope-EMPLOYEE_CONTACT-unmask')).toHaveValue('SELF')
    await expect(page.getByTestId('scope-EMPLOYEE_SUMMARY-read')).toHaveValue('ALL')

    // The union is shown where it happens: on the field, per action.
    const preview = page.getByTestId('preview-phoneNumber-read')
    await expect(preview).toContainText('Toàn bộ')
    await expect(page.getByTestId('preview-phoneNumber-update')).toContainText('Chính mình')
    await expect(page.getByTestId('preview-phoneNumber-unmask')).toContainText('Chính mình')
  })

  test('the payload inspector shows the exact JSON the screen would send', async ({ page }) => {
    await page.goto('/lab/permissions')
    await page.getByTestId('select-role').selectOption('HR_OFFICER')
    await page.getByTestId('select-module').selectOption('HRM')
    await page.getByTestId('select-screen').selectOption('EMPLOYEE_DETAIL')

    const request = page.getByTestId('payload-request')
    await expect(request).toContainText('"roleCode": "HR_OFFICER"')
    await expect(request).toContainText('"unmask"')

    await page.getByTestId('payload-pretty-toggle').click()
    await expect(request).toContainText('"roleCode":"HR_OFFICER"')
  })

  test('widening a scope asks for confirmation and reports the impact per action', async ({ page }) => {
    await page.goto('/lab/permissions')
    await page.getByTestId('select-role').selectOption('HR_OFFICER')
    await page.getByTestId('select-module').selectOption('HRM')
    await page.getByTestId('select-screen').selectOption('EMPLOYEE_DETAIL')

    await expect(page.getByTestId('unsaved-indicator')).toHaveCount(0)
    // Widen only the read scope of one group. The screen ceiling is ALL here, so ALL is on offer;
    // on a screen capped at DEPARTMENT the option would correctly not exist.
    await page.getByTestId('scope-EMPLOYEE_CONTACT-read').selectOption('ALL')
    await expect(page.getByTestId('unsaved-indicator')).toBeVisible()

    await page.getByTestId('save-config').click()
    const changes = page.getByTestId('impact-changes')
    await expect(changes).toBeVisible()
    // Read moved; update and unmask must not appear as widened.
    await expect(changes).toContainText('Xem')
    await expect(changes.locator('li', { hasText: 'Sửa' })).toHaveCount(0)

    // Leave the configuration untouched — this test only inspects the analysis.
    await page.getByRole('button', { name: 'Xem lại' }).click()
    await expect(changes).toHaveCount(0)
  })

  test('the explorer explains the mandatory multi-group case target by target', async ({ page }) => {
    await page.goto('/lab/explorer')
    await page.getByTestId('explorer-user').selectOption({ label: 'Nguyen Van A' })
    await page.getByTestId('explorer-screen').selectOption('EMPLOYEE_DETAIL')

    // 1 — himself: reads, updates and sees the real value.
    await page.getByTestId('explorer-target').selectOption({ label: 'Nguyen Van A' })
    await page.getByTestId('explorer-run').click()
    await page.getByTestId('explorer-field').selectOption('phoneNumber')
    await expect(page.getByTestId('explorer-value')).toContainText('0987654321')

    // 2 — a colleague in the same department: readable, masked, not updatable.
    await page.getByTestId('explorer-target').selectOption({ label: 'Tran Thi B' })
    await page.getByTestId('explorer-run').click()
    await page.getByTestId('explorer-field').selectOption('phoneNumber')
    await expect(page.getByTestId('explorer-value')).toContainText('***')

    const rows = page.getByTestId('tab-fields')
    await rows.click()
    const phoneRow = page.getByTestId('explorer-row-phoneNumber')
    await expect(phoneRow).toContainText('MASKED')

    // 3 — the resolve trace names each step, including the ones that did NOT widen.
    await page.getByTestId('tab-trace').click()
    const trace = page.getByTestId('explorer-trace')
    await expect(trace).toContainText('Effective read scope')
    await expect(trace).toContainText('never the read union itself')
  })

  test('cloning a group without permissions leaves every user where they were', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6)
    await page.goto('/lab/field-groups')
    await page.getByTestId('clone-EMPLOYEE_CONTACT').click()

    // Both copy options start off — that is the point of the screen.
    await expect(page.getByTestId('clone-copy-permissions')).not.toBeChecked()
    await expect(page.getByTestId('clone-attach-screens')).not.toBeChecked()

    await page.getByLabel('Mã nhóm mới').fill(`E2E_CLONE_${suffix}`)
    await page.getByLabel('Tên nhóm mới').fill(`Bản sao e2e ${suffix}`)
    await page.getByTestId('confirm-clone').click()

    await expect(page.getByTestId(`group-E2E_CLONE_${suffix}`)).toBeVisible()
    const clone = page.getByTestId(`group-E2E_CLONE_${suffix}`)
    await expect(clone).toContainText('Phone Number')
    // No role is granted on the clone, so nobody gained anything.
    await expect(clone).toContainText('Vai trò đang được cấp quyền')
    await expect(clone.locator('dd', { hasText: '—' }).first()).toBeVisible()
  })

  test('dark mode repaints the workspace without touching the content', async ({ page }) => {
    await page.goto('/lab')
    const html = page.locator('html')
    const before = await html.getAttribute('class')

    await page.getByTestId('theme-toggle').click()
    await expect(html).toHaveClass(/dark/)
    await expect(page.getByRole('heading', { name: /Tổng quan cấu hình/ })).toBeVisible()

    await page.getByTestId('theme-toggle').click()
    await expect(html).toHaveClass(before ?? '')
  })
})
