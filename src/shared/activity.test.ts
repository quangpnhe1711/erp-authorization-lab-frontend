import { describe, expect, it } from 'vitest'
import type { AuditLogRow } from '@/shared/api/types'
import { describeActivity, relativeTime } from './activity'

function row(overrides: Partial<AuditLogRow> = {}): AuditLogRow {
  return {
    id: 1,
    requestId: 'r-1',
    userId: 4,
    username: 'alice@acme.com',
    action: 'LOGIN',
    objectType: 'USER',
    objectId: '4',
    detail: null,
    createdAt: '2026-07-26T10:00:00Z',
    ...overrides,
  }
}

describe('activity phrasing', () => {
  it('reads as a sentence, not a constant', () => {
    expect(describeActivity(row())).toBe('alice@acme.com đã đăng nhập')
    expect(describeActivity(row({ action: 'ROLE_ASSIGN' }))).toBe(
      'alice@acme.com đã gán vai trò cho một tài khoản',
    )
  })

  it('never prints an unmapped action code at the user', () => {
    const text = describeActivity(row({ action: 'SOME_NEW_INTERNAL_ACTION' }))
    expect(text).not.toContain('SOME_NEW_INTERNAL_ACTION')
    expect(text).toBe('alice@acme.com đã thực hiện một thao tác')
  })

  it('falls back to a neutral subject when the actor is unknown', () => {
    expect(describeActivity(row({ username: null }))).toBe('Một tài khoản đã đăng nhập')
  })
})

describe('relativeTime', () => {
  const now = new Date('2026-07-26T12:00:00Z').getTime()

  it('prefers "vừa xong" over a precise timestamp for fresh events', () => {
    expect(relativeTime('2026-07-26T11:59:40Z', now)).toBe('vừa xong')
  })

  it('scales the unit to the distance', () => {
    expect(relativeTime('2026-07-26T11:30:00Z', now)).toMatch(/30 phút/)
    expect(relativeTime('2026-07-25T12:00:00Z', now)).toMatch(/hôm qua|1 ngày/i)
  })

  it('degrades gracefully on missing or broken input', () => {
    expect(relativeTime(null, now)).toBe('—')
    expect(relativeTime('not-a-date', now)).toBe('—')
  })
})
