import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  githubCallback,
  githubStart,
  login,
  logout,
  me,
  refresh,
  register,
} from '../controllers/auth.controller'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

// Slows down password guessing. Only applied to the credential endpoints,
// since /refresh runs on every page load.
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
})

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Create an account
 *     description: Hashes the password with bcrypt, returns a 15-minute access token, and sets a 7-day refresh token as an httpOnly cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: "{ user, accessToken }"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post('/register', credentialsLimiter, register)

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: "{ user, accessToken }"
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', credentialsLimiter, login)

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Get a new access token using the refresh token cookie (rotates the cookie)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: "{ user, accessToken }"
 *       401:
 *         description: Missing, expired, or revoked refresh token
 */
router.post('/refresh', refresh)

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Revoke the refresh token and clear the cookie
 *     tags: [Auth]
 *     responses:
 *       204:
 *         description: Logged out
 */
router.post('/logout', logout)

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the currently logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The current user
 *       401:
 *         description: Missing, invalid, or expired token
 */
router.get('/me', requireAuth, me)

/**
 * @openapi
 * /api/auth/github:
 *   get:
 *     summary: Start "Login with GitHub" (redirects to GitHub)
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to github.com/login/oauth/authorize
 *       501:
 *         description: GitHub OAuth is not configured
 */
router.get('/github', githubStart)
router.get('/github/callback', githubCallback)

export default router
