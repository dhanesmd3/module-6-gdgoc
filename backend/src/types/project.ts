import { z } from 'zod'

export const ProjectInputSchema = z.object({
  title: z.string().min(1, 'title is required').max(100),
  description: z.string().min(10, 'description must be at least 10 characters').max(500),
  techStack: z.array(z.string()).min(1, 'at least one technology is required'),
  liveUrl: z.string().url('liveUrl must be a valid URL').optional(),
  githubUrl: z.string().url('githubUrl must be a valid URL'),
})

export type ProjectInput = z.infer<typeof ProjectInputSchema>

// PATCH body: every field optional, at least one required.
// liveUrl may be null to remove it.
export const ProjectUpdateSchema = ProjectInputSchema.extend({
  liveUrl: z.string().url('liveUrl must be a valid URL').nullable(),
})
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'at least one field must be provided')

export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>

// Shape returned by the API — matches the frontend's Project type.
export interface ProjectResponse {
  id: number
  title: string
  description: string
  techStack: string[]
  liveUrl?: string
  githubUrl: string
  ownerId: number | null
}
