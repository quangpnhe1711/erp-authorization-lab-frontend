import { expect, type Page } from '@playwright/test'

export const PASSWORD = 'Password@123'

export const USERS = {
  employee: 'employee@example.com',
  manager: 'manager@example.com',
  hr: 'hr@example.com',
  admin: 'admin@example.com',
  multiRole: 'multi-role@example.com',
} as const

/** Display names the workspace greets each demo account with. */
export const DISPLAY_NAMES: Record<string, string> = {
  [USERS.employee]: 'Alice Nguyen',
  [USERS.manager]: 'Grace Do',
  [USERS.hr]: 'Eve Hoang',
  [USERS.admin]: 'Frank Vu',
  [USERS.multiRole]: 'Heidi Bui',
}

export async function login(page: Page, username: string) {
  await page.goto('/login')
  await page.getByTestId(`demo-${username}`).click()
  await page.getByTestId('login-submit').click()
  await page.waitForURL('**/dashboard')
  await expect(page.getByTestId('sidebar')).toBeVisible()
}

export async function logout(page: Page) {
  await page.getByTestId('user-menu').click()
  await page.getByTestId('logout').click()
  await expect(page.getByTestId('login-submit')).toBeVisible()
}

/** Diagnostics live behind a switch in the account menu; most assertions run with it off. */
export async function setDeveloperMode(page: Page, on: boolean) {
  await page.getByTestId('user-menu').click()
  const toggle = page.getByTestId('developer-mode-toggle').getByRole('switch')
  const checked = (await toggle.getAttribute('aria-checked')) === 'true'
  if (checked !== on) await toggle.click()
  await page.keyboard.press('Escape')
  await page.mouse.click(5, 400)
}

export async function columnHeaders(page: Page, tableTestId: string): Promise<string[]> {
  const table = page.getByTestId(tableTestId)
  await expect(table).toBeVisible()
  return (await table.locator('thead th').allTextContents()).map((text) => text.trim()).filter(Boolean)
}

export async function rowCount(page: Page, tableTestId: string): Promise<number> {
  const table = page.getByTestId(tableTestId)
  await expect(table).toBeVisible()
  return table.locator('tbody tr').count()
}
