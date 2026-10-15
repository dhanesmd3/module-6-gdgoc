import { Router } from 'express'
import {
  getProject,
  listProjects,
  postProject,
  removeProject,
} from '../controllers/projects.controller'

const router = Router()

/**
 * @openapi
 * /api/projects:
 *   get:
 *     summary: List all projects (optionally filtered by search)
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search across project title and tech stack names (uses PostgreSQL ILIKE)
 *     responses:
 *       200:
 *         description: An array of projects
 */
router.get('/', listProjects)

/**
 * @openapi
 * /api/projects/{id}:
 *   get:
 *     summary: Get a single project by id
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The requested project
 *       404:
 *         description: Project not found
 */
router.get('/:id', getProject)

/**
 * @openapi
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, techStack, githubUrl]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               techStack:
 *                 type: array
 *                 items:
 *                   type: string
 *               liveUrl:
 *                 type: string
 *               githubUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created project
 *       400:
 *         description: Validation error
 */
router.post('/', postProject)

/**
 * @openapi
 * /api/projects/{id}:
 *   delete:
 *     summary: Soft-delete a project by id (sets deletedAt, does not remove the row)
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted successfully, no content returned
 *       404:
 *         description: Project not found
 */
router.delete('/:id', removeProject)

export default router
