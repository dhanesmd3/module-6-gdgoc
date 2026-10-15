import { create } from 'zustand'
import type { Project, ProjectInput } from '../types/project'
import { API_BASE, authFetch, readError } from './useAuthStore'

interface ProjectsState {
  projects: Project[]
  loading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  addProject: (input: ProjectInput) => Promise<void>
  updateProject: (id: number, input: ProjectInput) => Promise<void>
  removeProject: (id: number) => Promise<void>
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  loading: false,
  error: null,

  // Reading projects is public, so this uses plain fetch.
  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/projects`)
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      const data: Project[] = await res.json()
      set({ projects: data, loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load projects',
        loading: false,
      })
    }
  },

  // Write operations go through authFetch, which attaches the JWT.
  addProject: async (input) => {
    const res = await authFetch('/projects', { method: 'POST', body: JSON.stringify(input) })
    if (!res.ok) throw new Error(await readError(res))
    const created: Project = await res.json()
    set((state) => ({ projects: [created, ...state.projects] }))
  },

  updateProject: async (id, input) => {
    const res = await authFetch(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...input, liveUrl: input.liveUrl ?? null }),
    })
    if (!res.ok) throw new Error(await readError(res))
    const updated: Project = await res.json()
    set((state) => ({ projects: state.projects.map((p) => (p.id === id ? updated : p)) }))
  },

  removeProject: async (id) => {
    const res = await authFetch(`/projects/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await readError(res))
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
  },
}))
