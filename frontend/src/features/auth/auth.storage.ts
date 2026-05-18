import type { AuthSession, UserGender, UserProfile } from './auth.types'

const AUTH_STORAGE_KEY = 'echofit.auth'

function normalizeGender(value: unknown): UserGender {
  return value === 'female' ? 'female' : 'male'
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return typeof candidate.id === 'string' && typeof candidate.email === 'string'
}

export function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AuthSession>
    if (typeof parsed.token !== 'string' || !isUserProfile(parsed.user)) {
      return null
    }

    return {
      token: parsed.token,
      user: {
        ...parsed.user,
        gender: normalizeGender((parsed.user as Partial<UserProfile>).gender)
      }
    }
  } catch {
    return null
  }
}

export function writeStoredSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
