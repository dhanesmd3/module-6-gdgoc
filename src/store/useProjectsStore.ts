import { create } from 'zustand'
import type { Project } from '../types/project'

// Base URL of the backend API. Falls back to localhost for local dev.
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

interface ProjectsState {
  projects: Project[]
  loading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  addProject: (input: Omit<Project, 'id'>) => Promise<void>
  removeProject: (id: number) => Promise<void>
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  loading: false,
  error: null,

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

  addProject: async (input) => {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error ?? `Request failed with status ${res.status}`)
    }
    const created: Project = await res.json()
    set((state) => ({ projects: [...state.projects, created] }))
  },

  removeProject: async (id) => {
    const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      throw new Error(`Request failed with status ${res.status}`)
    }
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
  },
}))
