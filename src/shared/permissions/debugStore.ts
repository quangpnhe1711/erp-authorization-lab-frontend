import { useSyncExternalStore } from 'react'
import type { ScreenContext } from './screens'

/**
 * Ring buffer of the last API calls, feeding the permission debug drawer (spec §20).
 * Deliberately outside React state: the axios interceptor writes to it from anywhere.
 */
export interface ApiCallRecord {
  method: string
  url: string
  screen?: ScreenContext
  apiCode?: string
  status: number
  requestId: string
  readableFields?: string[]
  rowCount?: number
  errorCode?: string
  errorDetails?: Record<string, unknown>
  at: number
}

const LIMIT = 25
let records: ApiCallRecord[] = []
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function recordApiCall(record: ApiCallRecord) {
  records = [record, ...records].slice(0, LIMIT)
  emit()
}

export function clearApiCalls() {
  records = []
  emit()
}

export function getApiCalls(): ApiCallRecord[] {
  return records
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useApiCalls(): ApiCallRecord[] {
  return useSyncExternalStore(subscribe, getApiCalls, getApiCalls)
}

/** Most recent call made from a given screen — what the drawer shows by default. */
export function latestCallForScreen(screenCode: string | undefined): ApiCallRecord | undefined {
  if (!screenCode) return records[0]
  return records.find((r) => r.screen?.screenCode === screenCode) ?? records[0]
}
