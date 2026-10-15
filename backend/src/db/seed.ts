import 'dotenv/config'
import { db } from './index'
import { projects, techStack } from './schema'

const sampleProjects = [
  {
    title: 'Portfolio Website',
    description:
      'A personal portfolio built with React, TypeScript, and Tailwind, backed by an Express + PostgreSQL API.',
    githubUrl: 'https://github.com/dhanesmd3/portfolio',
    liveUrl: undefined,
    techStack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Express'],
  },
  {
    title: 'Recipe Finder',
    description: 'A small app to search recipes by ingredient using a public food API.',
    githubUrl: 'https://github.com/dhanesmd3/recipe-finder',
    liveUrl: 'https://recipe-finder-demo.vercel.app',
    techStack: ['React', 'JavaScript', 'REST API'],
  },
  {
    title: 'Task Tracker',
    description: 'A simple kanban-style task tracker with drag and drop columns.',
    githubUrl: 'https://github.com/dhanesmd3/task-tracker',
    liveUrl: undefined,
    techStack: ['React', 'TypeScript', 'Zustand'],
  },
  {
    title: 'Weather Dashboard',
    description: 'Displays current weather and a 5-day forecast for any searched city.',
    githubUrl: 'https://github.com/dhanesmd3/weather-dashboard',
    liveUrl: 'https://weather-dash-demo.vercel.app',
    techStack: ['JavaScript', 'HTML', 'CSS', 'REST API'],
  },
  {
    title: 'Markdown Notes',
    description: 'A lightweight notes app that renders Markdown live as you type.',
    githubUrl: 'https://github.com/dhanesmd3/markdown-notes',
    liveUrl: undefined,
    techStack: ['React', 'TypeScript', 'Vite'],
  },
]

async function seed() {
  console.log('Seeding database...')

  for (const p of sampleProjects) {
    const [project] = await db
      .insert(projects)
      .values({
        title: p.title,
        description: p.description,
        githubUrl: p.githubUrl,
        liveUrl: p.liveUrl,
      })
      .returning()

    if (p.techStack.length > 0) {
      await db.insert(techStack).values(
        p.techStack.map((name) => ({ projectId: project.id, name })),
      )
    }

    console.log(`  + ${p.title}`)
  }

  console.log('Done seeding.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
