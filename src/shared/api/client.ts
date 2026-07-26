import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorBody, TokenResponse } from './types'
import { screenContextHeaders, type ScreenContext } from '@/shared/permissions/screens'
import { recordApiCall } from '@/shared/permissions/debugStore'

/**
 * Empty base URL = same origin: Vite proxies /api in dev, nginx proxies it in the container.
 * VITE_API_BASE_URL still wins when someone points the SPA at a remote backend.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const ACCESS_KEY = 'eal.accessToken'
const REFRESH_KEY = 'eal.refreshToken'

export const tokenStore = {
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
  set(tokens: Pick<TokenResponse, 'accessToken' | 'refreshToken'>) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

/** Thrown for every non-2xx answer so screens can branch on the backend's stable error code. */
export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorBody['code']
  readonly requestId: string
  readonly details: Record<string, unknown>

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
    this.requestId = body.requestId
    this.details = body.details ?? {}
  }

  get deniedFields(): string[] {
    const raw = this.details.deniedFields
    return Array.isArray(raw) ? (raw as string[]) : []
  }
}

function toApiError(error: AxiosError<ApiErrorBody>): ApiError {
  const body = error.response?.data
  if (body && typeof body === 'object' && 'code' in body) return new ApiError(body)
  return new ApiError({
    timestamp: new Date().toISOString(),
    status: error.response?.status ?? 0,
    code: error.response?.status === 401 ? 'UNAUTHENTICATED' : 'INTERNAL_ERROR',
    message: error.message || 'Network error',
    requestId: '',
    details: {},
  })
}

export const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export interface RequestOptions {
  /** Screen the call is made from; becomes the X-Module-Key / X-Submodule-Key / X-Screen-Code headers. */
  screen?: ScreenContext
  /** API use-case code — recorded for the permission debug drawer, not sent to the server. */
  apiCode?: string
}

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    eal?: RequestOptions
  }
  export interface AxiosRequestConfig {
    eal?: RequestOptions
  }
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  const screen = config.eal?.screen
  if (screen) {
    for (const [key, value] of Object.entries(screenContextHeaders(screen))) {
      config.headers.set(key, value)
    }
  }
  return config
})

let refreshInFlight: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.refresh()
  if (!refreshToken) throw new Error('no refresh token')
  const { data } = await axios.post<TokenResponse>(`${BASE_URL}/api/auth/refresh`, { refreshToken })
  tokenStore.set(data)
  return data.accessToken
}

http.interceptors.response.use(
  (response) => {
    recordApiCall({
      method: (response.config.method ?? 'get').toUpperCase(),
      url: response.config.url ?? '',
      screen: response.config.eal?.screen,
      apiCode: response.config.eal?.apiCode,
      status: response.status,
      requestId: String(response.headers['x-request-id'] ?? ''),
      readableFields: (response.data as { readableFields?: string[] })?.readableFields,
      rowCount: (response.data as { content?: unknown[] })?.content?.length,
      at: Date.now(),
    })
    return response
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean }
    const status = error.response?.status
    const code = error.response?.data?.code

    const expired = status === 401 && (code === 'TOKEN_EXPIRED' || code === 'UNAUTHENTICATED')
    const refreshable = expired && original && !original._retried && !original.url?.includes('/api/auth/')

    if (refreshable) {
      original._retried = true
      try {
        // One shared refresh: a burst of 401s must not rotate the refresh token N times.
        refreshInFlight = refreshInFlight ?? refreshAccessToken().finally(() => (refreshInFlight = null))
        const token = await refreshInFlight
        original.headers.set('Authorization', `Bearer ${token}`)
        return http.request(original)
      } catch {
        tokenStore.clear()
        window.dispatchEvent(new CustomEvent('eal:session-expired'))
      }
    }

    const apiError = toApiError(error)
    recordApiCall({
      method: (original?.method ?? 'get').toUpperCase(),
      url: original?.url ?? '',
      screen: original?.eal?.screen,
      apiCode: original?.eal?.apiCode,
      status: apiError.status,
      requestId: apiError.requestId,
      errorCode: apiError.code,
      errorDetails: apiError.details,
      at: Date.now(),
    })
    return Promise.reject(apiError)
  },
)

/** GET helper that carries the screen context (spec §6) and feeds the debug drawer. */
export async function apiGet<T>(url: string, options: RequestOptions & { params?: unknown } = {}): Promise<T> {
  const { params, ...eal } = options
  const { data } = await http.get<T>(url, { params, eal })
  return data
}

export async function apiPost<T>(url: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const { data } = await http.post<T>(url, body, { eal: options })
  return data
}

export async function apiPatch<T>(url: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const { data } = await http.patch<T>(url, body, { eal: options })
  return data
}

export async function apiPut<T>(url: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const { data } = await http.put<T>(url, body, { eal: options })
  return data
}

export async function apiDelete<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await http.delete<T>(url, { eal: options })
  return data
}
