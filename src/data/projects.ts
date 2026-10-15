import type { Project } from '../types/project'

export const initialProjects: Project[] = [
  {
    id: 1,
    title: 'Portfolio Website',
    description:
      'This very site — started as a static HTML/CSS landing page, now a React + TypeScript app styled with Tailwind and backed by a Zustand store.',
    techStack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Zustand'],
    githubUrl: 'https://github.com/dhanesmd3/portfolio',
  },
  {
    id: 2,
    title: 'Coming Soon',
    description:
      'A placeholder for the next project I build while learning React and TypeScript.',
    techStack: ['React', 'TypeScript'],
    githubUrl: 'https://github.com/dhanesmd3',
  },
]
