import { expect, type Page } from '@playwright/test'

export const PASSWORD = 'Password@123'

export const USERS = {
  employee: 'employee@example.com',
  manager: 'manager@example.com',
  hr: 'hr@example.com',
  admin: 'admin@example.com',
  multiRole: 'multi-role@example.com',
} as const

export async function login(page: Page, username: string) {
  await page.goto('/login')
  await page.getByTestId(`demo-${username}`).click()
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('current-username')).toHaveText(username)
}

export async function logout(page: Page) {
  await page.getByTestId('logout').click()
  await expect(page.getByTestId('login-submit')).toBeVisible()
}

/** Column headers currently rendered by a FieldTable. */
export async function columnHeaders(page: Page, tableTestId: string): Promise<string[]> {
  const table = page.getByTestId(tableTestId)
  await expect(table).toBeVisible()
  return (await table.locator('thead th').allTextContents()).map((t) => t.trim()).filter(Boolean)
}

export async function rowCount(page: Page, tableTestId: string): Promise<number> {
  const table = page.getByTestId(tableTestId)
  await expect(table).toBeVisible()
  return table.locator('tbody tr').count()
}
