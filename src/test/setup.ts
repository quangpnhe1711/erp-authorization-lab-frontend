import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { clearApiCalls } from '@/shared/permissions/debugStore'

beforeEach(() => {
  localStorage.clear()
  clearApiCalls()
})

afterEach(() => {
  cleanup()
})
