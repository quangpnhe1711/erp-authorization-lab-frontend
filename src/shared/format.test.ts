import { describe, expect, it } from 'vitest'
import { formatFieldValue, initials } from './format'

describe('formatFieldValue', () => {
  it('shows an em dash for absent values rather than an empty cell', () => {
    expect(formatFieldValue('fullName', null)).toBe('—')
    expect(formatFieldValue('fullName', undefined)).toBe('—')
    expect(formatFieldValue('fullName', '')).toBe('—')
  })

  it('formats salary as currency and leaves other numbers alone', () => {
    expect(formatFieldValue('salary', 20000000)).toMatch(/20[.,]000[.,]000/)
    expect(formatFieldValue('projectStatus', 'ACTIVE')).toBe('ACTIVE')
  })

  it('keeps an unparsable date as-is instead of rendering Invalid Date', () => {
    expect(formatFieldValue('dateOfBirth', 'not-a-date')).toBe('not-a-date')
  })
})

describe('initials', () => {
  it('takes first and last word', () => {
    expect(initials('Alice Nguyen')).toBe('AN')
    expect(initials('admin@example.com')).toBe('AD')
  })
})
