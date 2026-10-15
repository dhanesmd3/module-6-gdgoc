import type { Project, ProjectInput } from '../types/project'

// In-memory "database". Resets every time the server restarts —
// Module 5 will replace this with a real database.
let projects: Project[] = [
  {
    id: 1,
    title: 'Portfolio Website',
    description:
      'Started as a static HTML/CSS landing page, now a React + TypeScript app styled with Tailwind, backed by a Zustand store, and now talking to a real Express API.',
    techStack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Zustand', 'Express'],
    githubUrl: 'https://github.com/dhanesmd3/portfolio',
  },
  {
    id: 2,
    title: 'Coming Soon',
    description: 'A placeholder for the next project I build while learning full-stack development.',
    techStack: ['React', 'TypeScript'],
    githubUrl: 'https://github.com/dhanesmd3',
  },
]

let nextId = 3

export function getAllProjects(): Project[] {
  return projects
}

export function getProjectById(id: number): Project | undefined {
  return projects.find((project) => project.id === id)
}

export function createProject(input: ProjectInput): Project {
  const newProject: Project = { id: nextId, ...input }
  nextId += 1
  projects.push(newProject)
  return newProject
}

export function deleteProject(id: number): boolean {
  const initialLength = projects.length
  projects = projects.filter((project) => project.id !== id)
  return projects.length < initialLength
}
