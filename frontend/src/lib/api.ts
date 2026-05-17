import { clearStoredSession, readStoredSession } from '../features/auth/auth.storage'

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
}

type RequestOptions = {
  body?: unknown
  headers?: HeadersInit
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  signal?: AbortSignal
}

const DEFAULT_API_BASE_URL = '/api'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
  /\/$/,
  ''
)

let unauthorizedHandler: (() => void) | null = null

export class ApiError extends Error {
  code: number
  status: number

  constructor(message: string, code: number, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export function getErrorMessage(
  error: unknown,
  fallback = '请求失败，请稍后重试'
) {
  if (error instanceof ApiError && error.message) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const session = readStoredSession()
  const headers = new Headers(options.headers)

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  let body: BodyInit | undefined
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
    signal: options.signal
  })

  const rawText = await response.text()
  let payload: ApiEnvelope<T> | null = null

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as ApiEnvelope<T>
    } catch {
      payload = null
    }
  }

  const failureCode = payload?.code ?? response.status
  const failureMessage = payload?.message ?? '请求失败，请稍后重试'

  if (!response.ok || payload?.code !== 0 || payload === null) {
    if (response.status === 401 || failureCode === 40100) {
      clearStoredSession()
      unauthorizedHandler?.()
    }

    throw new ApiError(failureMessage, failureCode, response.status)
  }

  return payload.data
}

export const api = {
  delete<T>(path: string, options?: Omit<RequestOptions, 'method'>) {
    return request<T>(path, { ...options, method: 'DELETE' })
  },
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, method: 'GET' })
  },
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, body, method: 'PATCH' })
  },
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, body, method: 'POST' })
  },
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, body, method: 'PUT' })
  }
}
