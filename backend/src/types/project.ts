import { z } from 'zod'

export const ProjectInputSchema = z.object({
  title: z.string().min(1, 'title is required').max(100),
  description: z.string().min(10, 'description must be at least 10 characters').max(500),
  techStack: z.array(z.string()).min(1, 'at least one technology is required'),
  liveUrl: z.string().url('liveUrl must be a valid URL').optional(),
  githubUrl: z.string().url('githubUrl must be a valid URL'),
})

export type ProjectInput = z.infer<typeof ProjectInputSchema>

// Shape returned by the API — matches the frontend's Project type exactly,
// so no frontend changes are needed for this module.
export interface ProjectResponse {
  id: number
  title: string
  description: string
  techStack: string[]
  liveUrl?: string
  githubUrl: string
}
