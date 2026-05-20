import { clearStoredSession, readStoredSession } from '../features/auth/auth.storage'

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
}

type RequestOptions = {
  body?: FormData | unknown
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

export function getErrorMessage(error: unknown, fallback = '请求失败，请稍后重试') {
  if (error instanceof ApiError && error.message) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function createAuthorizedHeaders(headers?: HeadersInit) {
  const session = readStoredSession()
  const mergedHeaders = new Headers(headers)

  if (session?.token) {
    mergedHeaders.set('Authorization', `Bearer ${session.token}`)
  }

  return mergedHeaders
}

async function fetchWithAuth(path: string, options: RequestOptions = {}) {
  const headers = createAuthorizedHeaders(options.headers)
  let body: BodyInit | undefined

  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
    signal: options.signal
  })
}

function handleUnauthorizedIfNeeded(status: number, code: number) {
  if (status === 401 || code === 40100) {
    clearStoredSession()
    unauthorizedHandler?.()
  }
}

async function parseFailure(response: Response) {
  const rawText = await response.text()

  if (rawText) {
    try {
      const payload = JSON.parse(rawText) as ApiEnvelope<unknown>
      const failureCode = payload.code ?? response.status
      const failureMessage = payload.message ?? '请求失败，请稍后重试'
      handleUnauthorizedIfNeeded(response.status, failureCode)
      throw new ApiError(failureMessage, failureCode, response.status)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
    }
  }

  handleUnauthorizedIfNeeded(response.status, response.status)
  throw new ApiError('请求失败，请稍后重试', response.status, response.status)
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetchWithAuth(path, options)
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
    handleUnauthorizedIfNeeded(response.status, failureCode)
    throw new ApiError(failureMessage, failureCode, response.status)
  }

  return payload.data
}

export async function fetchApiBlob(path: string, options?: Omit<RequestOptions, 'body' | 'method'>) {
  const response = await fetchWithAuth(path, { ...options, method: 'GET' })
  if (!response.ok) {
    await parseFailure(response)
  }
  return response.blob()
}

export const api = {
  delete<T>(path: string, options?: Omit<RequestOptions, 'method'>) {
    return request<T>(path, { ...options, method: 'DELETE' })
  },
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, method: 'GET' })
  },
  patch<T>(path: string, body?: FormData | unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, body, method: 'PATCH' })
  },
  post<T>(path: string, body?: FormData | unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, body, method: 'POST' })
  },
  put<T>(path: string, body?: FormData | unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(path, { ...options, body, method: 'PUT' })
  }
}
