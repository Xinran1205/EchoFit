import { create } from 'zustand'
import { fetchCurrentUser } from './auth.api'
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession
} from './auth.storage'
import type { AuthSession, UserProfile } from './auth.types'

type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

type AuthState = {
  bootstrapped: boolean
  clearSession: () => void
  bootstrap: () => Promise<void>
  setSession: (session: AuthSession) => void
  status: AuthStatus
  token: string | null
  syncCurrentUser: (user: UserProfile) => void
  user: UserProfile | null
}

const initialSession = readStoredSession()

export const useAuthStore = create<AuthState>((set, get) => ({
  bootstrapped: false,
  clearSession: () => {
    clearStoredSession()
    set({
      bootstrapped: true,
      status: 'anonymous',
      token: null,
      user: null
    })
  },
  async bootstrap() {
    if (get().bootstrapped) {
      return
    }

    const storedSession = readStoredSession()
    if (!storedSession?.token) {
      set({
        bootstrapped: true,
        status: 'anonymous',
        token: null,
        user: null
      })
      return
    }

    set({
      status: 'checking',
      token: storedSession.token,
      user: storedSession.user
    })

    try {
      const currentUser = await fetchCurrentUser()
      writeStoredSession({
        token: storedSession.token,
        user: currentUser
      })
      set({
        bootstrapped: true,
        status: 'authenticated',
        token: storedSession.token,
        user: currentUser
      })
    } catch {
      clearStoredSession()
      set({
        bootstrapped: true,
        status: 'anonymous',
        token: null,
        user: null
      })
    }
  },
  setSession: (session) => {
    writeStoredSession(session)
    set({
      bootstrapped: true,
      status: 'authenticated',
      token: session.token,
      user: session.user
    })
  },
  status: initialSession ? 'checking' : 'anonymous',
  token: initialSession?.token ?? null,
  syncCurrentUser: (user) => {
    const token = get().token
    if (!token) {
      return
    }

    writeStoredSession({ token, user })
    set({
      bootstrapped: true,
      status: 'authenticated',
      user
    })
  },
  user: initialSession?.user ?? null
}))
