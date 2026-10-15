import type { NextFunction, Request, Response } from 'express'
import { and, desc, eq, ilike, inArray, isNull } from 'drizzle-orm'
import { db } from '../db'
import { projects, techStack } from '../db/schema'
import { ProjectInputSchema, ProjectUpdateSchema, type ProjectResponse } from '../types/project'
import { AppError } from '../middleware/AppError'

// Converts a DB row (with nested tech_stack rows from the join) into the
// flat shape the frontend expects: techStack as string[].
function toProjectResponse(row: {
  id: number
  title: string
  description: string
  githubUrl: string
  liveUrl: string | null
  ownerId: number | null
  techStack: { name: string }[]
}): ProjectResponse {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    techStack: row.techStack.map((t) => t.name),
    liveUrl: row.liveUrl ?? undefined,
    githubUrl: row.githubUrl,
    ownerId: row.ownerId,
  }
}

function parseId(raw: string): number {
  const id = Number(raw)
  if (!Number.isInteger(id)) {
    throw new AppError('Project id must be a number', 400)
  }
  return id
}

// Authorization check shared by PATCH and DELETE: the project must exist
// (404) and belong to the logged-in user (403).
async function findOwnedProject(id: number, userId: number) {
  const project = await db.query.projects.findFirst({
    where: (project, { and, eq, isNull }) => and(eq(project.id, id), isNull(project.deletedAt)),
  })

  if (!project) {
    throw new AppError(`Project with id ${id} not found`, 404)
  }
  if (project.ownerId !== userId) {
    throw new AppError('You can only modify your own projects', 403)
  }
  return project
}

// GET /api/projects  (also handles ?search=react — Bonus 2)
export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined

    let matchingIds: number[] | undefined

    if (search) {
      // ILIKE = case-insensitive LIKE in PostgreSQL. We match either the
      // project title OR any of its tech_stack names.
      const byTitle = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(isNull(projects.deletedAt), ilike(projects.title, `%${search}%`)))

      const byTech = await db
        .select({ id: techStack.projectId })
        .from(techStack)
        .innerJoin(projects, eq(techStack.projectId, projects.id))
        .where(and(isNull(projects.deletedAt), ilike(techStack.name, `%${search}%`)))

      matchingIds = Array.from(new Set([...byTitle.map((r) => r.id), ...byTech.map((r) => r.id)]))

      if (matchingIds.length === 0) {
        return res.status(200).json([])
      }
    }

    const rows = await db.query.projects.findMany({
      where: (project, { and, isNull, inArray }) =>
        matchingIds
          ? and(isNull(project.deletedAt), inArray(project.id, matchingIds))
          : isNull(project.deletedAt),
      with: { techStack: true },
      orderBy: (project, { desc }) => [desc(project.createdAt)],
    })

    res.status(200).json(rows.map(toProjectResponse))
  } catch (err) {
    next(err)
  }
}

// GET /api/projects/:id
export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      return next(new AppError('Project id must be a number', 400))
    }

    const row = await db.query.projects.findFirst({
      where: (project, { and, eq, isNull }) => and(eq(project.id, id), isNull(project.deletedAt)),
      with: { techStack: true },
    })

    if (!row) {
      return next(new AppError(`Project with id ${id} not found`, 404))
    }

    res.status(200).json(toProjectResponse(row))
  } catch (err) {
    next(err)
  }
}

// POST /api/projects
export async function postProject(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ProjectInputSchema.parse(req.body) // throws ZodError if invalid

    // Insert the project + its tech_stack rows together, so we never end
    // up with a project that has no tech_stack rows if something fails
    // halfway through.
    const created = await db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          title: parsed.title,
          description: parsed.description,
          githubUrl: parsed.githubUrl,
          liveUrl: parsed.liveUrl,
          ownerId: req.userId!, // set by requireAuth
        })
        .returning()

      const techRows = await tx
        .insert(techStack)
        .values(parsed.techStack.map((name) => ({ projectId: project.id, name })))
        .returning()

      return { ...project, techStack: techRows }
    })

    res.status(201).json(toProjectResponse(created))
  } catch (err) {
    next(err)
  }
}

// PATCH /api/projects/:id — owner only
export async function patchProject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id)
    await findOwnedProject(id, req.userId!)
    const { techStack: newTechStack, ...fields } = ProjectUpdateSchema.parse(req.body)

    await db.transaction(async (tx) => {
      if (Object.keys(fields).length > 0) {
        await tx.update(projects).set(fields).where(eq(projects.id, id))
      }
      // techStack is replaced as a whole when provided.
      if (newTechStack) {
        await tx.delete(techStack).where(eq(techStack.projectId, id))
        await tx.insert(techStack).values(newTechStack.map((name) => ({ projectId: id, name })))
      }
    })

    const updated = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: { techStack: true },
    })
    res.status(200).json(toProjectResponse(updated!))
  } catch (err) {
    next(err)
  }
}

// DELETE /api/projects/:id — owner only. Bonus 3 (Module 5): soft delete
// (sets deletedAt instead of removing the row)
export async function removeProject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id)
    await findOwnedProject(id, req.userId!)

    await db
      .update(projects)
      .set({ deletedAt: new Date() })
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
