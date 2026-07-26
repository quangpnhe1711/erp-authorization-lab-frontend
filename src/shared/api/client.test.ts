import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError, tokenStore } from './client'
import { getApiCalls, recordApiCall } from '@/shared/permissions/debugStore'
import { SCREENS } from '@/shared/permissions/screens'

describe('ApiError', () => {
  it('exposes the backend error contract', () => {
    const error = new ApiError({
      timestamp: '2026-07-26T10:52:31Z',
      status: 403,
      code: 'FIELD_PERMISSION_DENIED',
      message: 'You do not have permission to update one or more fields.',
      requestId: 'cffdef45',
      details: { deniedFields: ['salary'] },
    })
    expect(error.status).toBe(403)
    expect(error.code).toBe('FIELD_PERMISSION_DENIED')
    expect(error.deniedFields).toEqual(['salary'])
    expect(error.requestId).toBe('cffdef45')
  })

  it('returns an empty denied-field list when details are absent', () => {
    const error = new ApiError({
      timestamp: '2026-07-26T10:52:31Z',
      status: 403,
      code: 'SCREEN_ACCESS_DENIED',
      message: 'nope',
      requestId: 'x',
    })
    expect(error.deniedFields).toEqual([])
    expect(error.details).toEqual({})
  })
})

describe('tokenStore', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips and clears both tokens', () => {
    tokenStore.set({ accessToken: 'a', refreshToken: 'r' })
    expect(tokenStore.access()).toBe('a')
    expect(tokenStore.refresh()).toBe('r')
    tokenStore.clear()
    expect(tokenStore.access()).toBeNull()
    expect(tokenStore.refresh()).toBeNull()
  })
})

describe('debug store', () => {
  it('keeps the newest call first', () => {
    recordApiCall({
      method: 'GET',
      url: '/api/employees',
      screen: SCREENS.EMPLOYEE_LIST,
      apiCode: 'EMPLOYEE_SEARCH',
      status: 200,
      requestId: '1',
      at: 1,
    })
    recordApiCall({
      method: 'GET',
      url: '/api/employees',
      screen: SCREENS.EMPLOYEE_PICKER,
      apiCode: 'EMPLOYEE_SEARCH',
      status: 200,
      requestId: '2',
      at: 2,
    })
    const calls = getApiCalls()
    expect(calls[0]?.screen?.screenCode).toBe('EMPLOYEE_PICKER')
    expect(calls[1]?.screen?.screenCode).toBe('EMPLOYEE_LIST')
  })
})
