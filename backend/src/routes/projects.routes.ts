import { Router } from 'express'
import {
  getProject,
  listProjects,
  patchProject,
  postProject,
  removeProject,
} from '../controllers/projects.controller'
import { requireAuth } from '../middleware/requireAuth'

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
 *     summary: Create a new project (owned by the logged-in user)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Missing, invalid, or expired token
 */
router.post('/', requireAuth, postProject)

/**
 * @openapi
 * /api/projects/{id}:
 *   patch:
 *     summary: Update a project (owner only). Any subset of fields; techStack replaces the whole list.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *                 nullable: true
 *               githubUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated project
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing, invalid, or expired token
 *       403:
 *         description: Project belongs to another user
 *       404:
 *         description: Project not found
 */
router.patch('/:id', requireAuth, patchProject)

/**
 * @openapi
 * /api/projects/{id}:
 *   delete:
 *     summary: Soft-delete a project by id (owner only; sets deletedAt, does not remove the row)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted successfully, no content returned
 *       401:
 *         description: Missing, invalid, or expired token
 *       403:
 *         description: Project belongs to another user
 *       404:
 *         description: Project not found
 */
router.delete('/:id', requireAuth, removeProject)

export default router
