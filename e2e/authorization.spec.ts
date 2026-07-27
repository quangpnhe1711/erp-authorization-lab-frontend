import { expect, test } from '@playwright/test'
import { columnHeaders, DISPLAY_NAMES, login, logout, rowCount, setDeveloperMode, USERS } from './helpers'

/**
 * What a person sees, said in their language. Each test states a business rule and checks the UI
 * reflects what the backend actually returned — no mocks, and no implementation vocabulary on
 * screen unless developer mode is deliberately switched on.
 */

test.describe('Everyone sees the slice of the company they are responsible for', () => {
  test('an employee sees their own team', async ({ page }) => {
    await login(page, USERS.employee)
    await page.getByTestId('nav-EMPLOYEE_LIST').click()

    expect(await rowCount(page, 'employee-table')).toBe(3)
    await expect(page.getByTestId('scope-notice')).toContainText('Đang hiển thị 3 nhân viên')
    await expect(page.getByTestId('scope-notice')).toContainText('nhóm')
  })

  test('an administrator sees the whole company', async ({ page }) => {
    await login(page, USERS.admin)
    await page.goto('/hrm/employees')

    expect(await rowCount(page, 'employee-table')).toBe(14)
    await expect(page.getByTestId('scope-notice')).toContainText('toàn công ty')
  })

  test('someone with two jobs sees both slices added together', async ({ page }) => {
    await login(page, USERS.multiRole)
    await page.goto('/hrm/employees')

    // Own team (3) plus the team she is assigned to look after (3).
    expect(await rowCount(page, 'employee-table')).toBe(6)
    const notice = page.getByTestId('scope-notice')
    await expect(notice).toContainText('nhóm')
    await expect(notice).toContainText('các bộ phận bạn phụ trách')
  })
})

test.describe('People only see the information they are cleared for', () => {
  test('an employee gets names and org, never pay', async ({ page }) => {
    await login(page, USERS.employee)
    await page.goto('/hrm/employees')

    const headers = await columnHeaders(page, 'employee-table')
    expect(headers).toContain('Họ và tên')
    expect(headers).toContain('Phòng ban')
    expect(headers).not.toContain('Lương')
    expect(headers).not.toContain('Email cá nhân')
  })

  test('an administrator additionally gets pay', async ({ page }) => {
    await login(page, USERS.admin)
    await page.goto('/hrm/employees')

    const headers = await columnHeaders(page, 'employee-table')
    expect(headers).toContain('Lương')
    expect(headers).toContain('Email cá nhân')
  })

  test('coded values are shown as words', async ({ page }) => {
    await login(page, USERS.admin)
    await page.goto('/hrm/employees')

    await expect(page.getByTestId('employee-table')).toContainText('Đang làm việc')
    await expect(page.getByTestId('employee-table')).not.toContainText('ACTIVE')
    await expect(page.getByTestId('employee-table')).not.toContainText('FULLTIME')
  })
})

test.describe('The same directory answers differently depending on the job at hand', () => {
  test('browsing people, staffing a project and picking a member are three different lists', async ({ page }) => {
    await login(page, USERS.manager)

    await page.goto('/hrm/employees')
    const listRows = await rowCount(page, 'employee-table')
    const listHeaders = await columnHeaders(page, 'employee-table')

    await page.goto('/projects/1/members/add')
    const pickerRows = await rowCount(page, 'picker-table')

    expect(listRows).toBe(3)
    expect(pickerRows).toBe(6)
    // A manager sees contact details of their own team, but not of everyone they may staff.
    expect(listHeaders).toContain('Email cá nhân')
    expect(await columnHeaders(page, 'picker-table')).not.toContain('Email cá nhân')
  })

  test('a project member list mixes people and project information', async ({ page }) => {
    await login(page, USERS.manager)
    await page.goto('/projects/1/members')

    const headers = await columnHeaders(page, 'member-table')
    expect(headers).toContain('Họ và tên')
    expect(headers).toContain('Vai trò trong dự án')
    expect(headers).not.toContain('Lương')
    expect(await rowCount(page, 'member-table')).toBe(3)
  })
})

test.describe('Areas nobody granted are closed, and the refusal is readable', () => {
  test('typing the URL of a closed area explains itself in plain language', async ({ page }) => {
    await login(page, USERS.employee)

    await expect(page.getByTestId('nav-SALARY_LIST')).toHaveCount(0)
    await page.goto('/hrm/salaries')

    await expect(page.getByTestId('screen-access-denied')).toBeVisible()
    await expect(page.getByText('Bạn chưa được cấp quyền vào mục này')).toBeVisible()
    // No error code, no screen code — the person is told what to do, not what broke.
    await expect(page.getByText(/SCREEN_ACCESS_DENIED/)).toHaveCount(0)
    await expect(page.getByText(/nhờ quản trị viên/i)).toBeVisible()
  })

  test('the menu is organised by work, and lists only what was granted', async ({ page }) => {
    await login(page, USERS.employee)
    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toContainText('Con người')
    await expect(sidebar).toContainText('Nhân viên')
    await expect(sidebar).not.toContainText('EMPLOYEE_LIST')
    await expect(page.getByTestId('nav-USER_MANAGEMENT')).toHaveCount(0)
    await expect(page.getByTestId('nav-AUDIT_LOG_LIST')).toHaveCount(0)

    await logout(page)
    await login(page, USERS.admin)
    await expect(page.getByTestId('nav-SALARY_LIST')).toBeVisible()
    await expect(page.getByTestId('nav-USER_MANAGEMENT')).toBeVisible()
    await expect(page.getByTestId('sidebar')).toContainText('Quản trị')
  })
})

test.describe('Editing respects what each person may change', () => {
  test('an employee can update their own contact details', async ({ page }) => {
    await login(page, USERS.employee)
    await page.goto('/hrm/my-profile')

    await page.getByTestId('toggle-edit').click()
    const phone = page.getByLabel('Số điện thoại')
    const next = `09${Date.now().toString().slice(-8)}`
    await phone.fill(next)
    await page.getByTestId('field-form-submit').click()

    await expect(page.getByTestId('toast')).toContainText('Đã lưu thay đổi')
    await expect(page.locator('[data-field="phoneNumber"]')).toHaveText(next)
  })

  test('fields they may not change are never offered, and the API refuses them anyway', async ({ page }) => {
    await login(page, USERS.employee)
    await page.goto('/hrm/my-profile')
    await page.getByTestId('toggle-edit').click()

    await expect(page.getByLabel('Số điện thoại')).toBeVisible()
    await expect(page.getByLabel('Lương')).toHaveCount(0)
    await expect(page.getByLabel('Họ và tên')).toHaveCount(0)

    // The request the UI refuses to build, made directly — the server is the real gate.
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

  test('an administrator gets the wider edit form, including pay and organisation', async ({ page }) => {
    await login(page, USERS.admin)
    await page.goto('/hrm/employees/4/edit')

    const department = page.getByLabel('Phòng ban')
    await expect(department).toBeVisible()
    await expect(department.locator('option')).toContainText(['Development Department'])
    await expect(page.getByLabel('Quản lý')).toBeVisible()
    await expect(page.getByLabel('Lương')).toBeVisible()

    const title = page.getByLabel('Chức danh')
    await title.fill(`Backend Developer ${Date.now().toString().slice(-4)}`)
    await page.getByTestId('field-form-submit').click()
    await expect(page.getByTestId('toast')).toContainText('Đã lưu thay đổi')

    // Put the seeded value back so the other scenarios keep describing the demo data.
    await page.getByLabel('Chức danh').fill('Backend Developer')
    await page.getByTestId('field-form-submit').click()
    await page.reload()
    await expect(page.getByLabel('Chức danh')).toHaveValue('Backend Developer')
  })
})

test.describe('The workspace greets you by name and shows your work', () => {
  test('the dashboard leads with the person, not the system', async ({ page }) => {
    await login(page, USERS.manager)

    await expect(page.getByRole('heading', { name: DISPLAY_NAMES[USERS.manager] })).toBeVisible()
    await expect(page.getByText(/Chào buổi/)).toBeVisible()
    await expect(page.getByText('Nhân viên bạn quản lý')).toBeVisible()

    // Nothing on the default dashboard speaks in implementation terms.
    const body = page.locator('main')
    await expect(body).not.toContainText('EMPLOYEE_LIST')
    await expect(body).not.toContainText('RECORD_SCOPE')
    await expect(body).not.toContainText('TEAM_MANAGER')
  })

  test('global search jumps into the directory', async ({ page }) => {
    await login(page, USERS.admin)
    await page.getByTestId('global-search').fill('Alice')
    await page.getByTestId('global-search').press('Enter')

    await page.waitForURL('**/hrm/employees?q=Alice')
    await expect(page.getByTestId('employee-table')).toContainText('Alice Nguyen')
    expect(await rowCount(page, 'employee-table')).toBe(1)
  })
})

test.describe('Developer mode is the only place codes appear', () => {
  test('diagnostics stay hidden until an engineer asks for them', async ({ page }) => {
    await login(page, USERS.employee)
    await page.goto('/hrm/employees')
    await expect(page.getByTestId('employee-table')).toBeVisible()
    await expect(page.getByTestId('diagnostics-toggle')).toHaveCount(0)

    await setDeveloperMode(page, true)
    await expect(page.getByTestId('developer-mode-chip')).toBeVisible()
    await page.getByTestId('diagnostics-toggle').click()

    const panel = page.getByTestId('diagnostics-panel')
    await expect(panel).toContainText('X-Module-Key')
    await expect(panel).toContainText('EMPLOYEE_LIST')
    await expect(panel).toContainText('TEAM')
    await expect(panel).toContainText('EMPLOYEE_SEARCH')

    await page.getByTestId('diagnostics-close').click()
    await setDeveloperMode(page, false)
    await expect(page.getByTestId('diagnostics-toggle')).toHaveCount(0)
  })
})
