import { create } from 'zustand'

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export interface User {
  id: number
  email: string
  name: string
}

interface AuthResponse {
  user: User
  accessToken: string
}

interface AuthState {
  user: User | null
  // The access token lives only in memory (this store), never in localStorage,
  // so an XSS payload can't simply read it from storage. It's lost on reload,
  // and restoreSession() gets a new one using the httpOnly refresh cookie.
  accessToken: string | null
  // 'checking' until the first restoreSession() finishes, so the UI doesn't
  // flash the "logged out" state on reload.
  status: 'checking' | 'ready'
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<boolean>
  restoreSession: () => Promise<void>
}

// Reads the backend's error format: { error } or { error, details: [{ path, message }] }.
export async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null)
  if (body?.details?.length) {
    return body.details.map((d: { path: string; message: string }) => d.message).join(', ')
  }
  return body?.error ?? `Request failed with status ${res.status}`
}

async function postAuth(path: string, body?: unknown): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/${path}`, {
    method: 'POST',
    credentials: 'include', // send/receive the httpOnly refresh cookie
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

// The backend rotates the refresh token on every use, so two simultaneous
// refreshes would make the second one fail. Share a single in-flight request.
let refreshInFlight: Promise<boolean> | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: 'checking',

  login: async (email, password) => {
    const { user, accessToken } = await postAuth('login', { email, password })
    set({ user, accessToken })
  },

  register: async (name, email, password) => {
    const { user, accessToken } = await postAuth('register', { name, email, password })
    set({ user, accessToken })
  },

  logout: async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(
      () => undefined,
    )
    set({ user: null, accessToken: null })
  },

  refresh: () => {
    refreshInFlight ??= postAuth('refresh')
      .then(({ user, accessToken }) => {
        set({ user, accessToken })
        return true
      })
      .catch(() => {
        set({ user: null, accessToken: null })
        return false
      })
      .finally(() => {
        refreshInFlight = null
      })
    return refreshInFlight
  },

  restoreSession: async () => {
    await get().refresh()
    set({ status: 'ready' })
  },
}))

// fetch() wrapper for protected endpoints: adds "Authorization: Bearer <token>".
// If the access token has expired (15 min), refreshes it once and retries.
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const withToken = (token: string | null): RequestInit => ({
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const res = await fetch(`${API_BASE}${path}`, withToken(useAuthStore.getState().accessToken))
  if (res.status !== 401) return res

  const refreshed = await useAuthStore.getState().refresh()
  if (!refreshed) return res

  return fetch(`${API_BASE}${path}`, withToken(useAuthStore.getState().accessToken))
}
